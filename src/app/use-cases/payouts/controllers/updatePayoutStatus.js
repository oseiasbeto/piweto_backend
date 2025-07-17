const Payout = require("../../../model/Payout");
const Event = require("../../../model/Event");
const sendMail = require("../../../mail/sendMail"); // Função para envio de e-mail
const formatAmount = require("../../../utils/formatAmount")

module.exports = {
    async updatePayoutStatus(req, res) {
        try {
            const { status, failureReason } = req.body;
            const { payout_id } = req.params;

            if (!payout_id || !status) {
                return res.status(400).send({ message: "Payout ID e status são obrigatórios." });
            }

            if (!["completed", "failed"].includes(status)) {
                return res.status(400).send({ message: "Status inválido." });
            }

            const payout = await Payout.findById(payout_id).populate("user");

            if (!payout) {
                return res.status(404).send({ message: "Payout não encontrado." });
            }

            payout.status = status;
            payout.payout_at = status === "completed" ? new Date() : null;
            await payout.save();

            if (payout.user.email) {
                // Enviar e-mail para o organizador
                const emailSubject = status === "completed"
                    ? "Seu pagamento foi realizado!"
                    : "Problema com sua solicitação de saque";

                const emailTemplate = status === "completed"
                    ? "payout_success"
                    : "payout_failed";

                await sendMail(payout.user.email, emailTemplate, emailSubject, {
                    user_name: payout.user.full_name,
                    amount: formatAmount(payout.amount),
                    ...(failureReason && {
                        failureReason
                    }),
                    status
                });
            }

            await Event.findOneAndUpdate(
                { _id: payout.event, balance: { $gte: payout.amount } }, // Verifica se o saldo é suficiente
                { $inc: { balance: -payout.amount } },
                { new: true } // Retorna o documento atualizado
            );
            
            res.status(200).send({ message: `Payout ${status} com sucesso!` });

        } catch (err) {
            res.status(500).send({ message: err.message });
        }
    }
}