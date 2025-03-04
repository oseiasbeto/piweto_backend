const Event = require("../../../model/Event")
const generateSlugName = require("../../../utils/generateSlugName")

module.exports = {
    async updateEvent(req, res) {
        try {
            const { id } = req.params
            const {
                name,
                description,
                address,
                category,
                status,
                visibility,
                show_on_map,
                starts_at,
                ends_at
            } = req.body

            if (!id) return res.status(400).send({
                message: "Informe o id do lote."
            })

            const event = await Event.findOne({
                _id: id
            })

            if (!event) return res.status(404).send({
                message: "Ups! nao achamos nenhum evento com este id."
            })
            else {
                await event.updateOne({
                    $set: {
                        name: name ?? event.name,
                        address: address ?? event.address,
                        category: category ?? event.category,
                        show_on_map: show_on_map ?? event.show_on_map,
                        visibility: visibility ?? event.visibility,
                        slug: name ? `${generateSlugName(name)}` : event.slug,
                        tags: name ? [...event.tags, name] : event.tags,
                        status: status ?? event.status,
                        description: description ?? event.description,
                        starts_at: starts_at ?? event.starts_at,
                        ends_at: ends_at ?? event.ends_at
                    }
                })

                res.status(200).send({
                    message: "Evento editado com sucesso."
                })
            }
        } catch (err) {
            res.status(500).send({
                mensagem: err.message // erro interno
            })
        }
    }
}