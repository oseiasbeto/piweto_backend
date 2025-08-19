const Order = require("../../../model/Order")

module.exports = {
    async getOrderByIdAndPin(req, res) {
        try {
            const { id, pin } = req.body

            if (!id) return res.status(400).send({
                message: "Informe o numero da reserva."
            })

            if (!pin) return res.status(400).send({
                message: "Informe o PIN da reserva."
            })

            const order = await Order.findOne({
                id,
                pin
            }).populate("event").lean()

            if (!order) return res.status(400).send({
                message: "Ups! nao achamos nenhum pedido com este id."
            })
            else {
                res.status(200).send({
                    order,
                    message: "Pedido encontrado com sucesso."
                })
            }
        } catch (err) {
            res.status(500).send({
                mensagem: err.message // erro interno
            })
        }
    }
}