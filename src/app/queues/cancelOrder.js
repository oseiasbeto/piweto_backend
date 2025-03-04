const Order = require("../model/Order")
const Ticket = require("../model/Ticket")
const Event = require("../model/Event")
const sendMail = require("../mail/sendMail")
const {closePayment} = require("../services/paypay")

module.exports = {
    async cancelOrder(order_id) {
        try {
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
                await event.updateOne({
                    $inc: {
                        sales_count: - 1,
                        orders_pending_cash: - order.amount_after_rate
                    }
                })
                await Ticket.updateMany({
                    order: order._id
                }, {
                    $set: {
                        status: 'd'
                    }
                })

                sendMail(order.data.email, 'payment-close', `Não foi possível efetuar a sua compra para o evento ${event.name} - Pedido: ${order.id}`, {
                    eventName: event.name,
                    userFullName: order.data.full_name,
                    newReservationLink: `https://piweto.it.ao/evento/${event.slug}`,
                    cancelReason: 'O cancelamento da sua reserva pode ter ocorrido por dois motivos. Não recebemos a confirmação do pagamento ou ele foi realizado após o período de expiração.'
                })

                closePayment(order.id, `${Date.now()}`)

                console.log(`✅ A reserva do pedido: ${order.id} foi cancelada com sucesso!`)
            }
        } catch (err) {
            console.log(err.message)
        }
    }
}