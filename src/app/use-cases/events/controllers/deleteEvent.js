const Event = require("../../../model/Event")
const Staff = require("../../../model/Staff")

module.exports = {
    async deleteEvent(req, res) {
        try {
            const { id } = req.params

            if (!id) return res.status(400).send({
                message: "Informe o id do evento."
            })

            const event = await Event.findOne({
                _id: id
            })

            if (!event) return res.status(404).send({
                message: "Ups! nao achamos nenhum evento com este id."
            })
            else {
                await event.deleteOne()
                await Staff.deleteOne({
                    event: event._id
                })
                res.status(200).send({
                    message: "Evento eliminado com sucesso."
                })
            }
        } catch (err) {
            res.status(500).send({
                mensagem: err.message // erro interno
            })
        }
    }
}