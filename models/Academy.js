const mongoose = require('mongoose');
const mongodb = require('../utils/mongodb');

const Schema = mongoose.Schema;

const academySchema = new Schema({
    name:String,
    description:String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }  
});
const db = mongodb.useDb("mtc_app", { useCache: true });
const Academy = db.model('academy',academySchema,"academy");

module.exports = Academy;