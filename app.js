require("dotenv").config();
const PORT = process.env.PORT || 4000;
const APP_MASTER_PASSWORD = process.env.APP_MASTER_PASSWORD;

const MONGODB_URL = process.env.MONGODB_URL;
const extractUser = require("./middleware/extractUser");
const Client = require("./models/Client");
const SyncServer = require("./synchronization/SyncServer");
const CashRegister = require("./models/CashRegister");
const Invoice = require("./models/Invoice");
const Movement = require("./models/Movement");
const Product = require("./models/Product");
const Sale = require("./models/Sale");
const Payment = require("./models/Payment");
const authController = require("./controllers/authController");
const { verifyUser, login_post } = require("./controllers/authController");
const User = require("./models/User");
const Warehouse = require("./models/Warehouse");
const bcrypt = require("bcrypt");
const { v7: uuidv7 } = require("uuid");
const utils = require("./utils/auth");
const LastSeen = require("./models/LastSeen");
const UserWarehouse = require("./models/UserWarehouse");
const Campaign = require("./models/Campaign");
const Category = require("./models/Category");
const DraftProduct = require("./models/DraftProduct");
const PaymentMethod = require("./models/PaymentMethod");
const ProductTag = require("./models/ProductTag");
const QuantityPromo = require("./models/QuantityPromo");
const RangeDiscount = require("./models/RangeDiscount");
const RangeReservation = require("./models/RangeReservation");
const Tag = require("./models/tag");

const users = {
  EMPLOYEE: {
    campaign: ["write", "read"],
    cashRegister: ["write", "read"],
    category: ["write", "read"],
    client: ["write", "read"],
    draftProduct: ["write", "read"],
    invoice: ["write", "read"],
    lastSeen: ["write", "read"],
    movement: ["write", "read"],
    payment: ["write", "read"],
    paymentMethod: ["write", "read"],
    product: ["write", "read"],
    productTag: ["write", "read"],
    quantityPromo: ["write", "read"],
    rangeDiscount: ["write", "read"],
    rangeReservation: ["write", "read"],
    sale: ["write", "read"],
    tag: ["write", "read"],
    user: ["write", "read"],
    userWarehouse: ["write", "read"],
    warehouse: ["write", "read"],
    serverData: ["write", "read"],
    verify: ["write", "read"],
  },
  INVENTORY_MANAGER: {
    campaign: ["write", "read"],
    cashRegister: ["write", "read"],
    category: ["write", "read"],
    client: ["write", "read"],
    draftProduct: ["write", "read"],
    invoice: ["write", "read"],
    lastSeen: ["write", "read"],
    movement: ["write", "read"],
    payment: ["write", "read"],
    paymentMethod: ["write", "read"],
    product: ["write", "read"],
    productTag: ["write", "read"],
    quantityPromo: ["write", "read"],
    rangeDiscount: ["write", "read"],
    rangeReservation: ["write", "read"],
    sale: ["write", "read"],
    tag: ["write", "read"],
    user: ["write", "read"],
    userWarehouse: ["write", "read"],
    warehouse: ["write", "read"],
    serverData: ["write", "read"],
    verify: ["write", "read"],
  },
};
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
  auth: (req, res, next, process, type) => {
    const user = res.locals.user;
    const role = user.role?.toUpperCase();
    const userData = users[role];
    // console.log("CUMPLE ??? ", process, type, role, userData?.[process]);
    if (userData?.[process]?.includes(type) || role == "ADMIN") {
      if (process == "verify" && role != "ADMIN") {
        res.locals.verifyTables = Object.keys(userData);
      }
      next();
    } else {
      res.json({ error: "_404" });
    }
  },
});

SyncServer.syncPost({
  model: CashRegister,
  tableName: "cashRegister",
  filterLocalResponse: (req, res) => {
    const user = res.locals.user;
    if (user.role == "ADMIN") {
      return {};
    }
    return { warehouseUuid: { $in: user.warehouses } };
  },
});
SyncServer.syncPost({ model: Campaign, tableName: "campaign" });
SyncServer.syncPost({ model: Category, tableName: "category" });
SyncServer.syncPost({ model: DraftProduct, tableName: "draftProduct" });
SyncServer.syncPost({ model: PaymentMethod, tableName: "paymentMethod" });
SyncServer.syncPost({ model: DraftProduct, tableName: "draftProduct" });
SyncServer.syncPost({ model: ProductTag, tableName: "productTag" });
SyncServer.syncPost({ model: QuantityPromo, tableName: "quantityPromo" });
SyncServer.syncPost({ model: RangeDiscount, tableName: "rangeDiscount" });
SyncServer.syncPost({ model: RangeReservation, tableName: "rangeReservation" });
SyncServer.syncPost({ model: Tag, tableName: "tag" });

SyncServer.syncPost({ model: Client, tableName: "client" });
SyncServer.syncPost({
  model: Invoice,
  tableName: "invoice",
  filterLocalResponse: (req, res) => {
    const user = res.locals.user;
    if (user.role == "ADMIN") {
      return {};
    }
    return { warehouseUuid: { $in: user.warehouses } };
  },
});
SyncServer.syncPost({
  model: Movement,
  tableName: "movement",
  filterLocalResponse: (req, res) => {
    const user = res.locals.user;
    if (user.role == "ADMIN") {
      return {};
    }
    return {
      $or: [
        { origin: { $in: user.warehouses } },
        { destination: { $in: user.warehouses } },
      ],
    };
  },
});
SyncServer.syncPost({
  model: Payment,
  tableName: "payment",
  filterLocalResponse: (req, res) => {
    const user = res.locals.user;
    if (user.role == "ADMIN") {
      return {};
    }
    return { warehouseUuid: { $in: user.warehouses } };
  },
});
SyncServer.syncPost({
  model: LastSeen,
  tableName: "lastSeen",
  filterLocalResponse: (req, res) => {
    const user = res.locals.user;
    if (user.role == "ADMIN") {
      return {};
    }
    return { userUuid: user.uuid };
  },
});
SyncServer.syncPost({ model: Product, tableName: "product" });
SyncServer.syncPost({
  model: Sale,
  tableName: "sale",
  filterLocalResponse: (req, res) => {
    const user = res.locals.user;
    if (user.role == "ADMIN") {
      return {};
    }
    return { warehouseUuid: { $in: user.warehouses } };
  },
});
SyncServer.syncPost({ model: Warehouse, tableName: "warehouse" });
SyncServer.syncPost({
  model: UserWarehouse,
  tableName: "userWarehouse",
  filterLocalResponse: (req, res) => {
    const user = res.locals.user;
    if (user.role == "ADMIN") {
      return {};
    }
    return { user: user.uuid };
  },
});

SyncServer.syncPost({
  model: User,
  tableName: "user",
  excludedFields: ["password", "version"],
  filterLocalResponse: (req, res) => {
    const user = res.locals.user;
    if (user.role == "ADMIN") {
      return {};
    }
    return { userUuid: user.uuid };
  },
  onCreatePreviousServer: async (doc) => {
    console.log("el password es ", doc.password);
    doc.uuid = uuidv7();
    doc.password = await utils.getPasswordBcrypt(doc.password);
    await SyncServer.addTask({
      tableName: "userWarehouse",
      useTransaction: true,
      task: async (session) => {
        for (const warehouseUuid of doc.warehouses) {
          await SyncServer.createOrGet({
            tableName: "userWarehouse",
            doc: { user: doc.uuid, warehouse: warehouseUuid },
            session,
          });
        }
      },
    });
  },
});

SyncServer.start({
  exec: async () => {
    let admin = await User.findOne({
      uuid: "_",
    });
    if (admin != null) {
      if (!(await bcrypt.compare(APP_MASTER_PASSWORD, admin.password))) {
        admin.password = await utils.getPasswordBcrypt(APP_MASTER_PASSWORD);
        await admin.save();
      }
    } else {
      const syncCodeMax = await SyncServer.updateAndGetSyncCode("user");

      await User.create({
        uuid: "_",
        username: "ADMIN",
        role: "ADMIN",
        syncCode: syncCodeMax,
        password: await utils.getPasswordBcrypt(APP_MASTER_PASSWORD),
      });
    }
  },
});
