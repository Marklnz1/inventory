const { Server } = require("socket.io");
const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const SyncMetadata = require("./SyncMetadata");
const LightQueue = require("./LightQueue");
const Change = require("./Change");
const DatabaseQueue = require("./DatabaseQueue");
const ServerData = require("./ServerData");
const { inspect } = require("util");
const { v7: uuidv7 } = require("uuid");
const { completeFieldsToInsert } = require("./sync");

class SyncServer {
  databaseQueueMap = {};
  init({ port, mongoURL, router, auth, beforeInsertGlobal }) {
    if (auth == null) {
      auth = (req, res, next) => next();
    }
    this.beforeInsertGlobal = beforeInsertGlobal;
    this.auth = auth;
    this.app = express();
    this.mongoURL = mongoURL;
    this.port = port;
    this.server = http.createServer(this.app);
    this.router = router;
    this.io = new Server(this.server);
    this._configServer();
    this.codeQueue = new LightQueue();
  }
  _configServer() {
    this.app.use(express.json({ limit: "50mb" }));
    this.io.on("connection", (socket) => {
      console.log("Cliente conectado");
      socket.on("disconnect", () => {
        console.log("Cliente desconectado");
      });
    });
    this.app.use(express.static("public"));
    this.app.use(express.json());
    this.app.use((req, res, next) => {
      res.locals.io = this.io;
      next();
    });
    this.app.set("view engine", "ejs");
    this.app.set("view engine", "html");
    this.app.engine("html", require("ejs").renderFile);
    this.router(this.app, this.auth);

    this.app.post(
      "/change/list/unprocessed/delete",
      async (req, res, next) => {
        await this.auth(req, res, next, req.body.tableName, "write");
      },
      async (req, res) => {
        const tempCodes = req.body["tempCodes"];
        console.log("SE ELIMINARA LOS TEMP CODE => " + tempCodes);
        await Change.deleteMany({
          tableName: req.body.tableName,
          tempCode: { $in: tempCodes },
        });

        res.json({ status: "ok" });
      }
    );
    this.app.post(
      "/verify",
      async (req, res, next) => {
        await this.auth(req, res, next, "verify", "read");
      },
      async (req, res) => {
        const tableNames = req.body.tableNames;
        if (res.locals.verifyTables) {
          tableNames.filter((element) =>
            res.locals.verifyTables.includes(element)
          );
        }
        let syncMetadataList = await SyncMetadata.find({
          tableName: { $in: tableNames },
        });
        const foundNames = syncMetadataList.map(
          (syncMetadata) => syncMetadata.tableName
        );
        const notFoundNames = tableNames.filter(
          (tableName) => !foundNames.includes(tableName)
        );

        if (notFoundNames) {
          const newSyncMetadataList = await SyncMetadata.insertMany(
            notFoundNames.map((tableName) => ({
              tableName: tableName,
            }))
          );
          syncMetadataList = syncMetadataList.concat(newSyncMetadataList);
        }

        const syncMetadataMap = Object.fromEntries(
          syncMetadataList.map((syncMetadata) => [
            syncMetadata.tableName,
            syncMetadata.syncCodeMax,
          ])
        );
        const serverData = await ServerData.findOne();

        const unprocessedChanges = await Change.find({
          tempCode: { $lte: serverData.processedTempCode },
        }).lean();
        res.json({
          syncTable: syncMetadataMap,
          unprocessedChanges,
          serverData,
        });
      }
    );
  }
  syncPost({
    model,
    tableName,
    beforeLocalInsert,
    onInsertLocalAfter,
    onCreatePreviousServer,
    excludedFields = [],
    filterLocalResponse,
  }) {
    var beforeLocalInsertFinal;
    if (this.beforeInsertGlobal != null) {
      beforeLocalInsertFinal = async ({ res, docs, session }) => {
        await this.beforeInsertGlobal(res, tableName, docs, session);
        if (beforeLocalInsert != null) {
          await beforeLocalInsert({ res, docs, session });
        }
      };
    } else {
      beforeLocalInsertFinal = beforeLocalInsert;
    }
    this.databaseQueueMap[tableName] = new DatabaseQueue(
      model,
      tableName,
      beforeLocalInsertFinal,
      onInsertLocalAfter,
      this.io
    );
    let selectFields = excludedFields.map((field) => `-${field}`).join(" ");
    this.app.post(
      `/${tableName}/list/sync`,
      async (req, res, next) => {
        await this.auth(req, res, next, tableName, "read");
      },
      async (req, res, next) => {
        const task = async () => {
          try {
            let findData = {
              syncCode: { $gt: req.body["syncCodeMax"] },
              // status: { $ne: "Deleted" },
              ...(filterLocalResponse == null
                ? {}
                : filterLocalResponse(req, res)),
            };
            // console.log("EL FINDDATA ES ", inspect(findData, true, 99));
            let docs = await model
              .find(findData)
              .select(selectFields)
              .lean()
              .exec();

            let syncCodeMax;

            if (filterLocalResponse != null) {
              syncCodeMax = await this.getCurrentSyncCode(tableName);
            } else {
              syncCodeMax =
                docs.length == 0
                  ? 0
                  : Math.max(...docs.map((doc) => doc.syncCode));
            }

            res.status(200).json({ docs: docs ?? [], syncCodeMax });
          } catch (error) {
            res.status(400).json({ error: error.message });
          }
        };
        if (filterLocalResponse != null) {
          this.codeQueue.add(task);
        } else {
          await task();
        }
      }
    );
    this.app.post(
      `/${tableName}/create`,
      async (req, res, next) => {
        await this.auth(req, res, next, tableName, "write");
      },
      async (req, res, next) => {
        try {
          if (onCreatePreviousServer) {
            await onCreatePreviousServer(req.body);
          }
          await this.databaseQueueMap[tableName].createOrGetTransaction(
            req.body
          );
          res.json({ msg: "ok" });
        } catch (error) {
          res.json({ error: error.toString() });
        }
      }
    );
    this.app.post(
      `/${tableName}/update/list/sync`,
      async (req, res, next) => {
        await this.auth(req, res, next, tableName, "write");
      },
      async (req, res, next) => {
        this.codeQueue.add(async () => {
          try {
            var { docs, syncCodeMax } = await this.databaseQueueMap[
              tableName
            ].addTaskDataInQueue({
              res,
              docs: req.body["docs"],
            });
            // console.log("devolviendo ", syncCodeMax, docs);
            res.status(200).json({ docs, syncCodeMax });
          } catch (error) {
            res.status(400).json({ error: error.message });
          }
        });
      }
    );
  }

  async start({ exec } = {}) {
    this.syncPost({ model: ServerData, tableName: "serverData" });

    await mongoose.connect(this.mongoURL, {
      autoIndex: true,
      maxPoolSize: 50,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 30000,
    });
    const syncCodeMax = await this.updateAndGetSyncCode("serverData");
    await ServerData.findOneAndUpdate(
      { uuid: "momo" },
      {
        $set: { syncCode: syncCodeMax },
        $inc: { restartCounter: 1 },
      },
      {
        upsert: true,
        setDefaultsOnInsert: true,
        runValidators: true,
        context: "query",
      }
    );

    const tempCode = await this.updateAndGetTempCode();
    await this.updateProcessedTempCode(tempCode);
    if (exec != null) {
      await exec();
    }
    this.server.listen(this.port, () => {
      console.log("SERVER ACTIVO: PUERTO USADO :" + this.port);
    });
  }
  async updateProcessedTempCode(tempCode) {
    await ServerData.findOneAndUpdate(
      {},
      { processedTempCode: tempCode },
      { upsert: true, setDefaultsOnInsert: true }
    );
  }
  async updateAndGetTempCode() {
    const serverData = await ServerData.findOneAndUpdate(
      {},
      {
        $inc: {
          tempCodeMax: 1,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return serverData.tempCodeMax;
  }
  async getCurrentSyncCode(tableName) {
    let syncCodeTable = await SyncMetadata.findOne({ tableName });
    return syncCodeTable?.syncCodeMax ?? 0;
  }
  async updateAndGetSyncCode(tableName, session = null) {
    const options = { new: true, upsert: true };
    if (session) {
      options.session = session;
    }
    let syncCodeTable = await SyncMetadata.findOneAndUpdate(
      { tableName },
      { $inc: { syncCodeMax: 1 } },
      options
    );
    return syncCodeTable.syncCodeMax;
  }
  async instantReplacement({ tableName, doc, filter }) {
    await this.databaseQueueMap[tableName].instantReplacement({ doc, filter });
  }
  async createOrGetTransaction({ tableName, doc, filterFields }) {
    await this.databaseQueueMap[tableName].createOrGetTransaction(
      doc,
      filterFields
    );
  }
  async createOrGet({ tableName, doc, filterFields, session }) {
    await this.databaseQueueMap[tableName].createOrGet({
      doc,
      filterFields,
      session,
    });
  }
  async addTask({ tableName, task, useTransaction }) {
    // console.log(
    //   "la tabla es ",
    //   tableName,
    //   " LA BASE ES ",
    //   Object.keys(this.databaseQueueMap),
    //   this.databaseQueueMap[tableName]
    // );
    await this.databaseQueueMap[tableName].addTask({ task, useTransaction });
  }
}

module.exports = new SyncServer();
