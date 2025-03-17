const User = require("../../../model/User")
const bcrypt = require("bcryptjs")
const moment = require("moment")

module.exports = {
    async resetPassword(req, res) {
        try {
            const { new_password } = req.body
            const { otp } = req.params


            if (!otp) return res.status(400).send({
                message: "Informe o codigo de recuperacao para redefinir a senha."
            })

            const user = await User.findOne({
                password_reset_otp_code: otp
            })

            if (!user) return res.status(400).send({
                message: "Este codigo esta invalido, solicite recuperacao de senha e tente novamnente!."
            })
            else {
                if (moment().isAfter(user.password_reset_otp_expires_at)) 
                    return res.status(400).send({
                    message: "Ups! este codigo esta expirado, solicite a recuperacao de senha e tente novamente!"
                })
                else if (new_password == undefined || new_password == '')
                    return res.status(400).send({
                        message: "Informe a tua nova palavra-passe!"
                    })
                else {
                    if (new_password.length < 6) return res.status(400).send({
                        message: "A tua palavra-passe deve ter pelomenos 8 caracteres."
                    })
                    else {
                        const password_hash = await bcrypt.hash(new_password, 10)

                        await user.updateOne({
                            $set: {
                                password: password_hash,
                                password_reset_otp_code: null,
                                password_reset_otp_expires_at: null,
                                updated_at: moment()
                            }
                        })
                        res.status(200).send({
                            user,
                            message: "Parabens! a tua senha foi redefinida com sucesso."
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