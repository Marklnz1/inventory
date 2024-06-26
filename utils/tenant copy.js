// // const mongodb = require('../utils/mongodb');
// const mongoose = require('mongoose');
// // const { Mongoose } = require('mongoose');
// const util = require('util')
// const multitenantPool = {};

// const getTenantDB = function getConnections(tenantId, modelName, schema) {
//   // Check connections lookup
//   const mCon = multitenantPool[tenantId];
//   if (mCon) {
//     if (!mCon.modelSchemas[modelName]) {
//       console.log("ENTREEEEEEEEEEEEEEEEEEEEEEEEEEE "+modelName);
//       mCon.model(modelName, schema,modelName);
//     }
//     return mCon;
//   }

//   const mongoose = new Mongoose();
//   const connect = () => mongoose.createConnection(process.env.MONGODB_URL, mongoOptions);
//   const url = process.env.MONGODB_URL.replace(/academy/, `academy_${tenantId}`);
//   const db=connect(url, {
//     useNewUrlParser: true,
//     useCreateIndex: true,
//     useUnifiedTopology: true,
//     useFindAndModify: false,
//     autoIndex: true,
//     poolSize: 10,
//     bufferMaxEntries: 0,
//     connectTimeoutMS: 10000,
//     socketTimeoutMS: 30000,
//     });
//   multitenantPool[tenantId] = db;
//   db.model(modelName, schema,modelName);
//   db.on('error', err => console.log(err));
//   db.once('open', () => console.log(`mongodb connected to ${url}`));
//   return mongoose;
// };

// exports.getModelByTenant = (tenantId, modelName, schema) => {
//   console.log(`getModelByTenant tenantId : ${tenantId}.`);
//   const tenantDb = getTenantDB(tenantId, modelName, schema);
//   return tenantDb.model(modelName);
// };