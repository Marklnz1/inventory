// const mongodb = require('../utils/mongodb');
const { Mongoose } = require("mongoose");
const util = require("util");
const multitenantPool = {};

const getTenantDB = function getConnections(tenantId, modelName, schema) {
  // Check connections lookup
  const mCon = multitenantPool[tenantId];
  if (mCon) {
    if (!mCon.models[modelName]) {
      // console.log("ENTREEEEEEEEEEEEEEEEEEEEEEEEEEE " + modelName);
      mCon.model(modelName, schema, modelName);
    }
    return mCon;
  }

  const mongoose = new Mongoose();
  const url = process.env.MONGODB_URL.replace(/academy/, `academy_${tenantId}`);
  mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  multitenantPool[tenantId] = mongoose;
  mongoose.model(modelName, schema, modelName);
  mongoose.connection.on("error", (err) => console.log(err));
  mongoose.connection.once("open", () =>
    console.log(`mongodb connected to ${url}`)
  );
  return mongoose;
};

exports.getModelByTenant = (tenantId, modelName, schema) => {
  console.log(`getModelByTenant tenantId : ${tenantId}.`);
  const tenantDb = getTenantDB(tenantId, modelName, schema);
  return tenantDb.model(modelName);
};
