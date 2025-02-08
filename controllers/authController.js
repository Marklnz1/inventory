const bcrypt = require("bcrypt");
const User = require("../models/User");
const utils = require("../utils/auth");
const { inspect } = require("util");
const UserWarehouse = require("../models/UserWarehouse");
const Warehouse = require("../models/Warehouse");

module.exports.create = async (req, res) => {
  await User.findOneAndUpdate(
    { username: "user4" },
    { role: "employee", password: await utils.getPasswordBcrypt("12345") },
    { upsert: true }
  );
  res.json("cambiado");
};

module.exports.verifyUser = async (req, res, next) => {
  // next();
  // return;
  // console.log("EL EXTRACT ES " + inspect(res.locals.user));
  if (res.locals.user?.role != "employee") {
    res.status(404).json({ error: "_404_" });
  } else {
    next();
  }
};

module.exports.login_post = async (req, res) => {
  const userData = req.body;
  const userBD = await User.findOne({
    username: userData.username?.toUpperCase(),
  });

  if (
    userBD != null &&
    (await bcrypt.compare(userData.password, userBD.password))
  ) {
    const token = utils.createToken({
      username: userBD.username,
      version: userBD.version,
    });
    var userWarehouses;
    if (userBD.role.toUpperCase() == "ADMIN") {
      userWarehouses = await UserWarehouse.find();
    } else {
      userWarehouses = await UserWarehouse.find({ user: userBD.uuid });
    }
    var warehouses = await Warehouse.find({
      uuid: { $in: userWarehouses.map((uw) => uw.warehouse) },
    });
    res.status(201).json({
      uuid: userBD.uuid,
      username: userBD.username,
      role: userBD.role,
      warehouses: warehouses,
      token,
    });
  } else {
    res.status(400).json({
      error: "Usuario o contraseña incorrectos. Inténtalo de nuevo.",
    });
  }
};
