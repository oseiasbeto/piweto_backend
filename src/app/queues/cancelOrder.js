// Importa o modelo Order, que representa os pedidos no banco de dados
const Order = require("../model/Order");

// Importa o modelo Ticket, que representa os ingressos no banco de dados
const Ticket = require("../model/Ticket");

// Importa o modelo Event, que representa os eventos no banco de dados
const Event = require("../model/Event");

// Importa o modelo Batch, que representa os lotes de ingressos no banco de dados
const Batch = require("../model/Batch");

// Importa a função de envio de e-mails
const sendMail = require("../mail/sendMail");

// Importa a função para fechar pagamentos do serviço PayPay
const { closePayment } = require("../services/paypay");

module.exports = {
    // Define uma função assíncrona para cancelar um pedido com base no ID do pedido
    async cancelOrder(order_id) {
        try {
            // Busca o pedido no banco de dados pelo ID fornecido
            const order = await Order.findOne({
                id: order_id
            });

            // Se o pedido for encontrado
            if (order) {
                // Busca o evento associado ao pedido
                const event = await Event.findOne({
                    _id: order.event
                });

                // Atualiza o status do pedido para "c" (cancelado)
                await order.updateOne({
                    $set: {
                        status: "c"
                    }
                });

                // Calcula o novo valor de pedidos pendentes em dinheiro, garantindo que não seja negativo
                const newOrdersPendingCash = Math.max(0, Number(event.orders_pending_cash) - Number(order.amount_after_rate));

                // Atualiza os dados do evento, reduzindo o número de pedidos pendentes e aumentando a quantidade de ingressos disponíveis
                await event.updateOne({
                    $inc: {
                        orders_pending_count: -1, // Diminui a contagem de pedidos pendentes
                        tickets_available_count: Number(order.total_tickets_selected) // Aumenta a quantidade de ingressos disponíveis
                    },
                    $set: { orders_pending_cash: newOrdersPendingCash } // Atualiza o valor total pendente garantindo que não fique negativo
                });

                // Atualiza todos os ingressos vinculados ao pedido para o status 'd' (desativado/cancelado)
                await Ticket.updateMany({
                    order: order._id
                }, {
                    $set: {
                        status: 'd'
                    }
                });

                // Itera sobre os lotes do pedido para devolver as quantidades ao estoque
                order.batches.map(async (b) => {
                    for (let i = 0; i < b.quantitySelected; i++) {
                        await Batch.updateOne({
                            _id: b._id
                        }, {
                            $inc: {
                                quantity: b.quantitySelected // Reabastece a quantidade de ingressos no lote correspondente
                            }
                        });
                    }
                });

                // Se o pedido possuir um e-mail de contato, envia um e-mail informando sobre o cancelamento
                if (order?.data?.email) {
                    sendMail(order.data.email, 'payment-close', 
                        `Não foi possível efetuar a sua compra para o evento ${event.name} - Pedido: ${order.id}`, 
                        {
                            eventName: event.name,
                            userFullName: order.data.full_name,
                            newReservationLink: `https://piweto.it.ao/evento/${event.slug}`,
                            cancelReason: 'O cancelamento da sua reserva pode ter ocorrido por dois motivos. Não recebemos a confirmação do pagamento ou ele foi realizado após o período de expiração.'
                        }
                    );
                }

                // Chama a função para fechar o pagamento vinculado ao pedido
                closePayment(order.id, `${Date.now()}`);

                // Exibe uma mensagem no console indicando que a reserva foi cancelada com sucesso
                console.log(`A reserva do pedido: ${order.id} foi cancelada com sucesso!`);
            }
        } catch (err) {
            // Em caso de erro, exibe a mensagem de erro no console
            console.log(err.message);
        }
    }
};
