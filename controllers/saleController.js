const Sale = require("../models/Sale");
const Invoice = require("../models/Invoice");
const Movement = require("../models/Movement");
const Product = require("../models/Product");
const Payment = require("../models/Payment");
const InvoicePayment = require("../models/InvoicePayment");
const mongoose = require("mongoose");
const querys = require("../utils/querys");

const util = require("util");
const CashRegister = require("../models/CashRegister");
const RENIEC = process.env.RENIEC;
module.exports.sale_create_list = async (req, res, next) => {
  try {
    let lastCashRegister = await querys.getLastDoc(CashRegister,"code",{state:"open"});
    if(lastCashRegister==null){
      throw new Error("No se encontro un registro de caja abierto");
    }
    let salesData = req.body["docs"];
    if (salesData.length == 0) {
      res.status(400).json({ error: "lista vacia" });
      return;
    }
    let movementsData = [];
    for (let sd of salesData) {
      movementsData.push(sd["movement"]);
    }
    let lastCode = await querys.getLastCode(Movement);
    for (let doc of movementsData) {
      doc.code = lastCode++;
      doc.state = "active";
    }

    let productsIds = [];
    for (let movement of movementsData) {
      productsIds.push(movement.product);
    }

    let products = await Product.find({ _id: { $in: productsIds } });
    for (let i = 0; i < products.length; i++) {
      movementsData[i].price = products[i].price;
    }
    let movements = await Movement.insertMany(movementsData);
    
    
    let total = 0;
    for (let i = 0; i < movements.length; i++) {
      total +=
        Math.abs(movements[i].quantity) *
        (movements[i].price - products[i].maxDiscount);
    }
    lastCode = await querys.getLastCode(Invoice);
    const paymentsData = req.body["payments"];
    let paid = 0;

    for (let payment of paymentsData) {
      paid += payment.amount;
      payment.state = "active";
    }
    let payments = await Payment.insertMany(paymentsData);
    const invoice = await Invoice.create({
      cashRegister:lastCashRegister._id,
      code:lastCode,
      total: total,
      paid: paid,
      client: req.body["clientId"],
      state: "active",
    });

    let sales = [];
    for (let i = 0; i < movements.length; i++) {
      sales.push({
        discount: salesData[i].discount>0? products[i].maxDiscount*movements[i].quantity:0,
        movement: movements[i]._id,
        invoice: invoice._id,
        state: "active",
      });
    }
    await Sale.insertMany(sales);
    // for (let payment of paymentsData) {
    //   payment["invoice"] = invoice._id;
    // }
 
    let invoicePayments = [];
    for(let p of payments){
      invoicePayments.push({invoice:invoice._id,payment:p._id});
    }
    await InvoicePayment.insertMany(invoicePayments);

    const bulkOps = movements.map((movement) => ({
      updateOne: {
        filter: {
          _id: movement.product,
        },
        update: { $inc: { stock: movement.quantity } },
      },
    }));
    await Product.bulkWrite(bulkOps);

    res.status(200).json({ code:lastCode });
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
    // console.log(util.inspect(data));
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
