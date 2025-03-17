const User = require("../../../model/User")
const moment = require("moment")

module.exports = {
    async checkOTPPassword(req, res) {
        try {
            const { otp } = req.params

            if (!otp) return res.status(400).send({
                message: "Informe o codigo de recuperacao de sua senha!"
            })

            const user = await User.findOne({
                password_reset_otp_code: otp
            })

            if (!user) return res.status(400).send({
                message: "Este codigo esta invalido, solicite a recuperacao de senha e tente novamnente!"
            })
            else {
                if (moment().isAfter(user.password_reset_otp_expires_at)) 
                    return res.status(400).send({
                    message: "Ups! este codigo de recuperacao de senha esta expirado, reenvie um novo codigo e tente novamente!"
                })
                else {
                    res.status(200).send({
                        otp,
                        message: "Codigo valido!"
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