const Sale = require("../models/Sale");
const Invoice = require("../models/Invoice");
const Movement = require("../models/Movement");
const Product = require("../models/Product");
const Payment = require("../models/Payment");
const mongoose = require("mongoose");

const util = require("util");
const RENIEC = process.env.RENIEC;
module.exports.sale_create_list = async (req, res, next) => {
  try {
    if (req.body["docs"].length == 0) {
      res.status(400).json({ error: "lista vacia" });

      return;
    }
    let lastDoc = await Movement.find({}, { code: 1 })
      .sort({ code: -1 })
      .limit(1);
    let code = 1;
    if (lastDoc.length != 0) {
      code = lastDoc[0].code + 1;
    }
    for (let doc of req.body["docs"]) {
      doc.code = code++;
      doc.status = "active";
    }
    let movements = await Movement.insertMany(req.body["docs"]);
    lastDoc = await Invoice.find({}, { code: 1 }).sort({ code: -1 }).limit(1);
    code = 1;
    if (lastDoc.length != 0) {
      code = lastDoc[0].code + 1;
    }
    const payments = [];
    let paid = 0;

    for (let payment of req.body["payments"]) {
      paid += payment.amount;
      payments.push({
        amount: payment.amount,
        method: payment.method,
        state: "active",
      });
    }
    const invoice = await Invoice.create({
      code,
      total: req.body["total"],
      paid: paid,
      client: req.body["clientId"],
      state: "active",
    });
    for (let payment of payments) {
      payment["invoice"] = invoice._id;
    }

    await Payment.insertMany(payments);

    let sales = [];
    for (let movement of movements) {
      sales.push({
        movement: movement._id,
        invoice: invoice._id,
        state: "active",
      });
    }
    await Sale.insertMany(sales);

    const bulkOps = movements.map((movement) => ({
      updateOne: {
        filter: {
          _id: movement.product,
        },
        update: { $inc: { stock: movement.quantity } },
      },
    }));
    await Product.bulkWrite(bulkOps);

    res.status(200).json({ code });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
module.exports.invoice_list_get = async (req, res, next) => {
  try {
    let data = req.body;
    let limit = Math.abs(data.limit) || 8;
    let page = fixedPage(data.page);

    let matchData = {
      state: { $ne: "removed" },
      // "client.state": { $ne: "removed" },
    };

    if (data.dniFilter != null) {
      matchData["client.dni"] = data.dniFilter;
    }
    const results = await Invoice.aggregate([
      ...fieldIdToObject("client", "client"),
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
module.exports.sale_list_get = async (req, res, next) => {
  try {
    let data = req.body;
    let limit = Math.abs(data.limit) || 8;
    let page = fixedPage(data.page);

    let matchData = {
      state: { $ne: "removed" },
      // "client.state": { $ne: "removed" },
    };
    console.log(util.inspect(data));
    if (data.invoiceIdFilter != null) {
      matchData["invoice._id"] = mongoose.Types.ObjectId.createFromHexString(
        data.invoiceIdFilter
      );
    } else if (data.dniFilter != null) {
      matchData["invoice.client.dni"] = data.dniFilter;
    } else if (data.productNameFilter != null) {
      matchData["movement.product.name"] = {
        $regex: data.productNameFilter,
        $options: "i",
      };
    }
    const results = await Sale.aggregate([
      ...fieldIdToObject("movement", "movement"),
      ...fieldIdToObject("movement.product", "product"),
      ...fieldIdToObject("invoice", "invoice"),
      ...fieldIdToObject("invoice.client", "client"),

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
      sales: docs ?? [],
      numPages,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
module.exports.sale_read = async (req, res, next) => {
  try {
    let client = await Sale.findOne({
      dni: req.body.clientDni,
      state: { $ne: "removed" },
    });
    if (client == null) {
      const reniecData = await getClientRENIEC(req.body.clientDni);
      if (reniecData != null) {
        const name = `${reniecData.nombres} ${reniecData.apellidoPaterno} ${reniecData.apellidoMaterno}`;

        client = await Sale.create({
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
    await Sale.findOneAndUpdate(
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
