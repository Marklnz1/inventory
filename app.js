const mongoose = require("mongoose");
const express = require("express");
const app = express();
require("dotenv").config();
const cookieParser = require("cookie-parser");
const authController = require("./controllers/authController");
const adminController = require("./controllers/adminController");

const CashRegister = require("./models/CashRegister");
const Client = require("./models/Client");
const Product = require("./models/Product");
const Movement = require("./models/Movement");
const Sale = require("./models/Sale");
const Invoice = require("./models/Invoice");
const Payment = require("./models/Payment");

const extractUser = require("./middleware/extractUser");

const vehicleController = require("./controllers/vehicleController");
const clientController = require("./controllers/clientController");
const saleController = require("./controllers/saleController");

const productController = require("./controllers/productController");
const transactionController = require("./controllers/transactionController");
const movementController = require("./controllers/movementController");
const cashRegisterController = require("./controllers/cashRegisterController");

const clientValidator = require("./validator/clientValidator");
const vehicleValidator = require("./validator/vehicleValidator");
const { update_list_sync, list_sync } = require("./utils/sync");
const SyncMetadata = require("./models/SyncMetadata");

const PORT = process.env.PORT;
const MONGODB_URL = process.env.MONGODB_URL;

app.use(express.static("public"));
app.use(express.json());
app.use(cookieParser());

// app.set("view engine", "ejs");
app.set("view engine", "html");
app.engine("html", require("ejs").renderFile);
app.get("/", (req, res) => {
  res.render("inventory/index");
});

app.post("/verify", async (req, res) => {
  const tableNames = req.body.tableNames;
  let syncMetadataList = await SyncMetadata.find({
    tableName: { $in: tableNames },
  });
  const foundNames = syncMetadataList.map(
    (syncMetadata) => syncMetadata.tableName
  );
  const notFoundNames = tableNames.filter(
    (tableName) => !foundNames.includes(tableName)
  );

  if (notFoundNames) {
    const newSyncMetadataList = await SyncMetadata.insertMany(
      notFoundNames.map((tableName) => ({
        tableName: tableName,
      }))
    );
    syncMetadataList = syncMetadataList.concat(newSyncMetadataList);
  }

  const syncMetadataMap = Object.fromEntries(
    syncMetadataList.map((syncMetadata) => [
      syncMetadata.tableName,
      syncMetadata.syncCodeMax,
    ])
  );
  res.json(syncMetadataMap);
});

app.post("/sale/create/list", saleController.sale_create_list);
app.post("/sale/list", saleController.sale_list_get);
app.post("/sale/list/sync", saleController.sale_list_sync);
app.post("/sale/update/list/sync", saleController.sale_sync_list_update);

// app.post("/product/create", productController.product_create);
// app.post("/product/read", productController.product_read);
// app.post("/product/update", productController.product_update);
// app.post("/product/delete", productController.product_delete);
// app.post("/product/list", productController.product_list_get);
app.post("/client/update/list/sync", (req, res, next) =>
  update_list_sync(Client, "client", req, res, next)
);
app.post("/client/list/sync", (req, res, next) =>
  list_sync(Client, req, res, next)
);

app.post("/movement/update/list/sync", (req, res, next) =>
  update_list_sync(Movement, "movement", req, res, next)
);
app.post("/movement/list/sync", (req, res, next) =>
  list_sync(Movement, req, res, next)
);

app.post("/product/update/list/sync", (req, res, next) =>
  update_list_sync(Product, "product", req, res, next)
);
app.post("/product/list/sync", (req, res, next) =>
  list_sync(Product, req, res, next)
);

// app.post("/product/create/list", productController.product_create_list);

app.post("/debt/list/get", transactionController.debt_list);
app.post("/debt/create", transactionController.debt_create);

app.post("/payment/create", transactionController.payment_create);
// app.post("/payment/update", transactionController.payment_update);
// app.post("/payment/delete", transactionController.payment_delete);
app.post("/payment/list/", transactionController.payment_list_get);
app.post("/payment/list/sync", transactionController.list_sync);
app.post("/payment/update/list/sync", transactionController.update_list_sync);

app.post("/invoice/list/", saleController.invoice_list_get);
app.post("/invoice/list/sync", saleController.invoice_list_sync);
app.post("/invoice/update/list/sync", saleController.invoice_sync_list_update);

// app.post("/movement/list/create", movementController.movement_list_create);
// app.post("/movement/list", movementController.movement_list_get);
// app.post("/movement/list/sync", movementController.list_sync);
// app.post("/movement/update/list/sync", movementController.sync_list_update);

app.post("/cashRegister/read/last/open", cashRegisterController.read_last_open);
app.post("/cashRegister/create", cashRegisterController.create);
app.post("/cashRegister/read", cashRegisterController.read);
app.post("/cashRegister/read/list", cashRegisterController.read_list);
app.post(
  "/cashRegister/close/last/open",
  cashRegisterController.close_last_open
);
app.get(
  "/cashRegister/open/last/close",
  cashRegisterController.open_last_close
);
app.post("/cashRegister/list/sync", cashRegisterController.list_sync);
app.post(
  "/cashRegister/update/list/sync",
  cashRegisterController.update_list_sync
);

async function start() {
  await mongoose.connect(MONGODB_URL, {
    autoIndex: true,
    maxPoolSize: 50,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 30000,
  });

  app.listen(PORT);
  console.log("Servidor encendido en http://localhost:" + PORT);
}
start();
