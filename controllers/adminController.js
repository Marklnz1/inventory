const User = require("../models/User");
const Academy = require("../models/Academy");
const utils = require("../utils/auth");

module.exports.create_academy = async (req, res) => {
  const data = req.body;

  const newAcademy = new Academy({
    name: data.name,
    description: data.description,
  });
  await newAcademy.save();
  res.status(201).json({ message: "academia creada" });
};
// module.exports.remove_academy = async (req, res) => {
//     const data = req.body;
//     const academy = await Academy.remove(data.academyId);
//     // console.log(data);
//     if (academy == null) {
//         res.status(400).json({ error: "academia no encontrada" });
//     } else {
//         await User.remove({ username: data.username, academyId: academy._id })
//         res.status(201).json({ message: "usuario removido" });
//     }
// };
module.exports.remove_academy_user = async (req, res) => {
  const data = req.body;
  const academy = await Academy.findById(data.academyId);
  // console.log(data);
  if (academy == null) {
    res.status(400).json({ error: "academia no encontrada" });
  } else {
    await User.remove({ username: data.username, academyId: academy._id });
    res.status(201).json({ message: "usuario removido" });
  }
};
module.exports.create_academy_user = async (req, res) => {
  const data = req.body;
  const academy = await Academy.findById(data.academyId);
  // console.log(data);
  if (academy == null) {
    res.status(400).json({ error: "academia no encontrada" });
  } else {
    const user = new User({
      username: data.username,
      password: await utils.getPasswordBcrypt(data.password),
      role: "academy",
      academyId: academy._id,
    });
    await user.save();
    res.status(201).json({ message: "usuario creado" });
  }
};
module.exports.list_academy = async (req, res) => {
  const academies = await Academy.find().lean().exec();
  //   console.log(academies);
  res.status(201).json({ academies });
};

module.exports.get_academy = async (req, res) => {
  const data = req.body;

  const academy = await Academy.findById(data.academyId).lean().exec();
  if (academy == null) {
    res.status(400).json({ error: "academia no encontrada" });
  } else {
    const users = await User.find({ academyId: data.academyId }).lean().exec();
    res.status(201).json({ academy, users: users ?? [] });
  }
};
