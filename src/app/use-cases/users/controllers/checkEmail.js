const User = require("../../../model/User")
const sendMail = require("../../../mail/sendMail")
const { randomUUID } = require('crypto')
const moment = require("moment")

module.exports = {
    async checkEmail(req, res) {
        try {
            const { email } = req.body
            const user_id = req.user.id


            if (!email) return res.status(400).send({
                message: "Informe o seu e-mail"
            })

            const user = await User.findOne({
                _id: user_id
            })

            if (!user) return res.status(400).send({
                message: "Algo deu errado!"
            })
            const anotherUser = await User.findOne({
                email
            })
            if (anotherUser) return res.status(400).send({
                message: "Este e-mail ja esta em uso!"
            })
            else {
                if (moment().isBefore(user.check_email_expires_at))
                    return res.status(400).send({
                        message: "Já existe um código enviado recentemente. Aguarde antes de solicitar um novo."
                    })
                else {
                    const token = randomUUID()
                    const confirmAccountLink = `${process.env.CLIENT_URL}conta/activar-email?token=${token}`
                    await user.updateOne({
                        $set: {
                            check_email: email,
                            check_email_token: token,
                            check_email_expires_at: moment().add("2", 'h')
                        }
                    })
                    sendMail(email, 'confirm-email', `Confirme seu e-mail`, {
                        userFullName: user.full_name,
                        confirmAccountLink
                    })
                    res.status(200).send({
                        message: "Parabens! o a tua conta foi verificada com sucesso."
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