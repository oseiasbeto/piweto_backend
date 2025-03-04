const express = require("express");
const router = express.Router();

// importando os middlewares
const protectedRoute = require("../../middlewares/protectedRoute")
//const validObjectId = require("../../middlewares/validObjectId")

// importando os controllers
const { getAllBatches } = require("./controllers/getAllBatches")
const { deleteBatch } = require("./controllers/deleteBatch")
const { updateBatch } = require("./controllers/updateBatch")

// configurando as rotas
router.get("/", getAllBatches)
router.delete("/:id", protectedRoute, deleteBatch)
router.put("/:id", protectedRoute, updateBatch)


// exportando as rotas
module.exports = router