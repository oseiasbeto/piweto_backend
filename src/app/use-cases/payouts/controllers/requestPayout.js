const Payout = require("../../../model/Payout");
const Event = require("../../../model/Event");
const User = require("../../../model/User");

module.exports = {
    async requestPayout(req, res) {
        try {
            const { event_id, amount } = req.body;
            const user_id = req.user.id;

            if (!event_id || !amount) {
                return res.status(400).send({ message: "Evento e valor são obrigatórios." });
            }

            const event = await Event.findOne({ _id: event_id, created_by: user_id });

            if (!event) {
                return res.status(404).send({ message: "Evento não encontrado ou você não tem permissão." });
            }

            const user = await User.findOne({
                _id: user_id
            })

            if (!user) {
                return res.status(404).send({ message: "Algo deu errado!" });
            }

            if (event.balance < amount) {
                return res.status(400).send({ message: "Saldo insuficiente para saque." });
            }

            // Verifica se já existe um payout pendente para este evento
            const existingPayout = await Payout.findOne({ event: event_id, status: "pending" });

            if (existingPayout) {
                return res.status(400).send({ message: "Já existe um saque pendente para este evento." });
            }

            const order_id = `${Date.now()}${Math.floor(Math.random() * 10000)}`

            const payout = await Payout.create({
                id: order_id,
                user: user_id,
                event: event_id,
                amount,
                status: "pending",
                payment_method: "bank_transfer",
                bank_details: {
                    iban: event.data_bank.iban,
                    bank_name: event.data_bank.bank_name,
                    account_holder: event.data_bank.account_holder
                }
            });

            res.status(201).send({ message: "Solicitação de saque criada com sucesso!", payout });

        } catch (err) {
            res.status(500).send({ message: err.message });
        }
    }
}