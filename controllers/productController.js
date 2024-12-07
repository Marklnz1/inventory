const Product = require("../models/Product");
const Movement = require("../models/Movement");
const { v7: uuidv7 } = require("uuid");
const util = require("util");
const { default: mongoose } = require("mongoose");
module.exports.list_sync = async (req, res, next) => {
  try {
    let { syncCodeMax } = req.body;

    let findData = {
      syncCode: { $gt: syncCodeMax },
      status: { $ne: "Deleted" },
    };

    let docs = await Product.find(findData).lean().exec();
    const syncCodeMaxDB = docs.reduce((max, doc) => {
      return doc.syncCode > max ? doc.syncCode : max;
    }, docs[0].syncCode);
    res.status(200).json({ docs: docs ?? [], syncCodeMax: syncCodeMaxDB });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

function obtenerNumeroAleatorio() {
  return Math.floor(Math.random() * 100) + 1;
}
module.exports.product_create = async (req, res, next) => {
  // const numRandom = obtenerNumeroAleatorio();
  // const session = await mongoose.startSession();
  // session.startTransaction();
  // try {
  //   const syncCodeTable = await getSyncCodeTable();
  //   const newProductData = req.body;
  //   console.log("ENTRANDO AL TIMER", numRandom);
  //   await new Promise((resolve) => setTimeout(resolve, 10000));
  //   const newCode = syncCodeTable.product + 1;
  //   syncCodeTable.product = newCode;
  //   await syncCodeTable.save();
  //   console.log("SALIENDO DEL TIMER", numRandom);
  //   newProductData.syncCode = newCode;
  //   const newProduct = await Product.create(newProductData);
  //   await session.commitTransaction();
  //   res.status(200).json({
  //     product: newProduct,
  //   });
  // } catch (error) {
  //   await session.abortTransaction();
  //   res.status(400).json({ error: error.message });
  // } finally {
  //   session.endSession();
  // }
};

module.exports.product_read = async (req, res, next) => {
  try {
    const doc = await Product.findOne({
      _id: req.body.productId,
      state: { $ne: "removed" },
    });
    res.status(200).json({ client: doc });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
module.exports.product_update = async (req, res, next) => {
  try {
    await Product.findOneAndUpdate({ _id: req.body.id }, { ...req.body });
    res.status(200).json({});
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
module.exports.product_delete = async (req, res, next) => {
  try {
    await Product.findOneAndUpdate(
      { _id: req.body.productId },
      { state: "removed" }
    );
    res.status(200).json({});
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports.product_list_get = async (req, res, next) => {
  try {
    let data = req.body;

    let findData = { state: { $ne: "removed" } };

    if (data.nameFilter != null) {
      const words = data.nameFilter.split(" ");
      const expressions = words.map((word) => ({
        name: { $regex: word, $options: "i" },
      }));
      findData.$and = expressions;
    }
    let numDocs = (await Product.countDocuments(findData)) ?? 0;
    let limit = Math.abs(data.limit) || 20;
    let numPages = Math.ceil(numDocs / limit);
    let page = fixedPage(data.page, numPages);
    let docs = await Product.find(findData)
      .sort({ code: -1 })
      .limit(limit)
      .skip(limit * page)
      .lean()
      .exec();
    res.status(200).json({
      products: docs ?? [],
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
