const jwt = require("jsonwebtoken");
const User = require("../models/User");
const util = require("util");

module.exports = async (req, res, next) => {
  const token = req.cookies.jwt;
  await extractUser(res, token);
  next();
};

const extractUser = async (res, token) => {
  res.locals.user = {};
  if (token) {
    const decodedToken = jwt.verify(token, "efe");
    try {
      const user = await User.findOne({ username: decodedToken.username });
      if (user != null) {
        res.locals.user = {
          username: user.username,
          groupId: user.groupId,
          role: user.role,
        };
      }
    } catch (error) {
      res.status(400).json({ error: "Error al autenticar al Usuario" });
    }
  } else {
    res.locals.user = {
      groupId: "665441962ca1381af8f870d3",
    };
  }
};
