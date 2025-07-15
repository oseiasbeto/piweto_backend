const express = require("express");
const router = express.Router();

// importando os middlewares
const protectedRoute = require("../../middlewares/protectedRoute")
//const validObjectId = require("../../middlewares/validObjectId")

// importando os controllers
const { validateCoupon } = require("./controllers/validateCoupon")

// configurando as rotas
router.post("/validate", validateCoupon)

// exportando as rotas
module.exports = router