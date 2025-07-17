const express = require("express");
const router = express.Router();

// importando os middlewares
const protectedRoute = require("../../middlewares/protectedRoute")
//const validObjectId = require("../../middlewares/validObjectId")

// importando os controllers
const { getAllTickets } = require("./controllers/getAllTickets")
const { getTicketByCode } = require("./controllers/getTicketByCode")
const { checkIn } = require("./controllers/checkIn")
const { getUserTickets } = require("./controllers/getUserTickets")
const { getPartakers } = require("./controllers/getPartakers")
const { searchTicketsByTags } = require("./controllers/searchTicketsByTags")

// configurando as rotas
router.get("/", protectedRoute, getAllTickets)
router.get("/user", protectedRoute, getUserTickets)
router.get("/partakers", protectedRoute, getPartakers)
router.get("/user/search", protectedRoute, searchTicketsByTags)
router.get("/:code", getTicketByCode)
router.put("/:code", checkIn)

// exportando as rotas
module.exports = router