const Batch = require("../../../model/Batch")
const Event = require("../../../model/Event")

module.exports = {
    async deleteBatch(req, res) {
        try {
            const { id } = req.params

            if (!id) return res.status(400).send({
                message: "Informe o id do lote."
            })

            const batch = await Batch.findOne({
                _id: id
            })

            if (!batch) return res.status(404).send({
                message: "Ups! nao achamos nenhum lote com este id."
            })
            else {
                const event = await Event.findOne({
                    _id: batch.event
                })

                if (!event) return res.status(400).send({
                    message: "Algo deu errado."
                })
                else {
                    await batch.deleteOne()
                    await event.updateOne({
                        $inc: {
                            tickets_available_count: -batch.quantity
                        }
                    })
                    res.status(200).send({
                        message: "Lote eliminado com sucesso."
                    })
                }

            }
        } catch (err) {
            res.status(500).send({
                mensagem: err.message // erro interno
            })
        }
    }
}