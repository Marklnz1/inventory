const validator = require("validator");
const Client = require("../models/Client");
const util = require("util");
module.exports.client_create = async (req, res, next) => {
  try {
    const { dni, name, phone, email } = req.body ?? {};
    phone ??= "";
    email ??= "";
    req.body = { dni, name, phone, email, state: "activo" };

    validateName(name);
    validatePhone(phone);
    await validateEmail(email, null);
    await validateDNI(dni, null);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }

  next();
};
module.exports.client_update = async (req, res, next) => {
  try {
    const { id, dni, name, phone, email } = req.body ?? {};
    req.body = { dni, name, phone, email };

    const client = await validateClientId(id);
    res.locals.client = client;
    validateName(name);
    validatePhone(phone);
    await validateEmail(email, id);
    await validateDNI(dni, id);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
  next();
};

function validateName(name) {
  if (typeof name !== "string" || validator.isEmpty(name)) {
    throw new Error("El nombre es invalido");
  }
  if (!validator.isAlpha(name, "es-ES", { ignore: " " })) {
    throw new Error("El Nombre solo debe contener letras");
  }
}
function validatePhone(phone) {
  if (phone == null || (typeof phone == "string" && phone.trim().length == 0)) {
    return;
  }

  if (typeof phone !== "string" || validator.isEmpty(phone)) {
    throw new Error("El telefono es invalido");
  }
  if (!validator.isLength(phone, { min: 9, max: 9 })) {
    throw new Error("El Telefono debe tener 9 digitos");
  }
  if (!validator.isNumeric(phone)) {
    throw new Error("El Telefono debe contener solo numeros");
  }
}
async function validateClientId(clientId) {
  let client;
  try {
    client = await Client.findById(clientId);
    if (client) {
      return client;
    }
  } catch (error) {
    throw new Error("Error al verificar al cliente");
  }
  if (!client) {
    throw new Error("No se encontro al cliente");
  }
}
async function validateDNI(dni, clientId) {
  if (typeof dni !== "string" || validator.isEmpty(dni)) {
    throw new Error("El DNI es invalido");
  }
  if (!validator.isLength(dni, { min: 8, max: 8 })) {
    throw new Error("El DNI debe tener 8 digitos");
  }
  if (!validator.isNumeric(dni)) {
    throw new Error("El DNI debe contener solo numeros");
  }
  let client;
  try {
    client = await Client.findOne({
      dni: dni,
      _id: { $ne: clientId },
      state: { $ne: "removed" },
    });
  } catch (error) {
    throw new Error("Error al verificar el DNI");
  }
  if (client) {
    throw new Error("El DNI le pertenece a otro Cliente");
  }
}
async function validateEmail(email, clientId) {
  if (email == null || (typeof email == "string" && email.trim().length == 0)) {
    return;
  }

  if (typeof email !== "string" || !validator.isEmail(email)) {
    throw new Error("El email es invalido");
  }
  let client;
  try {
    client = await Client.findOne({
      email: email,
      _id: { $ne: clientId },
    });
  } catch (error) {
    throw new Error("Error al verificar el email");
  }
  if (client) {
    throw new Error("El email le pertenece a otro Cliente");
  }
}
