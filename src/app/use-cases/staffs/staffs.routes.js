const express = require("express");
const router = express.Router();

// importando os middlewares
const protectedRoute = require("../../middlewares/protectedRoute")
//const validObjectId = require("../../middlewares/validObjectId")

// importando os controllers
const { getAllStaff } = require("./controllers/getAllStaff")
const { getStaffByEventAndMemberId } = require("./controllers/getStaffByEventAndMemberId")
const { sendInviteStaff } = require("./controllers/sendInvite")
const { deleteStaff } = require("./controllers/deleteStaff")

// configurando as rotas
router.get("/", protectedRoute, getAllStaff)
router.get("/:event_id", protectedRoute, getStaffByEventAndMemberId)
router.post("/:event_id", protectedRoute, sendInviteStaff)
router.delete("/:staff_id/:event_id/:member_id", protectedRoute, deleteStaff)

// exportando as rotas
module.exports = router