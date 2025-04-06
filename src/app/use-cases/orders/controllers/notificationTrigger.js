const Order = require("../../../model/Order") // Importa o modelo Order para manipular dados de pedidos no MongoDB
const Ticket = require("../../../model/Ticket") // Importa o modelo Ticket para manipular dados de ingressos no MongoDB
const { redis } = require('../../../redisClient'); // Importa o cliente Redis para manipulação de cache, usado para melhorar desempenho
const sendMail = require("../../../mail/sendMail") // Importa função reutilizável para enviar e-mails aos usuários
const moment = require("moment") // Importa a biblioteca Moment.js para facilitar manipulação e formatação de datas
const Event = require("../../../model/Event"); // Importa o modelo Event para manipular dados de eventos no MongoDB
const Financial = require("../../../model/Financial");
const Payout = require("../../../model/Payout");

const formatAmount = require("../../../utils/formatAmount"); // Importa função utilitária para formatar valores monetários (ex.: adicionar moeda ou casas decimais)
require('dotenv').config(); // Carrega variáveis do .env

module.exports = { // Exporta o módulo como um objeto contendo a função notificationTrigger
    async notificationTrigger(req, res) { // Define uma função assíncrona que processa notificações de status (ex.: de um gateway de pagamento)
        try { // Inicia um bloco try-catch para capturar e tratar erros durante a execução

            const PLATFORM_FEE = parseFloat(process.env.PLATFORM_FEE_PERCENTAGE);
            const PLATFORM_PROFIT = parseFloat(process.env.PLATFORM_PROFIT_PERCENTAGE);
            const ORGANIZER_PAYOUT = parseFloat(process.env.ORGANIZER_PAYOUT_PERCENTAGE);

            const { status, out_trade_no } = req.body // Desestrutura o corpo da requisição para obter o status da transação e o ID do pedido (out_trade_no)

            if (status == 'TRADE_FINISHED') {
                // Caso o status seja "TRADE_FINISHED", indicando que a transação foi concluída com sucesso

                const order = await Order.findOne({ // Busca um pedido no banco de dados com o ID (out_trade_no) e status pendente ("p")
                    id: out_trade_no,
                    status: "p"
                })
                if (order) { // Verifica se o pedido foi encontrado; se sim, prossegue com o processamento
                    const event = await Event.findOne({ // Busca o evento associado ao pedido pelo ID do evento, populando o campo 'created_by' com dados do organizador
                        _id: order.event
                    }).populate('created_by')

                    await Order.updateOne( // Atualiza um pedido no banco de dados (parece ser um erro ou duplicação no código)
                        { // Condição para encontrar o pedido a ser atualizado
                            event: event._id, // Filtra pelo ID do evento
                            status: "p", // Filtra por status pendente
                            reservation_number: order?.reservation_number // Filtra pelo número de reserva do pedido atual
                        },
                        { // Operação de atualização
                            $inc: { // Incrementa o valor de um campo
                                reservation_number: 1 // Aumenta o número de reserva em 1 (nota: isso pode ser um erro, veja abaixo)
                            }
                        }
                    )
                    // NOTA: Este Order.updateOne parece deslocado ou errado, pois o reservation_number geralmente é único por pedido e não deveria ser incrementado aqui. Pode ser um equívoco ou uma tentativa de atualizar outro pedido, mas não está claro o propósito.

                    await order.updateOne({ // Atualiza o pedido específico encontrado anteriormente
                        $set: { // Define um novo valor para o campo especificado
                            status: "a" // Altera o status do pedido de "pendente" ("p") para "ativo" ("a")
                        }
                    })

                    await event.updateOne({ // Atualiza os dados do evento associado ao pedido
                        $inc: { // Usa $inc para incrementar ou decrementar valores numéricos no documento do evento
                            sales_count: +1, // Incrementa o contador de vendas em 1
                            balance: +order.amount_after_rate, // Adiciona o valor após taxas ao saldo do evento
                            orders_pending_cash: -order.amount_after_rate, // Subtrai o valor pendente, pois o pagamento foi concluído
                            tickets_purchased_count: order.total_tickets_selected // Incrementa o total de ingressos comprados com a quantidade do pedido
                        }
                    })

                    await Ticket.updateMany( // Atualiza todos os ingressos associados ao pedido em uma única operação
                        {
                            order: order._id, // Filtra os ingressos pelo ID do pedido
                        },
                        {
                            $set: { // Define um novo valor para o campo status
                                status: 'a' // Altera o status dos ingressos para "ativo" ("a")
                            }
                        })

                    await redis.del(`pedido:${order.id}`); // Remove a entrada do pedido do cache Redis, pois ele foi concluído e não precisa mais ser rastreado

                    if (order?.data?.email) { // Verifica se o pedido possui um e-mail associado no campo data
                        sendMail(order.data.email, 'payment-confirmed', // Envia um e-mail de confirmação de pagamento ao comprador
                            `Confirmação de Pagamento - Pedido: ${order.id}, Evento: ${event.name}`, // Assunto do e-mail
                            { // Dados enviados para o template do e-mail
                                id: order.id, // ID do pedido
                                eventName: event.name, // Nome do evento
                                userFullName: order.data.full_name, // Nome completo do comprador
                                ticketQuantity: order.total_tickets_selected, // Quantidade de ingressos comprados
                                reservationNumber: order.reservation_number, // Número de reserva do pedido
                                ticketsUrl: process.env.CLIENT_URL + `meus-ingressos`, // URL para o comprador acessar seus ingressos
                                amount: formatAmount(order.amount), // Valor total formatado
                                reference: order.biz_content.reference_id, // Referência do pagamento
                                entity: order.biz_content.entity_id, // Entidade do pagamento (ex.: banco)
                                datePayment: moment().add('1', 'h').format("YYYY/MM/DD HH:mm") // Data e hora do pagamento formatada
                            })
                    }

                    if (event?.created_by?.email) { // Verifica se o organizador do evento possui um e-mail
                        sendMail(event.created_by.email, 'new-sale', // Envia um e-mail ao organizador notificando uma nova venda
                            `Nova venda: ${event.name}`, // Assunto do e-mail
                            { // Dados enviados para o template do e-mail
                                id: order.id, // ID do pedido
                                eventName: event.name, // Nome do evento
                                organizerName: event.created_by.full_name, // Nome do organizador
                                ticketQuantity: order.total_tickets_selected, // Quantidade de ingressos vendidos
                                orderDetailsUrl: process.env.CLIENT_URL + `gerenciador-de-eventos/participantes/` + event.slug, // URL para detalhes do pedido
                                reservationNumber: order.reservation_number, // Número de reserva
                                amount: formatAmount(order.amount), // Valor total da venda
                                amountAfterRate: formatAmount(order.amount_after_rate), // Valor após taxas
                                reference: order.biz_content.reference_id, // Referência do pagamento
                                entity: order.biz_content.entity_id, // Entidade do pagamento
                                validity: moment(order.expires_at).format("YYYY/MM/DD HH:mm") // Data de expiração do pedido
                            })

                        // Cálculo com variáveis de ambiente
                        const organizerAmount = order.amount_after_rate * ORGANIZER_PAYOUT;
                        const platformFee = order.amount_after_rate * PLATFORM_FEE;
                        const platformProfit = order.amount_after_rate * PLATFORM_PROFIT;

                        // Atualiza o Financial
                        await Financial.findOneAndUpdate(
                            {},
                            {
                                $inc: {
                                    total_earnings: platformFee,
                                    pending_amount: organizerAmount,
                                    platform_profit: platformProfit
                                }
                            },
                            { upsert: true }
                        );
                    }
                }
            } else if (status === 'TRANSFER_SUCCESS') {
                // Caso para tratar transferências bem-sucedidas para organizadores

                // Busca o registro de saque no banco de dados usando o ID da transação
                const payout = await Payout.findOne({
                    id: out_trade_no,
                    status: "in_transit"
                }).populate("user").populate("event")

                // Verifica se o saque foi encontrado
                if (payout) {

                    // Atualiza o status do saque para "a" (aprovado)
                    await payout.updateOne({
                        $set: {
                            status: "completed"  // 'a' provavelmente significa "approved" ou "ativo"
                            // [SUGESTÃO: Usar "approved" para melhor legibilidade]
                        }
                    })

                    // Verifica se o saque está associado a um evento específico
                    if (payout.event?._id) {
                        // Atualiza o saldo disponível do evento
                        await Event.updateOne(
                            { _id: payout.event._id },  // Filtra pelo ID do evento
                            {
                                $inc: {
                                    balance: -payout.amount  // Reduz o saldo disponível do evento
                                }
                            }
                        );

                        // Atualiza o registro financeiro geral da plataforma
                        await Financial.findOneAndUpdate(
                            {},  // Filtro vazio - atualiza o primeiro/único documento Financial
                            {
                                $inc: {  // Operador de incremento/decremento atômico
                                    total_paid: payout.amount,       // Aumenta o total já pago aos organizadores
                                    pending_amount: -payout.amount,   // Reduz o valor pendente de pagamento
                                    // platform_profit não é alterado porque o lucro já foi contabilizado na venda inicial
                                }
                            },
                            { upsert: true }  // Cria o documento se não existir
                        );
                    }


                    if (payout?.user?.email) {
                        sendMail(payout.user.email, 'payout_success', `Saque processado - ${formatAmount(payout.amount)}`, // Assunto do e-mail
                            { // Dados enviados para o template do e-mail
                                userFullName: payout.user.full_name,
                                eventName: payout.event?.name || "",
                                amount: formatAmount(payout.amount),
                                bankName: payout.bank_details.bank_name,
                                iban: payout.bank_details.iban,
                                accountHolder: payout.bank_details.account_holder,
                                dateTransfer: moment().add('1', 'h').format("YYYY/MM/DD HH:mm") // Data e hora do pagamento formatada
                            })
                    }
                }
            } else if (status === 'TRANSFER_FAIL') {
                const _payout = await Payout.findOne({
                    id: out_trade_no  // Filtra pelo ID único do saque
                }).populate("user").populate("event")

                if (_payout) {
                    if (_payout.user?.email) {
                        await _payout.updateOne({
                            $set: {
                                status: "failed"  // 'a' provavelmente significa "approved" ou "ativo"
                                // [SUGESTÃO: Usar "approved" para melhor legibilidade]
                            }
                        })
                        sendMail(
                            _payout.user.email,
                            'payout_failed',
                            `Falha no saque de ${formatAmount(_payout.amount)}`,
                            {
                                amount: formatAmount(_payout.amount),
                                eventName: _payout.event?.name || "",
                                failureReason: "Erro no processamento bancário",
                                supportContact: process.env.SUPPORT_EMAIL || "",
                                retryDate: moment().add(1, 'day').format("DD/MM/YYYY")
                            }
                        );
                    }
                }
            }

            return 'success' // Retorna a string 'success' para indicar que a notificação foi processada com sucesso (útil para webhooks)
        } catch (err) { // Captura qualquer erro que ocorra durante o processamento
            res.status(500).send({ // Responde com status 500 (erro interno do servidor)
                mensagem: err.message // Inclui a mensagem de erro para depuração
            })
        }
    }
}