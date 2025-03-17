const User = require("../../../model/User")
const { redis } = require('../../../redisClient');
const moment = require("moment")

module.exports = {
    async checkOTPPhone(req, res) {
        try {
            const { otp } = req.params


            if (!otp) return res.status(400).send({
                message: "Informe o codigo de confirmacao para verificar a conta!"
            })

            const user = await User.findOne({
                check_otp_code: otp
            })

            if (!user) return res.status(400).send({
                message: "Este codigo esta invalido, crie uma nova conta e tente novamnente!"
            })
            else {
                if (moment().isAfter(user.check_otp_expires_at)) 
                    return res.status(400).send({
                    message: "Ups! este codigo de reconfirmacao esta expirado."
                })
                else {
                    await user.updateOne({
                        $set: {
                            status: 'a',
                            check_otp_code: null,
                            check_otp_expires_at: null,
                            updated_at: moment()
                        }
                    })
                    await redis.del(`conta:${user.check_otp_code}`);

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