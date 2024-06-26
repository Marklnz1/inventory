const validator = require("validator");
const VehicleSchema = require("../models/Vehicle");
const { getModelByTenant } = require("../utils/tenant");
const util = require("util");
module.exports.vehicle_create = async (req, res, next) => {
  try {
    const academyId = res.locals.user.academyId;
    const { make, model, plate, description, type } = req.body ?? {};
    req.body = { make, model, plate, description, type };

    validateMakeModelDescription("Marca", make);
    validateMakeModelDescription("Modelo", model);
    validateMakeModelDescription("Descripción", description);
    validateType(type);
    await validatePlate(plate, null, academyId);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }

  next();
};
module.exports.vehicle_update = async (req, res, next) => {
  try {
    const academyId = res.locals.user.academyId;
    const { id, make, model, plate, description, type } = req.body ?? {};
    req.body = { make, model, plate, description, type };

    const vehicle = await validateVehicleId(id, academyId);
    res.locals.vehicle = vehicle;
    validateMakeModelDescription("Marca", make);
    validateMakeModelDescription("Modelo", model);
    validateMakeModelDescription("Descripción", description);
    validateType(type);
    await validatePlate(plate, null, academyId);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
  next();
};
async function validateVehicleId(vehicleId, academyId) {
  let vehicle;
  try {
    const Vehicle = getModelByTenant(academyId, "vehicle", VehicleSchema);

    vehicle = await Vehicle.findById(vehicleId);
    if (vehicle) {
      return vehicle;
    }
  } catch (error) {
    throw new Error("Error al verificar al Vehiculo");
  }
  if (!vehicle) {
    throw new Error("No se encontro al Vehiculo");
  }
}
async function validatePlate(plate, vehicleId, academyId) {
  if (typeof plate !== "string" || validator.isEmpty(plate)) {
    throw new Error("Placa : Es invalido");
  }
  if (!validator.isLength(plate, { min: 1, max: 40 })) {
    throw new Error("Placa : Se acepta un maximo de 40 letras");
  }
  let vehicle;
  try {
    const Vehicle = getModelByTenant(academyId, "vehicle", VehicleSchema);
    vehicle = await Vehicle.findOne({
      plate: plate,
      _id: { $ne: vehicleId },
    });
  } catch (error) {
    throw new Error("Error al verificar el Vehiculo");
  }
  if (vehicle) {
    throw new Error("La placa le pertenece a otro Vehiculo");
  }
}
function validateType(type) {
  if (type != "propio" && type != "alquilado") {
    throw new Error("El tipo de Vehiculo es invalido");
  }
}
function validateMakeModelDescription(field, value) {
  if (typeof value !== "string" || validator.isEmpty(value)) {
    throw new Error(field + " : Es invalido");
  }
  if (!validator.isLength(value, { min: 1, max: 40 })) {
    throw new Error(field + " : Se acepta un maximo de 40 letras");
  }
}
