const User = require("../../../model/User")
const Event = require("../../../model/Event")
const Staff = require("../../../model/Staff")
const Batch = require("../../../model/Batch")
const generateSlugName = require("../../../utils/generateSlugName")

const cloudinary = require("../../../config/cloudinary");
const streamifier = require("streamifier");

const { randomUUID } = require('crypto')
const moment = require('moment')

module.exports = {
    async createEvent(req, res) {
        try {
            const {
                name,
                type,
                description,
                batches,
                address,
                status,
                category,
                visibility,
                show_on_map,
                starts_at,
                ends_at
            } = req.body

            const created_by = req.user.id

            if (!name || name == "") {
                res.status(400).send({
                    message: "O nome do evento e obrigatorio."
                })
            } else if (!batches || batches.length == 0) {
                res.status(400).send({
                    message: "Informe os lotes deste eventos."
                })
            } else if (!category || category == "") {
                res.status(400).send({
                    message: "Informe a categoria deste evento."
                })
            } else if (!created_by || created_by == "") {
                res.status(400).send({
                    message: "Algo deu errado."
                })
            } else if (!description || description == "") {
                res.status(400).send({
                    message: "A descricao e obrigatoria."
                })
            } else if (!type || type == "") {
                res.status(400).send({
                    message: "O tipo do evento e obrigatorio."
                })
            } else if (!visibility || visibility == "") {
                res.status(400).send({
                    message: "A visisbilidade do evento e obrigatoria."
                })
            } else if (!starts_at) {
                res.status(400).send({
                    message: "A data de inicio e obrigatorio."
                })
            } else if (!ends_at) {
                res.status(400).send({
                    message: "A data de termino e obrigatorio."
                })
            } else if (moment(ends_at.date).isBefore(moment(starts_at.date))) {
                res.status(400).send({
                    message: "A data de termino nao pode ser antes que a data de inicio."
                })
            } else {
                let cover = { url: null, key: null };

                const user = await User.findOne({
                    _id: created_by
                })

                if (!user) return res.status(400).send({
                    message: "Ups! nao foi possivel achar o corrente usuario, faz o login e tente novamente!"
                })
                else {
                    let tickets_available_count;

                    if (batches !== undefined && batches.length) {
                        tickets_available_count = batches.reduce((acc, batch) => {
                            return acc + Number(batch.quantity); // Converte para número
                        }, 0);
                    } else {
                        tickets_available_count = 0;
                    }

                    // Upload de mídias, se houver
                    if (req.file) {
                        const { buffer } = req.file;

                        // Verifica se o arquivo realmente contém um buffer válido
                        if (!buffer) {
                            return res.status(400).json({ error: "Nenhuma imagem válida foi enviada." });
                        }

                        // Criar uma Promise para enviar o buffer para o Cloudinary
                        const uploadedImage = await new Promise((resolve, reject) => {
                            const uploadStream = cloudinary.uploader.upload_stream(
                                {
                                    folder: "uploads",
                                    resource_type: "image", // Defina "video" para vídeos
                                    transformation: [
                                        { quality: "auto:good", fetch_format: "auto" } // Qualidade automática
                                    ]
                                },
                                (error, result) => {
                                    if (error) return reject(error);
                                    resolve(result);
                                }
                            );

                            streamifier.createReadStream(buffer).pipe(uploadStream);
                        });

                        cover = {
                            original: uploadedImage.secure_url, // Link original
                            low: cloudinary.url(uploadedImage.public_id, { quality: "auto:low", fetch_format: "auto" }),
                            medium: cloudinary.url(uploadedImage.public_id, { quality: "auto:good", fetch_format: "auto" }),
                            high: cloudinary.url(uploadedImage.public_id, { quality: "auto:best", fetch_format: "auto" }),
                            key: uploadedImage.public_id
                        }
                    }
                    
                    const slug = `${generateSlugName(name)}_${Math.floor(Math.random() * 10000)}`

                    const event = await Event.create({
                        id: randomUUID(),
                        name: name,
                        type: type,
                        description: description,
                        slug,
                        show_on_map,
                        address: address,
                        status: status,
                        category: category,
                        cover,
                        visibility: visibility,
                        tags: [
                            name,
                            category,
                            user.full_name,
                            slug,
                            category,
                            address.location ?? 'Angola'
                        ],
                        tickets_available_count,
                        created_by: user._id,
                        starts_at: starts_at,
                        ends_at: ends_at
                    })

                    if (event) {
                        const new_staff = await Staff.create({
                            event: event._id,
                            role: "manager",
                            member: user._id,
                            'invite.status': "a",
                            tags: [
                                user?.full_name,
                                user?.email,
                                event?.name,
                                event?.slug,
                                event?.category,
                                event?.address.location ?? 'Angola'
                            ],
                            is_admin: true
                        })

                        if (new_staff) {
                            batches.forEach(async b => {
                                await Batch.create({
                                    event: event._id,
                                    nomenclature: b.nomenclature ?? 'ticket',
                                    available_tickets: b.available_tickets,
                                    visibility: b.visibility,
                                    tickets_period_sales: b.tickets_period_sales,
                                    name: String(b.name || ""),
                                    type: String(b.type || ""),
                                    description: String(b.description || ""),
                                    visibility: String(b.visibility || "public"),
                                    quantity: Number(b.quantity) || 0,
                                    price: Number(b.price) || 0,
                                    starts_at: {
                                        date: b["starts_at.date"] ? new Date(b["starts_at.date"]) : null,
                                    },
                                    ends_at: {
                                        date: b["ends_at.date"] ? new Date(b["ends_at.date"]) : null,
                                    },
                                    quantity_for_purchase: {
                                        min: Number(b["quantity_for_purchase.min"]) || 1,
                                        max: Number(b["quantity_for_purchase.max"]) || 1
                                    }
                                })
                            });
                            res.status(201).send({
                                event,
                                message: "Parabens! o teu evento foi registrado com sucesso."
                            })
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
