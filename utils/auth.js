
const bcrypt = require("bcrypt");
const utils = require("../utils/auth");
const jwt = require("jsonwebtoken");

module.exports.getPasswordBcrypt=async (password)=> {
    const salt = await bcrypt.genSalt();
    return bcrypt.hash(password, salt);
}
const maxTime = 30000;

module.exports.createToken = (data) => {
    return jwt.sign(data, "efe", {
        expiresIn: maxTime,
    });
};

module.exports.configToken = (res,data) => {
    const token = utils.createToken(data);
    res.cookie("jwt", token, {
      httpOnly: true,
      maxAge: maxTime * 1000,
      sameSite: "none",
      secure: "false"
    });
};