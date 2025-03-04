const User = require("../../../model/User")
const { redis } = require('../../../redisClient');
const moment = require("moment")

module.exports = {
    async checkEmail(req, res) {
        try {
            const { token } = req.params


            if (!token) return res.status(400).send({
                message: "Informe o token para redefinir a senha."
            })

            const user = await User.findOne({
                check_email_token: token
            })

            if (!user) return res.status(400).send({
                message: "Este token esta invalido, crie uma nova conta e tente novamnente!."
            })
            else {
                if (moment().isAfter(user.check_email_expires_at)) 
                    return res.status(400).send({
                    message: "Ups! este token esta invalido."
                })
                else {
                    await user.updateOne({
                        $set: {
                            status: 'a',
                            check_email_token: null,
                            check_email_expires_at: null,
                            updated_at: moment()
                        }
                    })
                    await redis.del(`conta:${user.check_email_token}`);

                    res.status(200).send({
                        message: "Parabens! o teu e-mail foi verificado com sucesso."
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