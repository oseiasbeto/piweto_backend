// Importa o modelo Payout para interagir com a coleção de saques no banco de dados
const Payout = require("../../../model/Payout");

// Importa o modelo Event para interagir com a coleção de eventos
const Event = require("../../../model/Event");

// Importa o modelo User para interagir com a coleção de usuários
const User = require("../../../model/User");

// Importa a função executePaymentToBankAccount de um serviço externo (PayPay) para processar pagamentos
const { executePaymentToBankAccount } = require("../../../services/paypay")

// Exporta um objeto com a função requestPayout que será usada como rota/controller
module.exports = {
    // Função assíncrona para lidar com solicitações de saque
    async requestPayout(req, res) {
        try {
            // Extrai event_id e amount do corpo da requisição
            const { event_id, amount } = req.body;
            
            // Obtém o ID do usuário a partir do objeto req.user (provavelmente definido por middleware de autenticação)
            const user_id = req.user.id;

            // Verifica se event_id e amount foram fornecidos
            if (!event_id || !amount) {
                // Retorna erro 400 se faltar algum campo obrigatório
                return res.status(400).send({ message: "Evento e valor são obrigatórios." });
            }

            // Busca o evento no banco de dados verificando se pertence ao usuário
            const event = await Event.findOne({ _id: event_id, created_by: user_id });

            // Se o evento não for encontrado ou não pertencer ao usuário
            if (!event) {
                return res.status(404).send({ message: "Evento não encontrado ou você não tem permissão." });
            }

            // Busca o usuário no banco de dados
            const user = await User.findOne({
                _id: user_id
            })

            // Se o usuário não for encontrado (situação inesperada já que o middleware de autenticação deveria ter verificado)
            if (!user) {
                return res.status(404).send({ message: "Algo deu errado!" });
            }

            // Verifica se o saldo do evento é suficiente para o saque
            if (event.balance < amount) {
                return res.status(400).send({ message: "Saldo insuficiente para saque." });
            }

            // Verifica se já existe um saque pendente para este evento
            const existingPayout = await Payout.findOne({ event: event_id, status: "pending" });

            // Se existir um saque pendente, retorna erro
            if (existingPayout) {
                return res.status(400).send({ message: "Já existe um saque pendente para este evento." });
            }

            // Gera um order_id único usando timestamp e um número aleatório
            const order_id = `${Date.now()}${Math.floor(Math.random() * 10000)}`

            // Executa o pagamento para a conta bancária usando o serviço PayPay
            await executePaymentToBankAccount(amount, {
                iban: event.data_bank.iban,
                bank_name: event.data_bank.bank_name,
                account_holder: event.data_bank.account_holder
            }, order_id).then(async response => {
                // Se a resposta do serviço for bem-sucedida (código S0001)
                if (response.data.code == "S0001") {
                    // Cria um registro de saque no banco de dados
                    const payout = await Payout.create({
                        id: order_id,
                        user: user_id,
                        event: event_id,
                        amount,
                        status: "p", // 'p' provavelmente significa 'pending' (pendente)
                        payment_method: "bank_transfer",
                        bank_details: {
                            iban: event.data_bank.iban,
                            bank_name: event.data_bank.bank_name,
                            account_holder: event.data_bank.account_holder
                        }
                    });

                    // Se o saque foi criado com sucesso, retorna sucesso
                    if (payout) {
                        res.status(201).send({ message: "Solicitação de saque criada com sucesso!", payout });
                    }
                } else {
                    // Se o serviço retornar um erro, retorna mensagem genérica
                    res.status(400).send({
                        message: "Ups! algo deu errado."
                    })
                }
            })
        } catch (err) {
            // Captura qualquer erro não tratado e retorna erro 500
            res.status(500).send({ message: err.message });
        }
    }
}