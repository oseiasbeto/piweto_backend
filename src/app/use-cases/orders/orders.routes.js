const express = require("express");
const router = express.Router();

// importando os middlewares
const protectedRoute = require("../../middlewares/protectedRoute")
//const validObjectId = require("../../middlewares/validObjectId")

// importando os controllers
const { createOrder } = require("./controllers/createOrder")
const { getOrderById } = require("./controllers/getOrderById")
const { getOrderByIdAndPin } = require("./controllers/getOrderByIdAndPin")
const { notificationTrigger } = require("./controllers/notificationTrigger")

// configurando as rotas
router.post("/notification-trigger", notificationTrigger)
router.post("/reservation", getOrderByIdAndPin)
router.post("/:event_id", createOrder)
router.get("/:id", getOrderById)


// exportando as rotas
module.exports = router