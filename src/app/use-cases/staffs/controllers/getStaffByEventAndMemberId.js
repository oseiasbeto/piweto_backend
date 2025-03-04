const Staff = require("../../../model/Staff")
const Event = require("../../../model/Event")

module.exports = {
    async getStaffByEventAndMemberId(req, res) {
        try {
            const { event_id } = req.params
            const member_id = req.user.id

            if (!event_id) return res.status(400).send({
                message: "Informe o id do do evento da staff."
            })

            const event = await Event.findOne({
                id: event_id
            })

            if(!event) return res.status(400).send({
                message: "Nao foi possivel achar o corrente evento!"
            })

            const staff = await Staff.findOne({
                event: event._id,
                member: member_id
            })
            
            if(!staff) return res.status(404).send({
                message: "Ups! nao achamos nenhuma staff activa com id deste menbro."
            })
            else {
                res.status(200).send({
                    staff,
                    event,
                    message: "Staff encontrada com sucesso."
                })
            }
        } catch (err) {
            res.status(500).send({
                mensagem: err.message // erro interno
            })
        }
    }
}