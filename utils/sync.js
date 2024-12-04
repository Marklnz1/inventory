const SyncCodeTable = require("../models/SyncCodeTable");

module.exports.getSyncCodeTable = async () => {
  let syncCodeTable = await SyncCodeTable.findOne();
  if (!syncCodeTable) {
    syncCodeTable = new SyncCodeTable({
      product: 0,
      movement: 0,
      invoice: 0,
      payment: 0,
      sale: 0,
      cashRegister: 0,
      client: 0,
    });
    await syncCodeTable.save();
  }
  return syncCodeTable;
};
module.exports.updateAndGetSyncCode = async (table, numberOfDocuments) => {
  const $inc = {};
  $inc[table] = numberOfDocuments;
  let syncCodeTable = await SyncCodeTable.findOneAndUpdate(
    {},
    { $inc },
    { new: true, upsert: true }
  );

  return syncCodeTable[table];
};
