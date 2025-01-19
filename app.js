require("dotenv").config();
const PORT = process.env.PORT || 4000;
const MONGODB_URL = process.env.MONGODB_URL;
const extractUser = require("./middleware/extractUser");
const Client = require("./models/Client");
const { SyncServer } = require("./synchronization/SyncServer");
const CashRegister = require("./models/CashRegister");
const Invoice = require("./models/Invoice");
const Movement = require("./models/Movement");
const Product = require("./models/Product");
const Sale = require("./models/Sale");
const Payment = require("./models/Payment");
const authController = require("./controllers/authController");
const { verifyUser, login_post } = require("./controllers/authController");

SyncServer.init({
  port: PORT,
  mongoURL: MONGODB_URL,
  router: (app, auth) => {
    app.get("/", (req, res) => {
      res.json({ msg: "ok" });
    });
    app.post("/login", login_post);
    app.get("/create", authController.create);
    app.use("*", extractUser);
  },
});

SyncServer.syncPost(CashRegister, "cashRegister");
SyncServer.syncPost(Client, "client");
SyncServer.syncPost(Invoice, "invoice");
SyncServer.syncPost(Movement, "movement");
SyncServer.syncPost(Payment, "payment");
SyncServer.syncPost(Product, "product");
SyncServer.syncPost(Sale, "sale");

SyncServer.start();
