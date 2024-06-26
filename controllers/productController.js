const Product = require("../models/Product");
const util = require("util");

module.exports.product_create = async (req, res, next) => {
  try {
    const lastDoc = await Product.find({}, { code: 1 })
      .sort({ code: -1 })
      .limit(1);
    let code = 1;
    if (lastDoc.length != 0) {
      code = lastDoc[0].code + 1;
    }
    const newProduct = await Product.create({ code, ...req.body });
    res.status(200).json({
      product: newProduct,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
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
      findData.name = { $regex: data.nameFilter, $options: "i" };
    }
    let numDocs = (await Product.countDocuments(findData)) ?? 0;
    let limit = Math.abs(data.limit) || 8;
    let numPages = Math.ceil(numDocs / limit);
    let page = fixedPage(data.page, numPages);
    let docs = await Product.find(findData)
      .sort({ createdAt: -1 })
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
