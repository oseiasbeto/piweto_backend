const User = require("../../../model/User")
const moment = require("moment")
const { randomUUID } = require("crypto")
const sendMessage = require('../../../services/sendMessage')
const userTransformer = require("../../../utils/userTransformer")

module.exports = {
    async forgotPassword(req, res) {
        try {
            const { phone } = req.body

            if (!phone) return res.status(400).send({
                message: "Informe o seu numero de telefone."
            })

            const user = await User.findOne({
                phone: phone.replace(/\s/g, '')
            })

            if (!user) return res.status(400).send({
                message: "Ups! nao achamos nenhum usuario com este numero de telefone."
            })
            else {
                if (moment().isBefore(user.password_reset_otp_expires_at)) return res.status(400).send({
                    message: "O codigo enviado ainda nao expirou, por favor tente novamente mais tarde!"
                })
                else {
                    function generateOTP() {
                        return Math.floor(1000 + Math.random() * 9000).toString();
                    }

                    const otp = generateOTP();

                    const password_reset_otp_code = otp
                    const password_reset_otp_expires_at = moment().add("2", 'h')

                    await user.updateOne({
                        $set: {
                            password_reset_otp_code,
                            password_reset_otp_expires_at
                        }
                    })

                    sendMessage(user.phone, `${otp} este e o seu código de recuperacao de senha`)
                    res.status(200).send({
                        user: userTransformer(user),
                        message: "Boa, enviamos uma SMS com o codigo de recuperacao no seu telefone para redefinir a tua senha!"
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