const VehicleSchema = require("../models/Vehicle");
const { getModelByTenant } = require("../utils/tenant");
const ScheduleSchema = require("../models/Schedule");

const util = require("util");

module.exports.vehicle_create = async (req, res, next) => {
  try {
    const academyId = res.locals.user.academyId;
    const Vehicle = getModelByTenant(academyId, "vehicle", VehicleSchema);
    await Vehicle.create(req.body);
    res.status(200).json({});
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
module.exports.vehicle_update = async (req, res, next) => {
  try {
    const vehicle = res.locals.vehicle;
    vehicle.set({ ...req.body });
    await vehicle.save();
    res.status(200).json({});
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
module.exports.vehicle_delete = async (req, res, next) => {
  try {
    const academyId = res.locals.user.academyId;
    const Vehicle = getModelByTenant(academyId, "vehicle", VehicleSchema);
    await Vehicle.findOneAndUpdate(
      { _id: req.body.vehicleId },
      { state: "removed" }
    );
    res.status(200).json({});
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports.vehicle_list_get = async (req, res, next) => {
  try {
    const data = req.body;
    const academyId = res.locals.user.academyId;
    const Vehicle = getModelByTenant(academyId, "vehicle", VehicleSchema);

    let { makeFilter, modelFilter, plateFilter } = data;
    let findData = { state: { $ne: "removed" } };

    if (makeFilter != null) {
      findData.make = { $regex: makeFilter, $options: "i" };
    } else if (modelFilter != null) {
      findData.model = { $regex: modelFilter, $options: "i" };
    } else if (plateFilter != null) {
      findData.plate = { $regex: plateFilter, $options: "i" };
    }
    let numVehicles = (await Vehicle.countDocuments(findData)) ?? 0;
    let limit = Math.abs(data.limit) || 8;
    let numPages = Math.ceil(numVehicles / limit);
    let page = fixedPage(data.page);

    let vehicles = await Vehicle.find(findData)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(limit * page)
      .lean()
      .exec();
    res.status(200).json({ vehicles: vehicles ?? [], numPages });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
module.exports.available_vehicle_list = async (req, res, next) => {
  let data = req.body;
  const academyId = res.locals.user.academyId;
  const date = new Date(data["date"]);
  const Schedule = getModelByTenant(academyId, "schedule", ScheduleSchema);
  const schedules = await Schedule.find({ date });
  const excludedIds = [];
  for (const s of schedules) {
    excludedIds.push(s.vehicle);
  }
  const Vehicle = getModelByTenant(academyId, "vehicle", VehicleSchema);

  const vehicles = await Vehicle.find({
    _id: { $nin: excludedIds },
    state: { $ne: "removed" },
  })
    .lean()
    .exec();
  res.json({ vehicles: vehicles });
};
function fixedPage(page, numPages) {
  page = Math.abs(page) || 0;
  page = clamp(page, 0, clamp(numPages - 1, 0, Number.MAX_SAFE_INTEGER));
  return page;
}
function clamp(num, min, max) {
  return num <= min ? min : num >= max ? max : num;
}
