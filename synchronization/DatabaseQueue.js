const { default: mongoose } = require("mongoose");
const LightQueue = require("./LightQueue");
const ServerData = require("./ServerData");
const SyncMetadata = require("./SyncMetadata");
const { inspect } = require("util");
const DocumentInsertResponse = require("./DocumentInsertResponse");
const { v7: uuidv7 } = require("uuid");

class DatabaseQueue {
  constructor(Model, tableName, beforeLocalInsert, onInsertLocalAfter, io) {
    this.io = io;
    this.Model = Model;
    this.tableName = tableName;
    this.onInsertLocalAfter = onInsertLocalAfter;
    this.beforeLocalInsert = beforeLocalInsert;

    this.lightQueue = new LightQueue();
  }

  async addTaskDataInQueue({ res, docs }) {
    const task = async () => {
      const session = await mongoose.startSession();

      try {
        session.startTransaction();

        if (this.beforeLocalInsert != null) {
          await this.beforeLocalInsert({
            res,
            docs,
            session,
          });
        }
        const { documentsCreatedLocal, documentsUpdates, syncCodeMax } =
          await this.insertToServer({
            docs,
            session,
          });
        await session.commitTransaction();
        console.log("NOTIFICANDO CAMBIOS");
        this.io.emit("serverChanged");
        if (this.onInsertLocalAfter != null) {
          try {
            const result = this.onInsertLocalAfter(documentsCreatedLocal);
            if (result instanceof Promise) {
              result.catch((error) =>
                console.log("onInsertAfter ERROR (async):", error)
              );
            }
          } catch (error) {
            console.log("onInsertAfter ERROR (sync):", error);
          }
        }
        // console.log("devolviendoOOOOO", documentsCreatedLocal);
        return { docs: documentsUpdates, syncCodeMax };
      } catch (error) {
        await session.abortTransaction();
        console.error("Error en la transacción, se ha revertido:", error);
        throw error;
      } finally {
        await session.endSession();
      }
    };

    return await this.lightQueue.add(task);
  }
  async instantReplacement({ doc, filter }) {
    // console.log("INSTANT DATOS ANTES ", inspect(doc, true, 99));
    doc = this.completeFieldsToInsert(doc);
    return new Promise((resolve, reject) => {
      this.lightQueue.add(async () => {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
          doc.syncCode = await this.updateAndGetSyncCode(
            this.tableName,
            session
          );
          filter ??= {};
          // console.log(
          //   "SE INSTANREPLACEMENTE PARA ",
          //   this.tableName,
          //   " CON DATA: ",
          //   inspect(doc, true, 99)
          // );
          await this.Model.updateOne(
            { uuid: doc.uuid, ...filter },
            {
              $set: doc,
            },
            { session }
          );
          await session.commitTransaction();
          resolve();
        } catch (error) {
          reject(error);
          await session.abortTransaction();
          console.error("Error en la transacción, se ha revertido:", error);
        } finally {
          await session.endSession();
        }
      });
    });
  }

  async createOrGet({ doc, filterFields = ["uuid"], session }) {
    if (filterFields.length == 0) {
      return;
    }
    doc = this.completeFieldsToInsert(doc);

    doc.syncCode = await this.updateAndGetSyncCode(this.tableName, session);
    const filter = {};
    for (const f of filterFields) {
      filter[f] = doc[f];
    }
    const updatedDocument = await this.Model.findOneAndUpdate(
      filter,
      {
        $setOnInsert: doc,
      },
      { session, new: true, upsert: true, setDefaultsOnInsert: true }
    );
  }
  async addTask({ task, useTransaction }) {
    if (useTransaction) {
      return new Promise((resolve, reject) => {
        this.lightQueue.add(async () => {
          try {
            const session = await mongoose.startSession();
            try {
              session.startTransaction();
              await task(session);
              await session.commitTransaction();
              resolve();
            } catch (error) {
              await session.abortTransaction();
              reject(error);
              console.error(
                "Error en la transacción PERSONALIZADA, se ha revertido:",
                error
              );
            } finally {
              await session.endSession();
            }
          } catch (error) {
            reject();
          }
        });
      });
    } else {
      return new Promise((resolve, reject) => {
        this.lightQueue.add(async () => {
          try {
            await task();
            resolve();
          } catch (error) {
            reject();
          }
        });
      });
    }
  }
  async createOrGetTransaction(doc, filterFields = ["uuid"]) {
    if (filterFields.length == 0) {
      return;
    }
    // console.log("CREATEORGET DATOS ANTES ", inspect(doc, true, 99));

    doc = this.completeFieldsToInsert(doc);
    return new Promise((resolve, reject) => {
      this.lightQueue.add(async () => {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
          // console.log(
          //   "SE CREATEORGET PARA ",
          //   this.tableName,
          //   " CON DATA: ",
          //   inspect(doc, true, 99)
          // );
          doc.syncCode = await this.updateAndGetSyncCode(
            this.tableName,
            session
          );
          const filter = {};
          for (const f of filterFields) {
            filter[f] = doc[f];
          }
          const updatedDocument = await this.Model.findOneAndUpdate(
            filter,
            {
              $setOnInsert: doc,
            },
            { session, new: true, upsert: true, setDefaultsOnInsert: true }
          );
          await session.commitTransaction();
          resolve(updatedDocument);
        } catch (error) {
          reject(error);
          await session.abortTransaction();
          console.error("Error en la transacción, se ha revertido:", error);
        } finally {
          await session.endSession();
        }
      });
    });
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
  async insertToServer({ docs, session }) {
    const newDocs = [];
    let docUuidSet = new Set();
    for (let d of docs) {
      this.completeFieldsToInsert(d);
      docUuidSet.add(d.uuid);
    }

    const serverDocs = await this.Model.find({
      uuid: { $in: Array.from(docUuidSet) },
    }).lean();
    const serverDocsMap = new Map();
    for (const sd of serverDocs) {
      serverDocsMap.set(sd.uuid, sd);
    }
    let deleteDocs = [];
    for (const d of docs) {
      const serverDoc = serverDocsMap.get(d.uuid);

      if (serverDoc == null) {
        newDocs.push(d);
        continue;
      }
      const keys = Object.keys(d);
      for (const key of keys) {
        if (
          key.endsWith("UpdatedAt") ||
          key == "uuid" ||
          key == "syncCode" ||
          key == "insertedAt"
        ) {
          continue;
        }
        const localDate = d[key + "UpdatedAt"];
        const serverDate = serverDoc[key + "UpdatedAt"];

        if (serverDate >= localDate) {
          delete d[key];
          delete d[key + "UpdatedAt"];
        }
      }
      if (Object.keys(d).length == 0) {
        deleteDocs.push(d);
      }
    }
    docs = docs.filter((doc) => !deleteDocs.includes(doc));
    if (docs.length == 0) {
      const syncCode = await this.getCurrentSyncCode(this.tableName);

      return {
        documentsCreatedLocal: [],
        documentsUpdates: [],
        syncCodeMax: syncCode,
      };
    }
    const syncCode = await this.updateAndGetSyncCode(this.tableName, session);
    for (let d of docs) {
      d.syncCode = syncCode;
    }
    await this.Model.bulkWrite(
      docs.map((doc) => {
        // console.log("se va a insertar", doc);
        return {
          updateOne: {
            filter: { uuid: doc.uuid },
            update: { $set: doc },
            upsert: true,
            setDefaultsOnInsert: true,
          },
        };
      }),
      { session }
    );
    var finalDocs = [];
    for (const d of docs) {
      const serverDoc = serverDocsMap.get(d.uuid);
      finalDocs.push({ ...serverDoc, ...d });
    }
    return {
      documentsCreatedLocal: newDocs,
      //devolver documentos actualizados
      documentsUpdates: finalDocs,
      syncCodeMax: syncCode,
    };
  }
  completeFieldsToInsert(fields) {
    // if (!fields.insertedAt) {
    //   fields.insertedAt = new Date().getTime();
    // }
    if (!fields.uuid) {
      fields.uuid = uuidv7();
    }
    for (const key of Object.keys(fields)) {
      if (
        key == "uuid" ||
        key == "insertedAt" ||
        key.endsWith("UpdatedAt") ||
        fields[key] == null ||
        fields[`${key}UpdatedAt`] != null
      ) {
        continue;
      }
      fields[`${key}UpdatedAt`] = new Date().getTime();
    }
    return fields;
  }
}

module.exports = DatabaseQueue;
