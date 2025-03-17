const express = require("express");
const router = express.Router();

// importando os middlewares
const protectedRoute = require("../../middlewares/protectedRoute")
const uploadMulter = require("../../middlewares/uploadMulter");

//const validObjectId = require("../../middlewares/validObjectId")

// importando os controllers
const { createEvent } = require("./controllers/createEvent")
const { getAllEvents } = require("./controllers/getAllEvents")
const { getBySlug } = require("./controllers/getBySlug")
const { getEventById } = require("./controllers/getEventById")
const { deleteEvent } = require("./controllers/deleteEvent")
const { updateEvent } = require("./controllers/updateEvent")
const { processEvent } = require("./controllers/processEvent");

// configurando as rotas
router.post("/", protectedRoute, uploadMulter.single("file"), createEvent)
router.get("/:slug", getBySlug)
router.get("/preview/:id", getEventById)
router.delete("/:id", protectedRoute, deleteEvent)
router.put("/", protectedRoute, uploadMulter.single("file"), updateEvent)
router.put("/:id/status", protectedRoute, processEvent)
router.get("/", getAllEvents)

// exportando as rotas
module.exports = router