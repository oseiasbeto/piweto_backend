const User = require("../../../model/User")
const userTransformer = require("../../../utils/userTransformer")
const bcrypt = require("bcryptjs")
const { redis } = require('../../../redisClient');
const sendMessage = require('../../../services/sendMessage')
const moment = require('moment')

module.exports = {
    async registerUser(req, res) {
        try {
            const {
                first_name,
                last_name,
                email,
                phone,
                password
            } = req.body

            if (first_name == '' || first_name == undefined) {
                res.status(400).send({
                    message: "O primeiro nome e obrigatorio."
                })
            }
            else if (last_name == '' || last_name == undefined) {
                res.status(400).send({
                    message: "O ultimo nome e obrigatorio."
                })
            }
            else if (phone == '' || phone == undefined) {
                res.status(400).send({
                    message: "O numero de telefone e obrigatorio"
                })
            }
            else if (password == '' || password == undefined) {
                res.status(400).send({
                    message: "A palavra-passe e obrigatorio"
                })
            } else if (password.length < 8) return res.status(400).send({
                message: "A tua palavra-passe deve ter pelo menos 8 caracteres."
            })
            else {
                // tente buscar um usuario activo com o email ou o telefone inforamdo no corpo da requesicao.
                const user = await User.findOne({
                    phone: phone.replace(/\s/g, ''),
                    status: "a"
                })

                // caso haja um usuario activo com o email ou com numeto de telefone inforamdo na requesicao, entao retore um erro com status code 400. 
                if (user) {
                    res.status(400).send({
                        message: "ups! ja existe um usuario com este numero de telefone."
                    })
                } else {
                    const full_name = `${first_name.replace(/\s/g, '')} ${last_name.replace(/\s/g, '')}`

                    const password_hash = await bcrypt.hash(password, 10)
                    function generateOTP() {
                        return Math.floor(1000 + Math.random() * 9000).toString();
                    }

                    const otp = generateOTP();

                    const newUser = await User.create({
                        first_name: first_name.replace(/\s/g, ''),
                        last_name: last_name.replace(/\s/g, ''),
                        full_name,
                        email,
                        phone: phone.replace(/\s/g, ''),
                        check_otp_code: otp,
                        check_otp_expires_at: moment().add('2', 'hours'),
                        password: password_hash
                    })

                    // caso nao tenha ocorrido nenhum erro no processo entre neste escopo.
                    if (newUser) {

                        sendMessage(newUser.phone, `${otp} este e o seu codigo de confirmacao.`)

                        const EXPIRATION_TIME = 3600 * 24; // 24 hora (em segundos)

                        await redis.set(`conta:${newUser.check_otp_code}`, 'pending', { EX: EXPIRATION_TIME });

                        res.status(201).send({
                            user: userTransformer(newUser),
                            message: "Parabens! a tua conta foi registrada com sucesso."
                        })
                    }
                }
            }
        } catch (err) {

            // caso haja um erro interno retorne status 500.
            res.status(500).send({
                message: err.message
            })
        }
    }
}
