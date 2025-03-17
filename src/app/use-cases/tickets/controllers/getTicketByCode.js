const Ticket = require("../../../model/Ticket")

module.exports = {
    async getTicketByCode(req, res) {
        try {
            const { code } = req.params

            if (!code) return res.status(400).send({
                message: "Informe o codigo do ingresso."
            })

            const ticket = await Ticket.findOne({
                code,
                status: "a"
            })
            
            if(!ticket) return res.status(404).send({
                message: "Ups! nao achamos nenhum ingresso activo com este codigo."
            })
            else {
                res.status(200).send({
                    ticket,
                    message: "Ingresso encontrado com sucesso."
                })
            }
        } catch (err) {
            res.status(500).send({
                mensagem: err.message // erro interno
            })
        }
    }
}