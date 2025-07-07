const Order = require("../../../model/Order")

module.exports = {
    async getOrderById(req, res) {
        try {
            const { id } = req.params

            if (!id) return res.status(400).send({
                message: "Informe o id do pedido."
            })

            const order = await Order.findOne({
                id,
              //  status: "p"
            }).populate("event")
            
            if(!order) return res.status(404).send({
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