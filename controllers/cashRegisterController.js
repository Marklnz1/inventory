const CashRegister = require("../models/CashRegister");
const Invoice = require("../models/Invoice");

const querys = require("../utils/querys");
const util = require("util");
const mongoose = require("mongoose");
module.exports.list_sync = async (req, res, next) => {
  try {
    let { syncDate } = req.body;
    let findData = { updatedAt: { $gt: new Date(syncDate) }, state: { $ne: "removed" } };
    let docs = await CashRegister.find(findData).lean().exec();
    res.status(200).json({ docs: docs ?? [] });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
module.exports.create = async (req, res, next) => {
  try {
    let lastDocOpen = await querys.getLastDoc(CashRegister, "code", {
      state: "open",
    });
    if (lastDocOpen != null) {
      throw new Error("Existe un Registro de Caja Abierto");
    }
    let code = await querys.getLastCode(CashRegister);
    let data = {
      code,
      state: "open",
      startingAmount: req.body.startingAmount,
      efective: 0,
      yape: 0,
      transference: 0,
    };
    const newDoc = await CashRegister.create(data);
    // console.log(newDoc);
    res.status(200).json({ doc: newDoc });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports.read_list = async (req, res, next) => {
  try {
    let data = req.body;
    let limit = Math.abs(data.limit) || 8;
    let page = fixedPage(data.page);

    let matchData = {
      state: { $ne: "removed" },
      // "client.state": { $ne: "removed" },
    };
    // console.log(util.inspect(data));
    // if (data.invoiceIdFilter != null) {
    //   matchData["invoice._id"] = mongoose.Types.ObjectId.createFromHexString(
    //     data.invoiceIdFilter
    //   );
    // } else if (data.dniFilter != null) {
    //   matchData["invoice.client.dni"] = data.dniFilter;
    // } else if (data.productNameFilter != null) {
    //   matchData["movement.product.name"] = {
    //     $regex: data.productNameFilter,
    //     $options: "i",
    //   };
    // }
    const results = await CashRegister.aggregate([
      {
        $match: matchData,
      },
      {
        $facet: {
          paginatedResults: [
            { $sort: { code: -1 } },
            { $skip: limit * page },
            { $limit: limit },
            {
              $lookup: {
                from: "invoice",
                localField: "_id",
                foreignField: "cashRegister",
                pipeline: [
                  {
                    $lookup: {
                      from: "client",
                      localField: "client",
                      foreignField: "_id",
                      as: "client",
                    },
                  },
                  {
                    $unwind: {
                      path: "$client",
                      preserveNullAndEmptyArrays: true,
                    },
                  },
                  { $sort: { code: -1 } },
                ],
                as: "invoices",
              },
            },
            {
              $addFields: {
                paid: { $sum: "$invoices.paid" },
                total: { $sum: "$invoices.total" },
              },
            },
          ],
          totalCount: [{ $count: "total" }],
        },
      },
    ]);
    // console.log(util.inspect(results, true, 20));
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
module.exports.read = async (req, res, next) => {
  try {
    let matchData = {
      state: { $ne: "removed" },
      _id: mongoose.Types.ObjectId.createFromHexString(req.body.cashRegisterId),
    };
    // console.log("EL IDDDDDDDDD "+req.body.cashRegisterId);
    const cashRegister = await CashRegister.aggregate([
      {
        $match: matchData,
      },
      {
        $lookup: {
          from: "invoice",
          localField: "_id",
          foreignField: "cashRegister",
          pipeline: [
            ...fieldIdToObject("client", "client"),
            {
              $lookup: {
                from: "payment",
                localField: "_id",
                foreignField: "invoice",
                as: "payments",
              },
            },
           
          ],
          as: "invoices",
        },
      },
    ]);
    // console.log(cashRegister);
    res.status(200).json({
      doc: cashRegister.length == 0 ? null : cashRegister[0],
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
module.exports.read_last_open = async (req, res, next) => {
  try {
    let doc = await querys.getLastDoc(CashRegister, "code", {
      state: { $ne: "removed" },
    });

    if (doc == null || doc.state == "close") {
      if (req.body.emptyError) {
        throw Error("El Ultimo Registro de Caja no es Valido");
      } else {
        res.status(200).json({ doc: null });
      }

      return;
    }

    const cashRegister = await CashRegister.aggregate([
      {
        $match: { _id: doc._id },
      },
     
    ]);
    // console.log(util.inspect(cashRegister,true,20));
    res
      .status(200)
      .json({ doc: cashRegister.length == 0 ? null : cashRegister[0] });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
module.exports.open_last_close = async (req, res, next) => {
  try {
    let doc = await querys.getLastDoc(CashRegister, "code", { state: "open" });
    if (doc != null) {
      throw new Error("Existe un Registro de Caja Abierto");
    }
    doc = await querys.getLastDoc(CashRegister, "code");
    if (doc == null) {
      throw new Error("No Existe un Registro de Caja Cerrado");
    }
    if (doc.state == "open") {
      throw new Error("El Ultimo Registro esta Abierto");
    }
    console.log(util.inspect(doc));
    doc.state = "open";
    doc.closedAt = null;
    await doc.save();
    res.status(200).json({});
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
module.exports.close_last_open = async (req, res, next) => {
  try {
    let doc = await querys.getLastDoc(CashRegister, "code", { state: "open" });
    if (doc == null) {
      throw new Error("No Existe un Registro de Caja Abierto");
    }
    doc.state = "close";
    doc.closedAt = new Date();
    doc.efective = req.body.efective;
    doc.yape = req.body.yape;
    doc.transference = req.body.transference;
    await doc.save();
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
