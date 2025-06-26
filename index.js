
const { app } = require("./src/app")
const PORT = process.env.PORT;

//const {executePayPayPayment} = require('./src/app/services/paypay')
//executePayPayPayment(1, 'pagamento de bilhetes', `${Date.now()}`)
app.listen(PORT, () => console.log(`Servidor rodando na porta: ${PORT}`))