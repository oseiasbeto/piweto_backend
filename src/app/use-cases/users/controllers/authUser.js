const User = require("../../../model/User")
const generateAccessToken = require("../../../utils/generateAccessToken")
const generateRefreshToken = require("../../../utils/generateRefreshToken")
const encryptRefreshToken = require("../../../utils/encryptRefreshToken")
const userTransformer = require("../../../utils/userTransformer")
const { compare } = require("bcryptjs")
const Session = require("../../../model/Session")

module.exports = {
    async authUser(req, res) {
        try {
            const { email, password } = req.body

            if (email == '' || email == undefined) {
                res.status(400).send({
                    message: "O email e obrigatorio."
                })
            }
            else if (password == '' || password == undefined) {
                res.status(400).send({
                    message: "A palavra-passe e obrigatorio"
                })
            } else {
                const user = await User.findOne({
                    email
                })

                if (user && await compare(password, user.password)) {
                    if (user.status == 'p') return res.status(400).send({
                        message: "Ups! nao existe nenhum usuario activo com este e-mail"
                    })
                    else {
                        const expires_access_token_in = "30m"
                        const expires_refresh_token_in = "7d"

                        const access_token = generateAccessToken(user, expires_access_token_in)
                        const refresh_token = generateRefreshToken(user, expires_refresh_token_in)

                        const _encrypted_refresh_token = encryptRefreshToken(refresh_token)

                        const newSession = new Session({
                            userAgent: req.headers.userAgent,
                            crypto: {
                                key: _encrypted_refresh_token.key,
                                iv: _encrypted_refresh_token.iv
                            },
                            token: _encrypted_refresh_token.encrypted_refresh_token,
                            user: user._id
                        })

                        if (newSession) {
                            await newSession.save()

                            res.status(200).send({
                                access_token: access_token,
                                session_id: newSession.id,
                                user: userTransformer(user),
                                message: "Usuario autenticado com sucesso."
                            })
                        }
                    }
                } else {
                    res.status(400).send({
                        message: "Ups! credenciais invalidas."
                    })
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
