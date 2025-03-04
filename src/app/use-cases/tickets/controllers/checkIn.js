const Ticket = require("../../../model/Ticket")
const Event = require("../../../model/Event")
const moment = require("moment")

module.exports = {
    async checkIn(req, res) {
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
                if (ticket.check_in.at !== null || ticket.check_in.status === 'a')
                    return res.status(400).send({
                        ticket,
                        message: "Este ingresso ja foi checkado"
                    })
                else {
                    await ticket.updateOne({
                        $set: {
                            check_in: {
                                status: "a",
                                at: moment()
                            }
                        }
                    })
                    await Event.updateOne(
                        {
                            _id: ticket.event
                        }, {
                        $inc: {
                            tickets_checked_count: 1
                        }
                    })
                    res.status(200).send({
                        ticket,
                        message: "Ingresso checkado com sucesso."
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