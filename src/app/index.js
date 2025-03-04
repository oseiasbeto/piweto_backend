// importando as libs
require('dotenv').config()
const path = require("path")
const cors = require("cors")
const express = require("express")
const app = express()
const { connectRedis } = require("./redisClient")

// conectar com a database
const connectDB = require('./config/connectDb');
connectDB();

connectRedis()

// configurando os middlewares
app.use(cors())
app.use(express.json())
app.use("/files", express.static(path.resolve(__dirname, "..", "uploads")))

// importando as rotas do app
const users = require("./use-cases/users/users.routes")
const events = require("./use-cases/events/events.routes")
const orders = require("./use-cases/orders/orders.routes")
const staffs = require("./use-cases/staffs/staffs.routes")
const batches = require("./use-cases/batches/batches.routes")
const tickets = require("./use-cases/tickets/tickets.routes")
const payouts = require("./use-cases/payouts/payouts.routes")

// usando as rotas do app
app.use("/v1/users", users)
app.use("/v1/events", events)
app.use("/v1/orders", orders)
app.use("/v1/staffs", staffs)
app.use("/v1/batches", batches)
app.use("/v1/tickets", tickets)
app.use("/v1/payouts", payouts)

// Rota de boas-vindas
app.get("/", (req, res) => {
    res.json({
        message: "🚀 Bem-vindo à API da Piweto!",
        status: "running"
    });
});

app.use((err, req, res, next) => {
    console.error(err.stack); // Imprime o erro no console para monitoramento

    // Responde com uma mensagem genérica de erro
    res.status(500).json({
        message: 'Ocorreu um erro interno, por favor tente novamente mais tarde.',
        error: process.env.NODE_ENV === 'dev' ? err : {} // Exibe o erro completo no desenvolvimento
    });
});

// exportando o app
module.exports = { app }