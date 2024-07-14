const Sale = require("../models/Sale");
const Invoice = require("../models/Invoice");
const Movement = require("../models/Movement");
const Product = require("../models/Product");
const Payment = require("../models/Payment");
const mongoose = require("mongoose");
const querys = require("../utils/querys");

const util = require("util");
const CashRegister = require("../models/CashRegister");
const Client = require("../models/Client");
const RENIEC = process.env.RENIEC;
module.exports.sale_list_sync = async (req, res, next) => {
  try {
    let { syncDate } = req.body;
    let findData = {
      updatedAt: { $gt: new Date(syncDate) },
      state: { $ne: "removed" },
    };
    let docs = await Sale.find(findData)
      .populate("invoice")
      .populate("movement")
      .populate({ path: "invoice", populate: { path: "client" } })
      .populate({ path: "invoice", populate: { path: "cashRegister" } })
      .populate({ path: "movement", populate: { path: "product" } })
      .lean()
      .exec();
    res.status(200).json({ docs: docs ?? [] });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
module.exports.invoice_list_sync = async (req, res, next) => {
  try {
    let { syncDate } = req.body;
    let findData = {
      updatedAt: { $gt: new Date(syncDate) },
      state: { $ne: "removed" },
    };
    let docs = await Invoice.find(findData)
      .populate("client")
      .populate("cashRegister")
      .lean()
      .exec();
    res.status(200).json({ docs: docs ?? [] });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
module.exports.invoice_sync_list_update = async (req, res, next) => {
  try {
    let invoices = req.body["docs"];
    const dnis = [...new Set(invoices.map((i) => i.clientDni))];
    const clients = await Client.find({ dni: { $in: dnis } });
    const clientsMap = new Map(clients.map((c) => [c.dni, c._id]));

    const cashRegisterUuids = [
      ...new Set(invoices.map((i) => i.cashRegisterUuid)),
    ];
    const cashRegisters = await CashRegister.find({
      uuid: { $in: cashRegisterUuids },
    });
    const cashRegistersMap = new Map(cashRegisters.map((c) => [c.uuid, c._id]));
    for (let i of invoices) {
      i.client = clientsMap.get(i.clientDni);
      i.cashRegister = cashRegistersMap.get(i.cashRegisterUuid);
    }
    await Invoice.bulkWrite(
      invoices.map((invoice) => ({
        updateOne: {
          filter: { uuid: invoice.uuid },
          update: { $set: invoice },
          upsert: true,
        },
      }))
    );
    let lastDoc = await Invoice.findOne().sort({ updatedAt: -1 }).limit(1);
    res.status(200).json({ syncDate: lastDoc?.updatedAt });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
module.exports.sale_sync_list_update = async (req, res, next) => {
  try {
    let sales = req.body["docs"];
    const movementUuids = [...new Set(sales.map((s) => s.movementUuid))];
    const movements = await Movement.find({ uuid: { $in: movementUuids } });
    const movementsMap = new Map(movements.map((m) => [m.uuid, m._id]));

    const invoiceUuids = [...new Set(sales.map((s) => s.invoiceUuid))];
    const invoices = await Invoice.find({
      uuid: { $in: invoiceUuids },
    });
    const invoicesMap = new Map(invoices.map((i) => [i.uuid, i._id]));
    for (let s of sales) {
      s.movement = movementsMap.get(s.movementUuid);
      s.invoice = invoicesMap.get(s.invoiceUuid);
    }
    await Sale.bulkWrite(
      sales.map((sale) => ({
        updateOne: {
          filter: { uuid: sale.uuid },
          update: { $set: sale },
          upsert: true,
        },
      }))
    );
    let lastDoc = await Sale.findOne().sort({ updatedAt: -1 }).limit(1);
    res.status(200).json({ syncDate: lastDoc?.updatedAt });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
module.exports.sale_create_list = async (req, res, next) => {
  try {
    // Obtener el último registro de caja abierto
    const lastCashRegister = await querys.getLastDoc(CashRegister, "code", {
      state: "open",
    });
    if (!lastCashRegister) {
      throw new Error("No se encontró un registro de caja abierto");
    }

    // Validar datos de venta
    const { docs: salesData, payments: paymentsData, clientId } = req.body;
    if (!salesData.length) {
      throw new Error("Lista de ventas vacía");
    }

    // Preparar datos de movimientos
    const movementsData = salesData.map((sd) => ({
      ...sd.movement,
      state: "active",
    }));
    const movementLastCode = await querys.getLastCode(Movement);
    movementsData.forEach((movement, index) => {
      movement.code = movementLastCode + index;
    });

    // Obtener productos y actualizar precios
    const productsIds = [
      ...new Set(movementsData.map((m) => m.product.toString())),
    ];
    const products = await Product.find({ _id: { $in: productsIds } });
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    movementsData.forEach((movement) => {
      const product = productMap.get(movement.product.toString());
      movement.price = product.price;
    });

    // Insertar movimientos
    const movements = await Movement.insertMany(movementsData);

    // Calcular total
    const total = movements.reduce((sum, movement, index) => {
      const product = productMap.get(movement.product.toString());
      const discount = salesData[index].discount > 0 ? product.maxDiscount : 0;
      return sum + Math.abs(movement.quantity) * (movement.price - discount);
    }, 0);

    // Procesar pagos
    const paid = paymentsData.reduce((sum, payment) => sum + payment.amount, 0);

    // Crear factura
    const invoiceLastCode = await querys.getLastCode(Invoice);
    // await new Promise((resolve) => setTimeout(resolve, 3000));
    const invoice = await Invoice.create({
      cashRegister: lastCashRegister._id,
      code: invoiceLastCode,
      total,
      paid,
      client: clientId,
      state: "active",
    });

    // Insertar pagos
    await Payment.insertMany(
      paymentsData.map((payment) => ({
        ...payment,
        state: "active",
        invoice: invoice._id,
      }))
    );

    // Crear ventas
    const sales = movements.map((movement, index) => ({
      discount:
        salesData[index].discount > 0
          ? productMap.get(movement.product.toString()).maxDiscount *
            movement.quantity
          : 0,
      movement: movement._id,
      invoice: invoice._id,
      state: "active",
    }));
    await Sale.insertMany(sales);

    // Actualizar stock de productos
    const bulkOps = movements.map((movement) => ({
      updateOne: {
        filter: { _id: movement.product },
        update: { $inc: { stock: movement.quantity } },
      },
    }));
    await Product.bulkWrite(bulkOps);

    res.status(200).json({ code: invoiceLastCode });
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
      ...fieldIdToObject("cashRegister", "cashRegister"),
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
