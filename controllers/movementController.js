const Movement = require("../models/Movement");
const Product = require("../models/Product");
const mongoose = require("mongoose");

const util = require("util");
const RENIEC = process.env.RENIEC;
module.exports.list_sync = async (req, res, next) => {
  try {
    let { syncDate } = req.body;
    let findData = {
      updatedAt: { $gt: new Date(syncDate) },
      state: { $ne: "removed" },
    };
    let docs = await Movement.find(findData).populate("product").lean().exec();
    res.status(200).json({ docs: docs ?? [] });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
module.exports.sync_list_update = async (req, res, next) => {
  try {
    let movements = req.body["docs"];
    const productCodes = [...new Set(movements.map((m) => m.productCode))];
    const products = await Product.find({ code: { $in: productCodes } });
    const productsMap = new Map(products.map((p) => [p.code, p._id]));
    for (let m of movements) {
      m.product = productsMap.get(m.productCode);
    }
    await Movement.bulkWrite(
      movements.map((movement) => ({
        updateOne: {
          filter: { uuid: movement.uuid },
          update: { $set: movement },
          upsert: true,
        },
      }))
    );
    let lastDoc = await Movement.findOne().sort({ updatedAt: -1 }).limit(1);
    res.status(200).json({ syncDate: lastDoc?.updatedAt });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
module.exports.movement_list_create = async (req, res, next) => {
  try {
    if (req.body["docs"].length == 0) {
      res.status(400).json({ error: "lista vacia" });

      return;
    }
    const lastDoc = await Movement.find({}, { code: 1 })
      .sort({ code: -1 })
      .limit(1);
    let code = 1;
    if (lastDoc.length != 0) {
      code = lastDoc[0].code + 1;
    }
    for (let doc of req.body["docs"]) {
      doc.code = code++;
      doc.state = "active";
    }
    const productsIds = [
      ...new Set(req.body["docs"].map((m) => m.product.toString())),
    ];
    const products = await Product.find({ _id: { $in: productsIds } });
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    req.body["docs"].forEach((movement) => {
      const product = productMap.get(movement.product.toString());
      movement.price = product.price;
    });
    await Movement.insertMany(req.body["docs"]);
    const bulkOps = req.body["docs"].map((movement) => ({
      updateOne: {
        filter: {
          _id: movement.product,
        },
        update: { $inc: { stock: movement.quantity } },
      },
    }));
    await Product.bulkWrite(bulkOps);
    res.status(200).json({});
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
module.exports.movement_list_get = async (req, res, next) => {
  try {
    let data = req.body;
    let limit = Math.abs(data.limit) || 20;
    let page = fixedPage(data.page);
    let matchData = {
      state: { $ne: "removed" },
      // "client.state": { $ne: "removed" },
    };

    if (data.nameFilter != null) {
      matchData["type"] = data.movementTypeFilter;
    }
    const results = await Movement.aggregate([
      ...fieldIdToObject("product", "product"),
      {
        $match: matchData,
      },
      {
        $facet: {
          paginatedResults: [
            { $sort: { code: -1 } },
            { $skip: limit * page },
            { $limit: limit },
          ],
          totalCount: [{ $count: "total" }],
        },
      },
    ]);
    let numDocs = results[0].totalCount[0] ? results[0].totalCount[0].total : 0;
    let docs = results[0].paginatedResults;
    let numPages = Math.ceil(numDocs / limit);

    res.status(200).json({
      docs: docs ?? [],
      numPages,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
module.exports.sale_read = async (req, res, next) => {
  try {
    let client = await Movement.findOne({
      dni: req.body.clientDni,
      state: { $ne: "removed" },
    });
    if (client == null) {
      const reniecData = await getClientRENIEC(req.body.clientDni);
      if (reniecData != null) {
        const name = `${reniecData.nombres} ${reniecData.apellidoPaterno} ${reniecData.apellidoMaterno}`;

        client = await Movement.create({
          dni: reniecData.dni,
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
module.exports.sale_update = async (req, res, next) => {
  try {
    const client = res.locals.client;
    client.set({ ...req.body });
    await client.save();
    res.status(200).json({});
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
module.exports.sale_delete = async (req, res, next) => {
  try {
    await Movement.findOneAndUpdate(
      { _id: req.body.clientId },
      { state: "removed" }
    );
    res.status(200).json({});
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
function fieldIdToObject(field, secondModel) {
  return [
    {
      $lookup: {
        from: secondModel,
        localField: field,
        foreignField: "_id",
        as: field,
      },
    },
    {
      $unwind: {
        path: "$" + field,
        preserveNullAndEmptyArrays: true,
      },
    },
  ];
}
