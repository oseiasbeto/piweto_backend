
const { app } = require("./src/app")
const PORT = process.env.PORT;

const { executeGPOPayment } = require("./src/app/services/aki")

executeGPOPayment({
    price: 100,
    order_id: "6",
    description: "Teste de pagamento",
    out_trade_no: "TESTE1234",
    phone_num: "948360831"
}).then(res => console.log(res.data))
.catch(err => console.log(err.response.data))

app.listen(PORT, () => console.log(`Servidor rodando na porta: ${PORT}`))