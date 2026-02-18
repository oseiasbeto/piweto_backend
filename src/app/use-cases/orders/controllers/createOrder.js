const Event = require("../../../model/Event"); // Importa o modelo Event para manipular dados de eventos
const Order = require("../../../model/Order"); // Importa o modelo Order para manipular dados de pedidos
const Ticket = require("../../../model/Ticket"); // Importa o modelo Ticket para manipular dados de ingressos
const Batch = require("../../../model/Batch"); // Importa o modelo Batch para manipular dados de lotes de ingressos
const sendMail = require("../../../mail/sendMail"); // Importa função para enviar e-mails
//const sendMessage = require("../../../services/sendMessage"); // Importa função para enviar mensagens (ex.: SMS)
const formatAmount = require("../../../utils/formatAmount"); // Importa função utilitária para formatar valores monetários
const getTotalTicketsSelected = require("../../../utils/getTotalTicketsSelected"); // Importa função para calcular total de ingressos selecionados

const generateTicketCode = require("../../../utils/generateTicketCode")
const generateReservationPIN = require("../../../utils/generateReservationPIN")
const generateId = require("../../../utils/generateId"); // Importa função utilitária para gerar IDs únicos

const { redis } = require("../../../redisClient"); // Importa cliente Redis para caching

const {
  executePayPayPayment,
  executeReferencePayment
} = require("../../../services/paypay"); // Importa função para processar pagamentos por referência

const { executeGPOPayment } = require("../../../services/appypay"); // Importa função para processar pagamentos móveis (Multicaixa)
const moment = require("moment"); // Importa biblioteca Moment.js para manipulação de datas

module.exports = {
  // Exporta o módulo com a função createOrder
  async createOrder(req, res) {
    // Define função assíncrona para criar um pedido
    try {
      // Inicia bloco try-catch para tratamento de erros
      const {
        // Desestrutura dados enviados no corpo da requisição
        full_name,
        email,
        phone,
        payment_method,
        cart,
      } = req.body;

      const { event_id } = req.params; // Obtém o ID do evento dos parâmetros da URL
      const order_id = generateId(); // Gera um ID único para o pedido
      const order_pin = generateReservationPIN()

      if (!event_id)
        return res.status(400).send({
          // Verifica se o event_id foi fornecido
          message: "Informe o id do evento",
        });
      else {
        // Se event_id existe, prossegue
        const event = await Event.findOne({
          // Busca o evento no banco pelo ID e status ativo ("a")
          _id: event_id
        });

        if (!event)
          return res.status(400).send({
            // Se o evento não for encontrado, retorna erro
            message: "Algo deu errado.",
          });
        else if (event.tickets_purchased_count >= event.tickets_available_count)
          return res.status(400).send({
            // Verifica se há ingressos disponíveis
            message: "Ups! ja nao e possivel fazer uma reserva neste evento.",
          });
        else if (!cart)
          return res.status(400).send({
            // Verifica se o carrinho foi enviado
            message: "Informe o carrinho de compras",
          });
        else {
          // Se todas as validações iniciais passaram
          let // Declara variáveis locais
            batches = [],
            amount_after_discount = cart.amount_after_discount,
            amount = cart.amount,
            rate_amount = 0,
            amount_after_rate = 0,
            total_tickets_selected = 0;

          const rate = Number(process.env.RATE_SALE || 5); // Define taxa de venda (padrão 5%) a partir de variável de ambiente

          if (amount > 0) {
            const real_amount =
              cart?.coupon?._id && amount_after_discount > 0
                ? amount_after_discount
                : amount; // Se houver cupom, usa o valor após desconto, caso contrário, usa o valor total
            // Se o valor do pedido for maior que zero
            rate_amount = (real_amount * rate) / 100; // Calcula a taxa aplicada ao valor
            amount_after_rate = real_amount - rate_amount; // Calcula valor final após a taxa
          }

          if (cart.batches.length) {
            // Se o carrinho contém lotes
            batches = cart.batches; // Atribui os lotes do carrinho à variável
            total_tickets_selected = getTotalTicketsSelected(batches); // Calcula total de ingressos selecionados
          } else
            return res.status(400).send({
              // Se o carrinho estiver vazio, retorna erro
              message:
                "Ups! este carrinho esta vazio, adicone lotes nele para prosseguir",
            });

          // Busca o último pedido ativo para o evento para definir o próximo número de reserva
          const lastOrder = await Order.findOne({
            event: event._id,
            status: "a",
          }).sort({ reservation_number: -1 });

          // Define o próximo número de reserva (incrementa o último ou começa em 1)
          const reservation_number = lastOrder
            ? lastOrder.reservation_number + 1
            : 1;

          batches.forEach(async (b) => {
            // Para cada lote no carrinho
            const batch = await Batch.findOne({
              // Busca o lote no banco pelo ID
              _id: b._id,
            });

            if (!batch)
              return res.status(400).send({
                // Se o lote não for encontrado, retorna erro
                message: `Ups! nao achamos nenhum lote com este nome ${b.name}.`,
              });
            else if (batch.quantity < b.quantitySelected)
              return res.status(400).send({
                // Verifica se há ingressos suficientes no lote
                message: `A quantidade selcionada e maior que a quantidade disponivel de ingressos no lote ${b.name}`,
              });
          });

          if (cart.amount == 0) {
            // Se o valor do carrinho for zero (ingressos grátis)
            const newOrder = await Order.create({
              // Cria um novo pedido no banco
              id: order_id,
              pin: order_pin,
              batches: batches,
              rate: amount > 0 ? rate : 0,
              event: event._id,
              expires_at: moment().add(2, "hours"), // Define expiração do pedido em 2 horas
              coupon: cart.coupon,
              status: "p", // Status pendente
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
                payment_method,
              },
            });

            if (newOrder) {
              // Se o pedido foi criado com sucesso
              batches.map(async (b) => {
                // Para cada lote no pedido
                for (let i = 0; i < b.quantitySelected; i++) {
                  // Cria um ingresso para cada unidade selecionada
                  await Ticket.create({
                    id: Date.now(),
                    name: b.name,
                    type: b.type,
                    booking_number: newOrder.reservation_number,
                    order: newOrder._id,
                    batch: b._id,
                    price: b.price,
                    status: "a", // Status ativo
                    tags: [
                      full_name,
                      event.name,
                      email,
                      generateTicketCode(),
                      newOrder.id,
                    ],
                    code: generateTicketCode(),
                    costumer: {
                      full_name,
                      email,
                      phone,
                    },
                    description: b.description,
                    event: event._id,
                  });

                  await Batch.updateOne(
                    {
                      // Atualiza a quantidade disponível no lote
                      _id: b._id,
                    },
                    {
                      $inc: {
                        quantity: -b.quantitySelected,
                      },
                    }
                  );
                }
              });

              await event.updateOne({
                // Atualiza o evento, reduzindo ingressos disponíveis
                $inc: {
                  tickets_available_count: -Number(total_tickets_selected),
                  orders_pending_cash: amount_after_rate,
                },
              });

              res.status(200).send({
                // Retorna sucesso para ingressos grátis
                message:
                  "Boa! os teus ingressos gratuitos ja estao disponiveis para o uso.",
              });
            }
          } else {
            // Se o valor do carrinho for maior que zero (pedido pago)
            switch (
            payment_method // Verifica o método de pagamento
            ) {
              case "reference": // Caso o método seja pagamento por referência
                const data = {
                  // Dados para o processamento do pagamento
                  price: amount,
                  subject: `Adquira ingressos para o evento: ${event.name}`,
                  order_id,
                  timeout_express: "30m",
                };

                await executeReferencePayment(data)
                  .then(async (response) => {
                    // Executa o pagamento
                    if (response.data.code == "S0001") {
                      // Se o pagamento for bem-sucedido

                      const newOrder = await Order.create({
                        // Cria o pedido no banco
                        id: order_id,
                        pin: order_pin,
                        batches: batches,
                        rate: amount > 0 ? rate : 0,
                        event: event._id,
                        reservation_number,
                        expires_at: moment().add(30, "minutes"), // Expira em 30 minutos
                        coupon: cart.coupon,
                        status: "p", // Status pendente
                        amount,
                        total_tickets_selected,
                        amount_after_discount,
                        amount_after_rate,
                        biz_content: response.data
                          ? response.data.biz_content
                          : null, // Dados do pagamento
                        data: {
                          full_name,
                          email,
                          phone,
                          payment_method,
                        },
                      });

                      if (newOrder) {
                        // Se o pedido foi criado

                        batches.map(async (b) => {
                          // Cria ingressos para cada lote
                          for (let i = 0; i < b.quantitySelected; i++) {
                            await Ticket.create({
                              id: Date.now(),
                              name: b.name,
                              booking_number: newOrder.reservation_number,
                              type: b.type,
                              order: newOrder._id,
                              batch: b._id,
                              price: b.price,
                              code: generateTicketCode(),
                              tags: [
                                full_name,
                                event.name,
                                email,
                                generateTicketCode(),
                                newOrder.id,
                              ],
                              costumer: {
                                full_name,
                                email,
                                phone,
                              },
                              description: b.description,
                              event: event._id,
                            });

                            await Batch.updateOne(
                              {
                                // Atualiza quantidade no lote
                                _id: b._id,
                              },
                              {
                                $inc: {
                                  quantity: -b.quantitySelected,
                                },
                              }
                            );
                          }
                        });

                        const EXPIRATION_TIME = 3600; // Define tempo de expiração no Redis (1 hora)
                        await redis.set(`pedido:${order_id}`, "pending", {
                          EX: EXPIRATION_TIME,
                        }); // Armazena status no Redis

                        if (email) {
                          // Se o usuário tiver e-mail, envia notificação
                          sendMail(
                            email,
                            "payment-ref",
                            `Reserva iniciada para o evento ${event.name}`,
                            {
                              id: newOrder.id,
                              eventName: event.name,
                              userFullName: full_name,
                              reservationNumber: newOrder.reservation_number,
                              ticketQuantity: total_tickets_selected,
                              amount: formatAmount(newOrder.amount),
                              reference: newOrder.biz_content.reference_id,
                              entity: newOrder.biz_content.entity_id,
                              validity: moment(newOrder.expires_at)
                                .add("1", "h")
                                .format("YYYY/MM/DD HH:mm"),
                            }
                          );
                        }

                        /* 
                        // Envia mensagem (ex.: SMS) com detalhes do pagamento
                        
                        if (newOrder?.data?.phone.length) {
                          sendMessage(
                            newOrder.data.phone,
                            `Adquira os teus ingressos pela Entidate: ${
                              newOrder.biz_content.entity_id
                            } Referencia: ${
                              newOrder.biz_content.reference_id
                            } Montante: ${formatAmount(newOrder.amount)}`
                          );
                        }
                        */

                        await event.updateOne({
                          // Atualiza o evento
                          $inc: {
                            tickets_available_count: -Number(
                              total_tickets_selected
                            ),
                            orders_pending_cash: newOrder.amount_after_rate
                          },
                        });
                        res.status(200).send({
                          // Retorna sucesso com o pedido criado
                          newOrder,
                          message: "Boa! a sua reserva foi criada com sucesso.",
                        });
                      }
                    } else {
                      // Se o pagamento falhar
                      res.status(400).send({
                        message: "Ups! algo deu errado.",
                      });
                    }
                  })
                  .catch((err) => {
                    console.error('Erro ao solicitar pagamento por referência:', err.response?.data || err.message);
                    res.status(500).send({
                      message: "Erro ao processar o pagamento por referência. Tente novamente mais tarde.",
                    });
                  })
                ;
                break; // Finaliza o caso "reference"
              case "GPO":
                // Caso o método seja pagamento móvel (Multicaixa)
                if (!phone)
                  return res.status(400).send({
                    // Verifica se o telefone foi fornecido
                    message:
                      "Para processar pagamentos móveis, informe o número de telefone.",
                  });

                if (phone.length < 9)
                  return res.status(400).send({
                    // Verifica se o número de telefone é válido
                    message:
                      "Informe um número de telefone válido para processar o pagamento móvel.",
                  });

                try {

                  const response = await executeGPOPayment({
                    orderId: order_id,
                    amount,
                    currency: "AOA",
                    subject: "Piweto - Compra de Ingressos",
                    phoneNumber: phone,
                    customer: {
                      name: full_name,
                      phone: phone,
                      email: email
                    }
                  })

                  const data = response.data.responseStatus;
                  const status = data.status;

                  if (status !== "Success") {
                    res.status(400).send({
                      message: "O seu pagamento foi recusado pelo sistema Multicaixa Express. Se o problema persistir, contacte a equipa de suporte do Multicaixa Express.",
                    });
                  } else {
                    // Se o pagamento for bem-sucedido
                    const newOrder = await Order.create({
                      // Cria o pedido no banco
                      id: order_id,
                      pin: order_pin,
                      batches: batches,
                      rate: amount > 0 ? rate : 0,
                      event: event._id,
                      reservation_number,
                      expires_at: moment().add(15, "minutes"), // Expira em 30 minutos
                      coupon: cart.coupon,
                      status: "p", // Status pendente
                      amount,
                      total_tickets_selected,
                      amount_after_discount,
                      amount_after_rate,
                      biz_content: {
                        charge_id: data?.id || null,
                        status: data?.status || null,
                        source: data?.source || null,
                      }, // Dados do pagamento
                      data: {
                        full_name,
                        email,
                        phone,
                        payment_method,
                      },
                    });

                    if (newOrder) {
                      // Se o pedido foi criado

                      batches.map(async (b) => {
                        // Cria ingressos para cada lote
                        for (let i = 0; i < b.quantitySelected; i++) {
                          await Ticket.create({
                            id: Date.now(),
                            name: b.name,
                            booking_number: newOrder.reservation_number,
                            type: b.type,
                            order: newOrder._id,
                            batch: b._id,
                            price: b.price,
                            code: generateTicketCode(),
                            tags: [
                              full_name,
                              event.name,
                              email,
                              generateTicketCode(),
                              newOrder.id,
                            ],
                            costumer: {
                              full_name,
                              email,
                              phone,
                            },
                            description: b.description,
                            event: event._id,
                          });

                          await Batch.updateOne(
                            {
                              // Atualiza quantidade no lote
                              _id: b._id,
                            },
                            {
                              $inc: {
                                quantity: -b.quantitySelected,
                              },
                            }
                          );
                        }
                      });

                      const EXPIRATION_TIME = 100; // Define tempo de expiração no Redis (100 segundos)
                      await redis.set(`pedido:${order_id}`, "pending", {
                        EX: EXPIRATION_TIME,
                      }); // Armazena status no Redis

                      await event.updateOne({
                        // Atualiza o evento
                        $inc: {
                          tickets_available_count: -Number(
                            total_tickets_selected
                          ),
                          orders_pending_cash: newOrder.amount_after_rate
                        },
                      });
                      res.status(200).send({
                        // Retorna sucesso com o pedido criado
                        newOrder,
                        message: "Boa! a sua reserva foi criada com sucesso.",
                      });
                    }
                  }
                } catch (err) {
                  console.error('Erro ao processar o pagamento móvel:', err.response.data.responseStatus);
                  res.status(500).send({
                    message: "Erro ao processar o pagamento móvel. Tente novamente mais tarde.",
                  });
                }
                break;
              case "paypay":
                const data_paypay = {
                  // Dados para o processamento do pagamento
                  price: amount,
                  subject: `Adquira ingressos para o evento: ${event.name}`,
                  order_id,
                  timeout_express: "15m",
                };

                await executePayPayPayment(data_paypay)
                  .then(
                    async (response) => {
                      // Executa o pagamento
                      if (response.data.code == "S0001") {
                        // Se o pagamento for bem-sucedido

                        const newOrder = await Order.create({
                          // Cria o pedido no banco
                          id: order_id,
                          pin: order_pin,
                          batches: batches,
                          rate: amount > 0 ? rate : 0,
                          event: event._id,
                          reservation_number,
                          expires_at: moment().add(15, "minutes"), // Expira em 30 minutos
                          coupon: cart.coupon,
                          status: "p", // Status pendente
                          amount,
                          total_tickets_selected,
                          amount_after_discount,
                          amount_after_rate,
                          biz_content: response.data
                            ? response.data.biz_content
                            : null, // Dados do pagamento
                          data: {
                            full_name,
                            email,
                            phone,
                            payment_method,
                          },
                        });

                        if (newOrder) {
                          // Se o pedido foi criado

                          batches.map(async (b) => {
                            // Cria ingressos para cada lote
                            for (let i = 0; i < b.quantitySelected; i++) {
                              await Ticket.create({
                                id: Date.now(),
                                name: b.name,
                                booking_number: newOrder.reservation_number,
                                type: b.type,
                                order: newOrder._id,
                                batch: b._id,
                                price: b.price,
                                code: generateTicketCode(),
                                tags: [
                                  full_name,
                                  event.name,
                                  email,
                                  generateTicketCode(),
                                  newOrder.id,
                                ],
                                costumer: {
                                  full_name,
                                  email,
                                  phone,
                                },
                                description: b.description,
                                event: event._id,
                              });

                              await Batch.updateOne(
                                {
                                  // Atualiza quantidade no lote
                                  _id: b._id,
                                },
                                {
                                  $inc: {
                                    quantity: -b.quantitySelected,
                                  },
                                }
                              );
                            }
                          });

                          const EXPIRATION_TIME = 1800; // Define tempo de expiração no Redis (30 minutos)
                          await redis.set(`pedido:${order_id}`, "pending", {
                            EX: EXPIRATION_TIME,
                          }); // Armazena status no Redis

                          await event.updateOne({
                            // Atualiza o evento
                            $inc: {
                              tickets_available_count: -Number(
                                total_tickets_selected
                              ),
                              orders_pending_cash: newOrder.amount_after_rate
                            },
                          });
                          res.status(200).send({
                            // Retorna sucesso com o pedido criado
                            newOrder,
                            message: "Boa! a sua reserva foi criada com sucesso.",
                          });
                        }
                      } else {
                        // Se o pagamento falhar
                        console.error('Pagamento recusado:', response.data);
                        res.status(400).send({
                          message: "Erro ao processar o pagamento via PayPay. Tente novamente.",
                        });
                      }
                    }
                  )
                  .catch((err) => {
                    console.error('Erro ao solicitar pagamento PayPay:', err.response?.data || err.message);
                    res.status(500).send({
                      message: "Erro ao processar o pagamento via PayPay. Tente novamente mais tarde.",
                    });
                  })
                  ;
                break;
            }
          }
        }
      }
    } catch (err) {
      // Captura qualquer erro interno
      res.status(500).send({
        // Retorna erro 500 com a mensagem do erro
        message: err.message,
      });
    }
  },
};
