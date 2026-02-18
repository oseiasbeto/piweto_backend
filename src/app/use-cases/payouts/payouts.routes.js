const express = require("express");
const router = express.Router();

// Importando os middlewares
const protectedRoute = require("../../middlewares/protectedRoute");

// Importando os controllers
const { requestPayout } = require("./controllers/requestPayout");
const { updatePayoutStatus } = require("./controllers/updatePayoutStatus");
const { getAllPayouts } = require("./controllers/getAllPayouts");

// Configuração das rotas
router.post("/", protectedRoute, requestPayout);
router.put("/:payout_id", updatePayoutStatus);
router.get("/", protectedRoute, getAllPayouts);

// Exportando as rotas
module.exports = router;
