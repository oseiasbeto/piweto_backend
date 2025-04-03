
const { app } = require("./src/app")
const PORT = process.env.PORT;

//const {executePaymentToAccount} = require('./src/app/services/paypay')
app.listen(PORT, () => console.log(`Servidor rodando na porta: ${PORT}`))