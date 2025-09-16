const Ticket = require("../../../model/Ticket")
const Event = require("../../../model/Event")
const moment = require("moment")

module.exports = {
    async undoCheckIn(req, res) {
        try {
            const { code } = req.params

            if (!code) return res.status(400).send({
                message: "Informe o codigo do ingresso."
            })

            const ticket = await Ticket.findOne({
                code,
                status: "a"
            })

            if (!ticket) return res.status(404).send({
                message: "Ups! nao achamos nenhum ingresso activo com este codigo."
            })
            else {
                if (ticket.check_in.at !== null || ticket.check_in.status === 'a') {
                    await ticket.updateOne({
                        $set: {
                            check_in: {
                                status: "p",
                                at: null
                            }
                        }
                    })
                    await Event.updateOne(
                        {
                            _id: ticket.event
                        }, {
                        $inc: {
                            tickets_checked_count: -1
                        }
                    })
                    res.status(200).send({
                        ticket,
                        message: "Checkin desfeito com sucesso."
                    })
                }

                else {
                    return res.status(400).send({
                        message: "Este ingresso ainda nao foi checkado"
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