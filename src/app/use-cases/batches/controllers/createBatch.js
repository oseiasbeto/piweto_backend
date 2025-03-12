const Batch = require("../../../model/Batch")
const Event = require("../../../model/Event")

module.exports = {
    async createBatch(req, res) {
        try {
            const { id } = req.params
            const {
                nomenclature,
                name,
                quantity,
                quantity_for_purchase,
                price,
                visibility,
                tickets_period_sales,
                description,
                starts_at,
                ends_at,
            } = req.body

            if (!id) return res.status(400).send({
                message: "Informe o id do evento."
            })

            const event = await Event.findOne({
                _id: id
            })

            if (!event) return res.status(400).send({
                message: "Algo deu errado."
            })
            else {
                const newBatch = await Batch.create({
                    nomenclature,
                    name,
                    quantity,
                    quantity_for_purchase,
                    price,
                    event: event._id,
                    type: 'premium',
                    visibility,
                    tickets_period_sales,
                    description,
                    starts_at,
                    ends_at,
                })

                await event.updateOne({
                    $inc: {
                        tickets_available_count: Number(quantity)
                    }
                })

                res.status(200).send({
                    newBatch,
                    message: "Lote criado com sucesso."
                })
            }
        } catch (err) {
            res.status(500).send({
                mensagem: err.message // erro interno
            })
        }
    }
}