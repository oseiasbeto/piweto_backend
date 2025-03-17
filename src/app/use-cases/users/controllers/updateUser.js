const User = require("../../../model/User")
const moment = require("moment")

module.exports = {
    async updateUser(req, res) {
        try {
            const { id } = req.user
            const {
                first_name,
                last_name,
                bio,
                phone,
                address
            } = req.body

            if (!id) return res.status(400).send({
                message: "Informe o id do usuario."
            })

            const user = await User.findOne({
                _id: id
            })

            if (!user) return res.status(404).send({
                message: "Algo deu errado, faca o login e tente novamente!."
            })
            else {
                await user.updateOne({
                    $set: {
                        first_name: first_name !== '' ? first_name : user.first_name,
                        last_name: last_name !== '' ? last_name : user.last_name,
                        full_name: `${first_name ? first_name.replace(/\s/g, '') : user.first_name} ${last_name ? last_name.replace(/\s/g, '') : user.last_name}`,
                        bio: bio ?? user.bio,
                        phone: phone ?? user.phone,
                        address: address ?? user.address,
                    }
                })

                res.status(200).send({
                    message: "Dados actualizados com sucesso."
                })
            }
        } catch (err) {
            res.status(500).send({
                mensagem: err.message // erro interno
            })
        }
    }
}