const ScheduleSchema = require("../models/Schedule");
const VehicleSchema = require("../models/Vehicle");
const ClientSchema = require("../models/Client");
const mongoose = require("mongoose");
const util = require("util");

const { getModelByTenant } = require("../utils/tenant");

module.exports.schedule_delete = async (req, res, next) => {
  try {
    const academyId = res.locals.user.academyId;
    const Schedule = getModelByTenant(academyId, "schedule", ScheduleSchema);
    await Schedule.findOneAndUpdate(
      { _id: req.body.scheduleId },
      { state: "removed" }
    );
    res.status(200).json({});
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports.schedule_list_get = async (req, res, next) => {
  try {
    let data = req.body;
    const academyId = res.locals.user.academyId;
    const Schedule = getModelByTenant(academyId, "schedule", ScheduleSchema);
    getModelByTenant(academyId, "vehicle", VehicleSchema);
    getModelByTenant(academyId, "client", ClientSchema);
    let limit = Math.abs(data.limit) || 8;
    let page = fixedPage(data.page);
    let nameFilter = req.body.nameFilter;
    let dniFilter = req.body.dniFilter;
    let matchData = {
      state: { $ne: "removed" },
      "client.state": { $ne: "removed" },
    };
    let baseAgregate = [
      ...idStringToObjectDB([
        ["client", "client"],
        ["vehicle", "vehicle"],
      ]),
    ];
    if (dniFilter != null) {
      matchData["client.dni"] = dniFilter;
    } else if (nameFilter != null) {
      matchData["client.name"] = { $regex: nameFilter, $options: "i" };
    } else if (req.body["date"] != null) {
      const date = new Date(req.body["date"]);
      matchData["date"] = date;
    } else if (req.body["clientId"] != null) {
      matchData["client._id"] = mongoose.Types.ObjectId.createFromHexString(
        req.body["clientId"]
      );
    } else if (req.body["vehicleId"] != null) {
      matchData["vehicle._id"] = mongoose.Types.ObjectId.createFromHexString(
        req.body["vehicleId"]
      );
    }
    const results = await Schedule.aggregate([
      ...baseAgregate,
      {
        $match: matchData,
      },
      {
        $facet: {
          paginatedResults: [
            { $sort: { date: -1 } },
            { $skip: limit * page },
            { $limit: limit },
          ],
          totalCount: [{ $count: "total" }],
        },
      },
    ]);
    let numSchedules = results[0].totalCount[0]
      ? results[0].totalCount[0].total
      : 0;
    let schedules = results[0].paginatedResults;
    let numPages = Math.ceil(numSchedules / limit);

    res.json({ schedules: schedules, numPages });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
module.exports.schedule_list_create = async (req, res, next) => {
  try {
    const academyId = res.locals.user.academyId;
    const Schedule = getModelByTenant(academyId, "schedule", ScheduleSchema);
    const scheduleListData = req.body["schedules"];
    await Schedule.insertMany(scheduleListData);
    res.status(200).end();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
module.exports.schedule_range_get = async (req, res, next) => {
  try {
    let data = req.body;
    const academyId = res.locals.user.academyId;
    const Schedule = getModelByTenant(academyId, "schedule", ScheduleSchema);
    const Vehicle = getModelByTenant(academyId, "vehicle", VehicleSchema);
    getModelByTenant(academyId, "client", ClientSchema);

    const startDate = new Date(data["startDate"]);
    const endDate = new Date(data["endDate"]);
    console.log("EMPIEZO " + startDate + " FINAL " + endDate);
    const findData = {
      state: { $ne: "removed" },
      "client.state": { $ne: "removed" },
      date: {
        $gte: startDate, // Mayor o igual que la fecha de inicio
        $lte: endDate, // Menor o igual que la fecha de fin
      },
    };
    const schedules =
      (await Schedule.find(findData)
        .populate("vehicle")
        .populate("client")
        .lean()
        .exec()) ?? [];
    const numVehicles = await Vehicle.countDocuments({});
    // console.log("SCHEDULEs : " + schedules[0]._id);

    res.json({ schedules: schedules, numVehicles: numVehicles });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
function fixedPage(page, numPages) {
  page = Math.abs(page) || 0;
  page = clamp(page, 0, clamp(numPages - 1, 0, Number.MAX_SAFE_INTEGER));
  return page;
}
function clamp(num, min, max) {
  return num <= min ? min : num >= max ? max : num;
}
function fieldsToObjectId(fields) {
  const response = { $addFields: {} };
  for (const field of fields) {
    response.$addFields[field] = { $toObjectId: "$" + field };
  }
  return response;
}
function fieldToObjectDB(field, modelname) {
  const response = {
    $lookup: {
      from: modelname,
      localField: field,
      foreignField: "_id",
      as: field,
    },
  };

  return response;
}
function idStringToObjectDB(matriz) {
  const fields = [];
  for (const row of matriz) {
    fields.push(row[0]);
  }
  const response = [fieldsToObjectId(fields)];
  for (const row of matriz) {
    response.push(fieldToObjectDB(row[0], row[1]));
    response.push({
      $unwind: {
        path: "$" + row[0],
        preserveNullAndEmptyArrays: true, // Esto mantendrá los documentos con clientData como null si no hay coincidencias
      },
    });
  }
  return response;
}
