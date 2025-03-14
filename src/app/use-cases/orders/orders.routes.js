const express = require("express");
const router = express.Router();

// importando os middlewares
const protectedRoute = require("../../middlewares/protectedRoute")
//const validObjectId = require("../../middlewares/validObjectId")

// importando os controllers
const { createOrder } = require("./controllers/createOrder")
const { getOrderById } = require("./controllers/getOrderById")
const { notificationTrigger } = require("./controllers/notificationTrigger")

// configurando as rotas
router.post("/notification-trigger", notificationTrigger)
router.post("/:event_id", protectedRoute, createOrder)
router.get("/:id", protectedRoute, getOrderById)


// exportando as rotas
module.exports = router