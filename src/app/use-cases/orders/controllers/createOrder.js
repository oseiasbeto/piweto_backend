const User = require("../../../model/User")
const Event = require("../../../model/Event")
const Order = require("../../../model/Order")
const Ticket = require("../../../model/Ticket")
const Batch = require("../../../model/Batch")
const sendMail = require("../../../mail/sendMail")
const sendMessage = require('../../../services/sendMessage')
const formatAmount = require("../../../utils/formatAmount")
const getTotalTicketsSelected = require("../../../utils/getTotalTicketsSelected")
const { redis } = require('../../../redisClient');
const { executeReferencePayment } = require("../../../services/paypay")
const moment = require('moment')

module.exports = {
    async createOrder(req, res) {
        try {
            const {
                full_name,
                email,
                phone,
                payment_method,
                cart
            } = req.body

            const { event_id } = req.params
            const created_by = req.user.id
            const order_id = `${Date.now()}`
            const code_ticket = `TICKET-${Date.now()}`

            if (!event_id) return res.status(400).send({
                message: "Informe o id do evento"
            })
            else {
                const event = await Event.findOne({
                    _id: event_id,
                    status: "a"
                })

                if (!event) return res.status(400).send({
                    message: "Algo deu errado."
                })
                else if (event.tickets_purchased_count >= event.tickets_available_count) return res.status(400).send({
                    message: "Ups! ja nao e possivel fazer uma reserva neste evento."
                })
                else if (!cart) return res.status(400).send({
                    message: "Informe o carrinho de compras"
                })
                else {
                    let
                        batches = [],
                        amount = cart.amount,
                        amount_after_discount = cart.amount_after_discount,
                        rate_amount = 0,
                        amount_after_rate = 0,
                        total_tickets_selected = 0;

                    const rate = Number(process.env.RATE_SALE || 4); // Garantir que seja um número

                    if (amount > 0) {
                        rate_amount = (amount * rate) / 100; // Melhor forma de calcular a taxa
                        amount_after_rate = amount - rate_amount; // Valor final
                    }

                    if (cart.batches.length) {
                        batches = cart.batches
                        total_tickets_selected = getTotalTicketsSelected(batches)
                    } else return res.status(400).send({
                        message: "Ups! este carrinho esta vazio, adicone lotes nele para prosseguir"
                    })

                    // Buscar o último número de reserva para este evento
                    const lastOrder = await Order.findOne({ event: event._id, status: "a" }).sort({ reservation_number: -1 });

                    // Definir o próximo número de reserva
                    const reservation_number = lastOrder ? lastOrder.reservation_number + 1 : 1;

                    batches.forEach(async b => {
                        const batch = await Batch.findOne({
                            _id: b._id
                        })

                        if (!batch) return res.status(400).send({
                            message: `Ups! nao achamos nenhum lote com este nome ${b.name}.`
                        })
                        else if (batch.quantity < b.quantitySelected) return res.status(400).send({
                            message: `A quantidade selcionada e maior que a quantidade disponivel de ingressos no lote ${b.name}`
                        })
                    })

                    const user = await User.findOne({
                        _id: created_by
                    })

                    if (!user) return res.status(400).send({
                        message: "Algo deu errado, faz o login e tente novamente!"
                    })

                    if (cart.amount == 0) {
                        const newOrder = await Order.create({
                            id: order_id,
                            batches: batches,
                            rate: amount > 0 ? rate : 0,
                            event: event._id,
                            expires_at: moment().add(2, 'hours'),
                            coupon: cart.coupon,
                            status: 'p',
                            amount,
                            reservation_number,
                            total_tickets_selected,
                            amount_after_discount,
                            amount_after_rate,
                            biz_content: null,
                            data: {
                                full_name,
                                email,
                                phone,
                                payment_method
                            }
                        })

                        if (newOrder) {
                            batches.map(async (b) => {
                                for (let i = 0; i < b.quantitySelected; i++) {
                                    await Ticket.create({
                                        id: Date.now(),
                                        name: b.name,
                                        type: b.type,
                                        booking_number: newOrder.reservation_number,
                                        order: newOrder._id,
                                        batch: b._id,
                                        price: b.price,
                                        status: "a",
                                        tags: [
                                            user.full_name,
                                            event.name,
                                            user.email,
                                            code_ticket,
                                            newOrder.id,
                                        ],
                                        code: code_ticket,
                                        costumer: user._id,
                                        description: b.description,
                                        event: event._id,
                                    })

                                    await Batch.updateOne({
                                        _id: b._id
                                    }, {
                                        $inc: {
                                            quantity: - b.quantitySelected
                                        }
                                    })
                                }
                            })

                            await event.updateOne({
                                $inc: {
                                    tickets_available_count: - Number(total_tickets_selected),
                                    orders_pending_cash: Number(amount_after_rate)
                                }
                            })

                            res.status(200).send({
                                message: "Boa! os teus ingressos gratuitos ja estao disponiveis para o uso."
                            })
                        }
                    } else {
                        switch (payment_method) {
                            case "reference":

                                const data = {
                                    price: amount,
                                    subject: `Adquira ingressos para o evento: ${event.name}`,
                                    order_id,
                                    timeout_express: '30m'
                                }

                                await executeReferencePayment(data).then(async (response) => {
                                    if (response.data.code == "S0001") {

                                        const newOrder = await Order.create({
                                            id: order_id,
                                            batches: batches,
                                            rate: amount > 0 ? rate : 0,
                                            event: event._id,
                                            reservation_number,
                                            expires_at: moment().add(30, 'minutes'),
                                            coupon: cart.coupon,
                                            status: 'p',
                                            amount,
                                            total_tickets_selected,
                                            amount_after_discount,
                                            amount_after_rate,
                                            biz_content: response.data ? response.data.biz_content : null,
                                            data: {
                                                full_name,
                                                email,
                                                phone,
                                                payment_method
                                            }
                                        })

                                        if (newOrder) {

                                            batches.map(async (b) => {


                                                for (let i = 0; i < b.quantitySelected; i++) {
                                                    await Ticket.create({
                                                        id: Date.now(),
                                                        name: b.name,
                                                        booking_number: newOrder.reservation_number,
                                                        type: b.type,
                                                        order: newOrder._id,
                                                        batch: b._id,
                                                        price: b.price,
                                                        code: code_ticket,
                                                        tags: [
                                                            user.full_name,
                                                            event.name,
                                                            user.email,
                                                            code_ticket,
                                                            newOrder.id,
                                                        ],
                                                        costumer: user._id,
                                                        description: b.description,
                                                        event: event._id,
                                                    })

                                                    await Batch.updateOne({
                                                        _id: b._id
                                                    }, {
                                                        $inc: {
                                                            quantity: - b.quantitySelected
                                                        }
                                                    })

                                                }
                                            })

                                            const EXPIRATION_TIME = 100 //3600;
                                            await redis.set(`pedido:${order_id}`, 'pending', { EX: EXPIRATION_TIME });

                                            sendMail(user.email, 'payment-ref', `Reserva iniciada para o evento ${event.name}`, {
                                                id: newOrder.id,
                                                eventName: event.name,
                                                userFullName: user.full_name,
                                                reservationNumber: newOrder.reservation_number,
                                                ticketQuantity: total_tickets_selected,
                                                amount: formatAmount(newOrder.amount),
                                                reference: newOrder.biz_content.reference_id,
                                                entity: newOrder.biz_content.entity_id,
                                                validity: moment.utc(newOrder.expires_at).add(1, 'hour').format("YYYY/MM/DD HH:mm")
                                            })
                                            
                                            /* 
                                            sendMessage(newOrder.data.phone, `Adquira os teus ingressos pela Entidate: ${newOrder.biz_content.entity_id} Referencia: ${newOrder.biz_content.reference_id} Montante: ${formatAmount(newOrder.amount)}`)
                                            */

                                            await event.updateOne({
                                                $inc: {
                                                    tickets_available_count: -Number(total_tickets_selected),
                                                    orders_pending_cash: Number(newOrder.amount_after_rate) 
                                                }
                                            })
                                            res.status(200).send({
                                                newOrder,
                                                message: "Boa! a sua reserva foi criada com sucesso."
                                            })
                                        }
                                    } else {
                                        res.status(400).send({
                                            message: "Ups! algo deu errado."
                                        })
                                    }
                                })
                                break;
                        }
                    }
                }
            }
        } catch (err) {

            // caso haja um erro interno retorne status 500.
            res.status(500).send({
                message: err.message
            })
        }
    }
}
