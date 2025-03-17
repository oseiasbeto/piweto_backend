const Batch = require("../../../model/Batch")
const Event = require("../../../model/Event")
const updateTicketsCount = require("../../../utils/updateTicketsCount")

module.exports = {
    async updateBatch(req, res) {
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
                    await batch.updateOne({
                        $set: {
                            nomenclature: nomenclature ?? batch.nomenclature,
                            name: name ?? batch.name,
                            quantity: quantity ?? batch.quantity,
                            quantity_for_purchase: quantity_for_purchase ?? batch.quantity_for_purchase,
                            price: price ?? batch.price,
                            visibility: visibility ?? batch.visibility,
                            tickets_period_sales: tickets_period_sales ?? batch.tickets_period_sales,
                            description: description ?? batch.description,
                            starts_at: starts_at ?? batch.starts_at,
                            ends_at: ends_at ?? batch.ends_at
                        }
                    })
                    if (quantity !== undefined) {
                        await event.updateOne({
                            $set: {
                                tickets_available_count: updateTicketsCount(event.tickets_available_count, batch.quantity, quantity)
                            }
                        })
                    }

                    res.status(200).send({
                        message: "Lote editado com sucesso."
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