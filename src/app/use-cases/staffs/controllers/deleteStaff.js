const Staff = require("../../../model/Staff")
const Event = require("../../../model/Event")

module.exports = {
    async deleteStaff(req, res) {
        try {
            const { staff_id, event_id, member_id } = req.params

            if (!event_id) return res.status(400).send({
                message: "Informe o id do do evento da staff."
            })

            const event = await Event.findOne({
                _id: event_id
            })

            if(!event) return res.status(400).send({
                message: "Nao foi possivel achar o corrente evento!"
            })

            const staff = await Staff.findByIdAndDelete({
                _id: staff_id,
                event: event._id,
                member: member_id
            })
            
            if(!staff) return res.status(404).send({
                message: "Houve um problema ao tentar eliminar esta staff."
            })
            else {
                res.status(200).send({
                    staff,
                    event,
                    message: "Staff deletada com sucesso."
                })
            }
        } catch (err) {
            res.status(500).send({
                mensagem: err.message // erro interno
            })
        }
    }
}