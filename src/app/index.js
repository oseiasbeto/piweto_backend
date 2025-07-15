// Importando as bibliotecas necessárias
require('dotenv').config() // Carrega variáveis de ambiente do arquivo .env
const path = require("path") // Módulo nativo do Node.js para manipulação de caminhos de arquivos/diretórios
const cors = require("cors") // Middleware para habilitar CORS (Cross-Origin Resource Sharing)
const express = require("express") // Framework web para Node.js
const app = express() // Criando uma instância do Express
const bodyParser = require('body-parser') // Middleware para processar dados do corpo da requisição
const { connectRedis } = require("./redisClient") // Importa função para conectar ao Redis


// Conectando ao banco de dados
const connectDB = require('./config/connectDb'); // Importa a função de conexão com o banco de dados
connectDB(); // Chama a função para estabelecer a conexão

// Obtendo a variável de ambiente para determinar o ambiente de execução
const env = process.env.NODE_ENV

// Se o ambiente for de produção, conecta ao Redis
if (env === 'prod') {
    connectRedis()
}

// Configuração dos middlewares
app.use(cors()) // Habilita CORS para permitir requisições de diferentes domínios
app.use(express.json()) // Permite o recebimento de JSON no corpo das requisições
app.use(bodyParser.urlencoded({ extended: true })); // Configura o body-parser para processar dados codificados na URL

// Servindo arquivos estáticos da pasta 'uploads'
app.use("/files", express.static(path.resolve(__dirname, "..", "uploads")))

// Importando as rotas do aplicativo
const users = require("./use-cases/users/users.routes")
const events = require("./use-cases/events/events.routes")
const orders = require("./use-cases/orders/orders.routes")
const staffs = require("./use-cases/staffs/staffs.routes")
const batches = require("./use-cases/batches/batches.routes")
const tickets = require("./use-cases/tickets/tickets.routes")
const coupons = require("./use-cases/coupons/coupons.routes")
const payouts = require("./use-cases/payouts/payouts.routes")

// Registrando as rotas no aplicativo
app.use("/v1/users", users) // Rotas relacionadas a usuários
app.use("/v1/events", events) // Rotas relacionadas a eventos
app.use("/v1/orders", orders) // Rotas relacionadas a pedidos
app.use("/v1/staffs", staffs) // Rotas relacionadas a equipe/administração
app.use("/v1/batches", batches) // Rotas relacionadas a lotes de ingressos
app.use("/v1/tickets", tickets) // Rotas relacionadas a ingressos
app.use("/v1/coupons", coupons) 
app.use("/v1/payouts", payouts) // Rotas relacionadas a pagamentos

// Rota de boas-vindas
app.get("/", (req, res) => {
    res.json({
        message: "🚀 Bem-vindo à API da Piweto!", // Mensagem de boas-vindas
        status: "running" // Indica que a API está rodando
    });
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
    console.error(err.stack); // Exibe o erro no console para facilitar o debug

    // Retorna uma resposta de erro para o cliente
    res.status(500).json({
        message: 'Ocorreu um erro interno, por favor tente novamente mais tarde.', // Mensagem genérica para o usuário
        error: process.env.NODE_ENV === 'dev' ? err : {} // Exibe detalhes do erro apenas em ambiente de desenvolvimento
    });
});

// Exportando a instância do Express para ser utilizada em outros módulos
module.exports = { app }
