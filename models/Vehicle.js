const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const VehicleSchema = new Schema({
    make:String,
    plate:String,
    model:String,
    description:String,
    type:String, 
    state:String,
},{ timestamps: true });
// const Vehicle = mongoose.model('vehicle',vehicleSchema,"vehicle");
module.exports = VehicleSchema;