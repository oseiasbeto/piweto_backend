const Order = require("../../../model/Order")
const Ticket = require("../../../model/Ticket")
const { redis } = require('../../../redisClient');
const sendMail = require("../../../mail/sendMail")
const moment = require("moment")
const Event = require("../../../model/Event");
const formatAmount = require("../../../utils/formatAmount");

module.exports = {
    async notificationTrigger(req, res) {
        try {
            const { status, out_trade_no } = req.body
            switch (status) {
                case "TRADE_SUCCESS":
                    const order = await Order.findOne({
                        id: out_trade_no
                    })
                    if (order) {
                        const event = await Event.findOne({
                            _id: order.event
                        }).populate('created_by')

                        await order.updateOne({
                            $set: {
                                status: "a"
                            }
                        })
                        await event.updateOne({
                            $inc: {
                                sales_count: + 1,
                                balance: + order.amount_after_rate,
                                orders_pending_cash: - order.amount_after_rate
                            }
                        })
                        await Ticket.updateMany({
                            $set: {
                                status: 'a'
                            }
                        })

                        await redis.del(`pedido:${order.id}`);

                        sendMail(order.data.email, 'payment-confirmed', `Confirmação de Pagamento - Pedido: ${order.id}, Evento: ${event.name}`, {
                            id: order.id,
                            eventName: event.name,
                            userFullName: order.data.full_name,
                            ticketQuantity: order.total_tickets_selected,
                            reservationNumber: order.reservation_number,
                            ticketsUrl: process.env.CLIENT_URL + `meus-ingressos`,
                            amount: formatAmount(order.amount),
                            reference: order.biz_content.reference_id,
                            entity: order.biz_content.entity_id,
                            validity: moment(order.expires_at).format("YYYY/MM/DD HH:mm")
                        })

                        sendMail(order.data.email, 'new-sale', `Nova venda: ${event.name}`, {
                            id: order.id,
                            eventName: event.name,
                            organizerName: event.created_by.full_name,
                            ticketQuantity: order.total_tickets_selected,
                            orderDetailsUrl: process.env.CLIENT_URL+`gerenciador-de-eventos/participantes/`+event.slug,
                            reservationNumber: order.reservation_number,
                            amount: formatAmount(order.amount),
                            amountAfterRate: formatAmount(order.amount_after_rate),
                            reference: order.biz_content.reference_id,
                            entity: order.biz_content.entity_id,
                            validity: moment(order.expires_at).format("YYYY/MM/DD HH:mm")
                        })
                        return 'success'
                    }
                    break;
            }
        } catch (err) {
            res.status(500).send({
                mensagem: err.message // erro interno
            })
        }
    }
}