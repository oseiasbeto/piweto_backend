const User = require("../../../model/User")
const sendMail = require("../../../mail/sendMail")
const generateAccessToken = require("../../../utils/generateAccessToken")
const generateRefreshToken = require("../../../utils/generateRefreshToken")
const decryptRefreshToken = require("../../../utils/decryptRefreshToken")
const decodeTokem = require("../../../utils/decodeTokem")
const encryptRefreshToken = require("../../../utils/encryptRefreshToken")
const userTransformer = require("../../../utils/userTransformer")
const moment = require('moment')
const Session = require("../../../model/Session")

module.exports = {
    async refreshToken(req, res) {
        try {
            const { session_id } = req.body

            if (session_id == '' || session_id == undefined) {
                res.status(400).send({
                    message: "Informe o id da sessao."
                })
            }
            else {
                const session = await Session.findOne({
                    id: session_id,
                    status: 'a'
                })

                if (!session) return res.status(401).send({
                    message: "Ups! nao achamos nenhuma sessao com este id."
                })
                else {
                    const _key = session.crypto.key
                    const iv = session.crypto.iv

                    const encrypted_refresh_token = session.token
                    const secreet_access_token_key = process.env.JWT_ACCESS_TOKEN_SECREET
                    const secreet_refresh_token_key = process.env.JWT_REFRESH_TOKEN_SECREET

                    const decrypt_token = decryptRefreshToken({
                        key: _key,
                        iv,
                        encryptedRefreshToken: encrypted_refresh_token
                    })
                    const decoded_data = decodeTokem(decrypt_token, secreet_refresh_token_key)

                    const user = await User.findOne({
                        _id: decoded_data.id
                    })

                    if (!user) {
                        res.status(400).send({
                            message: "Algo deu errado, faz o login e depois tente novamente."
                        })
                    } else {
                        const expires_access_token_in = "30m"
                        const expires_refresh_token_in = "7d"

                        const access_token = generateAccessToken(user, expires_access_token_in)
                        const refresh_token = generateRefreshToken(user, expires_refresh_token_in)

                        const _encrypted_refresh_token = encryptRefreshToken(refresh_token)

                        await session.updateOne({
                            $set: {
                                userAgent: req.headers.userAgent,
                                crypto: {
                                    key: _encrypted_refresh_token.key,
                                    iv: _encrypted_refresh_token.iv
                                },
                                token: _encrypted_refresh_token.encrypted_refresh_token,
                                updated_at: moment()
                            }
                        })

                        res.status(200).send({
                            access_token: access_token,
                            session_id: session.id,
                            user: userTransformer(user),
                            message: "Token de acesso refrescado com sucesso."
                        })
                    }
                }
            }
        } catch (err) {
            console.log(err.message)
            // caso haja um erro interno retorne status 500.
            res.status(401).send({
                message: err.message
            })
        }
    }
}
