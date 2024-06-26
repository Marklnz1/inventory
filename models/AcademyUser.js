const mongoose = require('mongoose');
const mongodb = require('../utils/mongodb');

const Schema = mongoose.Schema;

const academyUserSchema = new Schema({
    username:String,
    password:String,
    role:String,
    academiaId:String
});
// console.log(mongodb);
const db = mongodb.useDb("user_mtc", { useCache: true });
const User = db.model('academyUser',academyUserSchema,"academyUser");
module.exports = User;