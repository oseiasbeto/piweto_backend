const express = require("express");
const router = express.Router();

// importando os middlewares
const protectedRoute = require("../../middlewares/protectedRoute")
//const validObjectId = require("../../middlewares/validObjectId")

// importando os controllers
const { getAllStaff } = require("./controllers/getAllStaff")
const { getStaffByEventAndMemberId } = require("./controllers/getStaffByEventAndMemberId")

// configurando as rotas
router.get("/", protectedRoute, getAllStaff)
router.get("/:event_id", protectedRoute, getStaffByEventAndMemberId)

// exportando as rotas
module.exports = router