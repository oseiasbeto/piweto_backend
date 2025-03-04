const express = require("express");
const router = express.Router();

// Importando os middlewares
const protectedRoute = require("../../middlewares/protectedRoute");

// Importando os controllers
const { requestPayout } = require("./controllers/requestPayout");
const { updatePayoutStatus } = require("./controllers/updatePayoutStatus");

// Configuração das rotas
router.post("/", protectedRoute, requestPayout);
router.put("/:payout_id", protectedRoute, updatePayoutStatus);

// Exportando as rotas
module.exports = router;
