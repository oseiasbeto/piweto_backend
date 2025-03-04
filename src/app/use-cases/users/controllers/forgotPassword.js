const User = require("../../../model/User")
const moment = require("moment")
const { randomUUID } = require("crypto")
const sendMail = require("../../../mail/sendMail")

module.exports = {
    async forgotPassword(req, res) {
        try {
            const { email } = req.body

            if (!email) return res.status(400).send({
                message: "Informe o seu e-mail."
            })

            const user = await User.findOne({
                email
            })

            if (!user) return res.status(400).send({
                message: "Ups! nao achamos nenhum usuario com este email."
            })
            else {
                if (moment().isBefore(user.password_reset_expires_at)) return res.status(400).send({
                    message: "O token enviado ainda nao expirou, por favor tente novamente mais tarde!"
                })
                else {
                    const password_reset_token = randomUUID()
                    const password_reset_expires_at = moment().add("1", 'h')

                    await user.updateOne({
                        $set: {
                            password_reset_token,
                            password_reset_expires_at,
                            updated_at: moment()
                        }
                    })

                    sendMail(user.email, 'reset-password', 'Você solicitou uma nova senha ao Piweto', {
                        userFullName: user.full_name,
                        resetPasswordLink: `https://piweto.it.ao/conta/redefinir-senha?token=${password_reset_token}`
                    })
                    res.status(200).send({
                        message: "Boa, enviamos um token no seu e-mail para redefinir a tua senha!"
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