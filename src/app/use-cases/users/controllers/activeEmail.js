const User = require("../../../model/User")
const sendMail = require("../../../mail/sendMail")
const { randomUUID } = require('crypto')
const moment = require("moment")

module.exports = {
    async activeEmail(req, res) {
        try {
            const { token } = req.body
            
            if (!token) return res.status(404).send({
                message: "Informe o token"
            })

            const user = await User.findOne({
                check_email_token: token
            })

            if (!user) return res.status(400).send({
                message: "Token invalido"
            })
            else {
                if (moment().isAfter(user.check_email_expires_at))
                    return res.status(400).send({
                        message: "Token expirado."
                    })
                else {
                    await user.updateOne({
                        $set: {
                            email: user.check_email,
                            check_email: null,
                            check_email_token: null,
                            check_email_expires_at: null
                        }
                    })
                    res.status(200).send({
                        user,
                        message: "Email activado com suceso"
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