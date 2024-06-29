const mongoose = require("mongoose");
const express = require("express");
const app = express();
require("dotenv").config();
const cookieParser = require("cookie-parser");
const authController = require("./controllers/authController");
const adminController = require("./controllers/adminController");

const extractUser = require("./middleware/extractUser");

const vehicleController = require("./controllers/vehicleController");
const clientController = require("./controllers/clientController");
const saleController = require("./controllers/saleController");

const productController = require("./controllers/productController");
const transactionController = require("./controllers/transactionController");
const movementController = require("./controllers/movementController");

const clientValidator = require("./validator/clientValidator");
const vehicleValidator = require("./validator/vehicleValidator");

const PORT = process.env.PORT;
const MONGODB_URL = process.env.MONGODB_URL;

app.use(express.static("public"));
app.use(express.json());
app.use(cookieParser());

app.set("view engine", "ejs");
app.set("view engine", "html");
app.engine("html", require("ejs").renderFile);
app.get("/", (req, res) => {
  res.render("inventory/index");
});

app.post("/client/create", clientController.client_create);
app.post("/client/read", clientController.client_read);
app.post(
  "/client/update",
  clientValidator.client_update,
  clientController.client_update
);
app.post("/client/delete", clientController.client_delete);

app.post("/client/list", clientController.client_list_get);

app.post("/sale/create/list", saleController.sale_create_list);
app.post("/sale/list", saleController.sale_list_get);

app.post("/product/create", productController.product_create);
app.post("/product/read", productController.product_read);
app.post("/product/update", productController.product_update);
app.post("/product/delete", productController.product_delete);
app.post("/product/list", productController.product_list_get);
app.post("/product/create/list", productController.product_create_list);

app.post("/debt/list/get", transactionController.debt_list);
app.post("/debt/create", transactionController.debt_create);

app.post("/payment/create", transactionController.payment_create);
// app.post("/payment/update", transactionController.payment_update);
// app.post("/payment/delete", transactionController.payment_delete);
app.post("/payment/list/", transactionController.payment_list_get);

app.post("/invoice/list/", saleController.invoice_list_get);

app.post("/movement/list/create", movementController.movement_list_create);
app.post("/movement/list", movementController.movement_list_get);

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
