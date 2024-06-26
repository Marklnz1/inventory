const Client = require("../models/Client");
const util = require("util");
const APISNET = process.env.APISNET;
const APISPERU = process.env.APISPERU;

module.exports.client_create = async (req, res, next) => {
  try {
    const newClient = await Client.create(req.body);
    res.status(200).json({ client: newClient });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports.client_read = async (req, res, next) => {
  try {
    let client = await Client.findOne({
      dni: req.body.clientDni,
      state: { $ne: "removed" },
    });
    if (client == null) {
      let reniecData = await getClientAPISPERU(req.body.clientDni);
      if (reniecData == null) {
        reniecData = await getClientAPISNET(req.body.clientDni);
      }
      if (reniecData != null) {
        const name = `${reniecData.nombres} ${reniecData.apellidoPaterno} ${reniecData.apellidoMaterno}`;

        client = await Client.create({
          dni: req.body.clientDni,
          name,
          state: "activo",
        });
      }
    }

    res.status(200).json({ client });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
async function getClientAPISNET(dni) {
  try {
    const response = await fetch(
      "https://api.apis.net.pe/v2/reniec/dni?numero=" +
        dni +
        "&token=" +
        APISNET
    );
    if (response.ok) {
      const data = await response.json();
      return data;
    }
  } catch (error) {
    return null;
  }
  return null;
}
async function getClientAPISPERU(dni) {
  try {
    const response = await fetch(
      "https://dniruc.apisperu.com/api/v1/dni/" + dni + "?token=" + APISPERU
    );
    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        return data;
      }
    }
  } catch (error) {
    return null;
  }
  return null;
}
module.exports.client_update = async (req, res, next) => {
  try {
    const client = res.locals.client;
    client.set({ ...req.body });
    await client.save();
    res.status(200).json({});
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
module.exports.client_delete = async (req, res, next) => {
  try {
    await Client.findOneAndUpdate(
      { _id: req.body.clientId },
      { state: "removed" }
    );
    res.status(200).json({});
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports.client_list_get = async (req, res, next) => {
  try {
    let data = req.body;

    let findData = { state: { $ne: "removed" } };

    if (data.nameFilter != null) {
      findData.name = { $regex: data.nameFilter, $options: "i" };
    }
    let numClients = (await Client.countDocuments(findData)) ?? 0;
    let limit = Math.abs(data.limit) || 8;
    let numPages = Math.ceil(numClients / limit);
    let page = fixedPage(data.page, numPages);

    let clients = await Client.find(findData)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(limit * page)
      .lean()
      .exec();
    res.status(200).json({
      clients: clients ?? [],
      numPages,
    });
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
