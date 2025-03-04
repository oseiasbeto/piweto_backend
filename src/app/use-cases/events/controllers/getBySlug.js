const Event = require("../../../model/Event")

module.exports = {
    async getBySlug(req, res) {
        try {
            const { slug } = req.params

            if (!slug) return res.status(400).send({
                message: "Informe o slug do evento."
            })

            const event = await Event.findOne({
                slug,
                status: "a"
            })

            if (!event) return res.status(404).send({
                message: "Ups! nao achamos nenhum evento activo com este slug."
            })
            else {
                await event.updateOne({
                    $inc: {
                        views: 1
                    }
                })
                res.status(200).send({
                    event,
                    message: "Evento encontrado com sucesso."
                })
            }
        } catch (err) {
            res.status(500).send({
                mensagem: err.message // erro interno
            })
        }
    }
}