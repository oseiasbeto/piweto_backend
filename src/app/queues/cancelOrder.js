const Order = require("../model/Order")
const Ticket = require("../model/Ticket")
const Event = require("../model/Event")
const Batch = require("../model/Batch")
const sendMail = require("../mail/sendMail")
const { closePayment } = require("../services/paypay")

module.exports = {
    async cancelOrder(order_id) {
        try {
            console.log(order_id)
            const order = await Order.findOne({
                id: order_id
            })
            if (order) {
                const event = await Event.findOne({
                    _id: order.event
                })

                await order.updateOne({
                    $set: {
                        status: "c"
                    }
                })

                // Garante que não fique negativo
                const newOrdersPendingCash = Math.max(0, Number(event.orders_pending_cash) - Number(order.amount_after_rate));

                await event.updateOne({
                    $inc: {
                        orders_pending_count: -1,
                        tickets_available_count: Number(order.total_tickets_selected)
                    },
                    $set: { orders_pending_cash: newOrdersPendingCash } // Ajusta para garantir que não fique negativo
                });

                await Ticket.updateMany({
                    order: order._id
                }, {
                    $set: {
                        status: 'd'
                    }
                })

                order.batches.map(async (b) => {
                    for (let i = 0; i < b.quantitySelected; i++) {
                        await Batch.updateOne({
                            _id: b._id
                        }, {
                            $inc: {
                                quantity: b.quantitySelected
                            }
                        })
                    }
                })

                sendMail(order.data.email, 'payment-close', `Não foi possível efetuar a sua compra para o evento ${event.name} - Pedido: ${order.id}`, {
                    eventName: event.name,
                    userFullName: order.data.full_name,
                    newReservationLink: `https://piweto.it.ao/evento/${event.slug}`,
                    cancelReason: 'O cancelamento da sua reserva pode ter ocorrido por dois motivos. Não recebemos a confirmação do pagamento ou ele foi realizado após o período de expiração.'
                })

                closePayment(order.id, `${Date.now()}`)

                console.log(`A reserva do pedido: ${order.id} foi cancelada com sucesso!`)
            }
        } catch (err) {
            console.log(err.message)
        }
    }
}