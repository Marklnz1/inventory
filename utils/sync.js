const SyncMetadata = require("../models/SyncMetadata");
const util = require("util");

module.exports.list_sync = async (Model, req, res, next) => {
  try {
    let { syncCodeMax } = req.body;

    let findData = {
      syncCode: { $gt: syncCodeMax },
      status: { $ne: "Deleted" },
    };

    let docs = await Model.find(findData).lean().exec();
    const syncCodeMaxDB = docs.reduce((max, doc) => {
      return doc.syncCode > max ? doc.syncCode : max;
    }, docs[0].syncCode);
    res.status(200).json({ docs: docs ?? [], syncCodeMax: syncCodeMaxDB });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
module.exports.update_list_sync = async (Model, tableName, req, res, next) => {
  try {
    let docs = req.body["docs"];
    const docsMap = {};
    for (const doc of docs) {
      docsMap[doc.uuid] = doc;
    }

    const uuids = docs.map((doc) => doc.uuid);

    const docDB = await Model.find({ uuid: { $in: uuids } })
      .lean()
      .exec();
    const docsDBmap = {};
    for (const docdb of docDB) {
      docsDBmap[docdb.uuid] = docdb;
    }
    for (const uuid of uuids) {
      if (!docsDBmap[uuid]) {
        continue;
      }
      docsMap[uuid] = processDocument(docsMap[uuid], docsDBmap[uuid]);
    }

    docs = Object.values(docsMap);
    await Model.bulkWrite(
      docs.map((product) => {
        const { version, ...docWithoutVersion } = product;
        return {
          updateOne: {
            filter: { uuid: product.uuid },
            //PROBLEMA CUANDO EL DOCUMENTO SE ESTA CRAENDO
            update: { $set: docWithoutVersion, $inc: { version: 1 } },
            upsert: true,
          },
        };
      })
    );
    const syncCodeMax = await updateAndGetSyncCode(tableName, docs.length);
    let syncCodeMin = syncCodeMax - docs.length + 1;

    const bulkOps = uuids.map((uuid, index) => ({
      updateOne: {
        filter: { uuid: uuid },
        update: { $set: { syncCode: syncCodeMin + index } },
      },
    }));
    await Model.bulkWrite(bulkOps);
    res.status(200).json({ syncCodeMax });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
function processDocument(doc, docDB) {
  for (const key in doc) {
    if (key.endsWith("UpdatedAt")) {
      const field = key.slice(0, -9);
      doc = { ...doc, ...getRecentFields(field, doc, docDB) };
    }
  }
  return doc;
}
function getRecentFields(field, doc, docDB) {
  const date = new Date(doc[`${field}UpdatedAt`]);
  const dateDB = docDB[`${field}UpdatedAt`];
  const response = {};
  response[field] = date > dateDB ? doc[field] : docDB[field];
  response[`${field}UpdatedAt`] = date > dateDB ? date : dateDB;
  return response;
}
// module.exports.getSyncCodeTable = async () => {
//   let syncCodeTable = await SyncCodeTable.findOne();
//   if (!syncCodeTable) {
//     syncCodeTable = new SyncCodeTable({
//       product: 0,
//       movement: 0,
//       invoice: 0,
//       payment: 0,
//       sale: 0,
//       cashRegister: 0,
//       client: 0,
//     });
//     await syncCodeTable.save();
//   }
//   return syncCodeTable;
// };
const updateAndGetSyncCode = async (tableName, numberOfDocuments) => {
  const $inc = {};
  $inc.syncCodeMax = numberOfDocuments;
  let syncCodeTable = await SyncMetadata.findOneAndUpdate(
    { tableName },
    { $inc },
    { new: true, upsert: true }
  );
  return syncCodeTable.syncCodeMax;
};
module.exports.generateFields = (fields) => {
  fields.status = String;
  for (const key in fields) {
    if (fields.hasOwnProperty(key)) {
      fields[`${key}UpdatedAt`] = Date;
    }
  }

  const finalFields = {
    uuid: String,
    syncCode: Number,
    version: Number,
    ...fields,
  };

  return finalFields;
};
