const Event = require("../../../model/Event")
const User = require("../../../model/User")
const sendMail = require("../../../mail/sendMail")

module.exports = {
    async processEvent(req, res) {
        try {

            const { id } = req.params
            const { status } = req.body

            if (!id) return res.status(400).send({
                message: "Informe o id do evento."
            })

            const event = await Event.findOne({
                _id: id,
                status: 'p'
            }).populate("created_by")

            if (!event) return res.status(404).send({
                message: "Ups! nao achamos nenhum evento com este id e com status 'p'."
            })
            else {
                const admin = await User.findOne({
                    _id: req.user.id,
                    role: 'admin',
                    status: "a"
                })

                if (!admin) return res.status(403).send({
                    message: "Voce nao tem permissao para fazer esta requesicao."
                })
                else {
                    if (!status) return res.status(400).send({
                        message: "Informe o status/"
                    })
                    else {
                        await event.updateOne({
                            $set: {
                                status
                            }
                        })

                        if (event?.created_by?.email) {
                            sendMail(event.created_by.email, 'status-event', `Status do seu evento - ${event.name}`, {
                                userFullName: event.created_by.name.full_name,
                                eventTitle: event.name,
                                isApproved: status == 'a' ? true : false,
                                eventLink: process.env.CLIENT_URL + `evento/${event.created_by.slug}`,
                                rejectionReason: status == 'r' ? 'O evento não atende aos requisitos da plataforma.' : ''
                            })
                        }
                        
                        res.status(200).send({
                            message: "Status do evento actualizado com sucesso."
                        })
                    }
                }
            }
        } catch (err) {
            res.status(500).send({
                mensagem: err.message // erro interno
            })
        }
    }
}