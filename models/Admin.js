const mongoose = require('mongoose');
const mongodb = require('../utils/mongodb');

const Schema = mongoose.Schema;

const adminSchema = new Schema({
    username:String,
    password:String,
    role:String
});
const db = mongodb.useDb("user_mtc", { useCache: true });
const Admin = db.model('admin',adminSchema,"admin");
module.exports = Admin;