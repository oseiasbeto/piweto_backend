const Payout = require("../../../model/Payout");
const sendMail = require("../../../mail/sendMail"); // Função para envio de e-mail
const formatAmount = require("../../../utils/formatAmount")

module.exports = {
    async updatePayoutStatus(req, res) {
        try {
            const { status } = req.body;
            const { payout_id } = req.params;

            if (!payout_id || !status) {
                return res.status(400).send({ message: "Payout ID e status são obrigatórios." });
            }

            if (!["completed", "failed"].includes(status)) {
                return res.status(400).send({ message: "Status inválido." });
            }

            const payout = await Payout.findById(payout_id).populate("user_id");

            if (!payout) {
                return res.status(404).send({ message: "Payout não encontrado." });
            }

            payout.status = status;
            payout.payout_at = status === "completed" ? new Date() : null;
            await payout.save();

            // Enviar e-mail para o organizador
            const emailSubject = status === "completed"
                ? "Seu pagamento foi realizado!"
                : "Problema com sua solicitação de saque";

            const emailTemplate = status === "completed"
                ? "payout_success"
                : "payout_failed";

            await sendMail(payout.user_id.email, emailTemplate, emailSubject, {
                user_name: payout.user_id.full_name,
                amount: formatAmount(payout.amount),
                status
            });

            res.status(200).send({ message: `Payout ${status} com sucesso!` });

        } catch (err) {
            res.status(500).send({ message: err.message });
        }
    }
}