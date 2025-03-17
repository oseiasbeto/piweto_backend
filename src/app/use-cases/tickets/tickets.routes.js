const express = require("express");
const router = express.Router();

// importando os middlewares
const protectedRoute = require("../../middlewares/protectedRoute")
//const validObjectId = require("../../middlewares/validObjectId")

// importando os controllers
const { getAllTickets } = require("./controllers/getAllTickets")
const { getTicketByCode } = require("./controllers/getTicketByCode")
const { checkIn } = require("./controllers/checkIn")

// configurando as rotas
router.get("/", protectedRoute, getAllTickets)
router.get("/:code", protectedRoute, getTicketByCode)
router.put("/:code", checkIn)

// exportando as rotas
module.exports = router