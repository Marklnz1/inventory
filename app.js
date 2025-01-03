require("dotenv").config();
const PORT = process.env.PORT || 4000;
const MONGODB_URL = process.env.MONGODB_URL;
const extractUser = require("./middleware/extractUser");
const Client = require("./models/Client");
const authController = require("./controllers/authController");
const SyncServer = require("./synchronization/SyncServer");
const CashRegister = require("./models/CashRegister");
const Invoice = require("./models/Invoice");
const Movement = require("./models/Movement");
const Product = require("./models/Product");
const Sale = require("./models/Sale");
const Payment = require("./models/Payment");
const syncServer = new SyncServer({ port: PORT, mongoURL: MONGODB_URL });

syncServer.syncPost(CashRegister, "cashRegister");
syncServer.syncPost(Client, "client");
syncServer.syncPost(Invoice, "invoice");
syncServer.syncPost(Movement, "movement");
syncServer.syncPost(Payment, "payment");
syncServer.syncPost(Product, "product");
syncServer.syncPost(Sale, "sale");

syncServer.start();
