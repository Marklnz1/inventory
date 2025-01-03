const bcrypt = require("bcrypt");
const utils = require("../utils/auth");
const jwt = require("jsonwebtoken");

module.exports.getPasswordBcrypt = async (password) => {
  const salt = await bcrypt.genSalt();
  return bcrypt.hash(password, salt);
};

const days = 1000;

const maxTime = days * 24 * 60 * 60 * 1000;

module.exports.createToken = (data) => {
  return jwt.sign(data, process.env.TOKEN_LOGIN_KEY, {
    expiresIn: maxTime,
  });
};
