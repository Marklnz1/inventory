const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { inspect } = require("util");
const UserWarehouse = require("../models/UserWarehouse");

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    let token = null;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const parts = authHeader.split(" ");
      if (parts.length === 2) {
        token = parts[1];
      }
    }
    res.locals.user = {};
    if (token) {
      const decodedToken = jwt.verify(token, process.env.TOKEN_LOGIN_KEY);
      const user = await User.findOne({ username: decodedToken.username });
      const userWarehouses = await UserWarehouse.find({ user: user.uuid });

      // console.log("el user es " + inspect(user));
      if (user != null) {
        if (user.version == decodedToken.version) {
          res.locals.user = {
            id: user._id,
            uuid: user.uuid,
            username: user.username,
            role: user.role,
            warehouses: userWarehouses.map((uw) => uw.warehouse),
          };
        }
      }
    }
    next();
  } catch (error) {
    res.status(400).json({ error: error });
  }
};
