const Event = require("../../../model/Event")
const generateSlugName = require("../../../utils/generateSlugName")
const cloudinary = require("../../../config/cloudinary");
const streamifier = require("streamifier");

module.exports = {
    async updateEvent(req, res) {
        try {
            const {
                _id,
                name,
                description,
                cover,
                address,
                category,
                status,
                visibility,
                show_on_map,
                starts_at,
                ends_at
            } = req.body

            const cover_form = JSON.parse(cover)

            if (!_id) return res.status(400).send({
                message: "Informe o id do evento."
            })

            const event = await Event.findOne({
                _id
            })

            if (!event) return res.status(404).send({
                message: "Ups! nao achamos nenhum evento com este id."
            })
            else {
                let _cover;

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

                    _cover = {
                        original: uploadedImage.secure_url, // Link original
                        low: cloudinary.url(uploadedImage.public_id, { quality: "auto:low", fetch_format: "auto" }),
                        medium: cloudinary.url(uploadedImage.public_id, { quality: "auto:good", fetch_format: "auto" }),
                        high: cloudinary.url(uploadedImage.public_id, { quality: "auto:best", fetch_format: "auto" }),
                        key: uploadedImage.public_id
                    }

                    if (event.cover.key) {
                        await cloudinary.uploader.destroy(event.cover.key)
                    }
                } else {
                    if (!cover_form.low && event.cover.low) {
                        await cloudinary.uploader.destroy(event.cover.key)
                    }
                }


                await event.updateOne({
                    $set: {
                        name: name ?? event.name,
                        address: address ?? event.address,
                        category: category ?? event.category,
                        cover: req.file ? _cover : cover_form,
                        show_on_map: show_on_map ?? event.show_on_map,
                        visibility: visibility ?? event.visibility,
                        slug: name ? `${generateSlugName(name)}_${Math.floor(Math.random() * 10000)}` : event.slug,
                        tags: name ? [...event.tags, name] : event.tags,
                        description: description ?? event.description,
                        starts_at: starts_at ?? event.starts_at,
                        ends_at: ends_at ?? event.ends_at
                    }
                })

                res.status(200).send({
                    message: "Evento editado com sucesso."
                })
            }
        } catch (err) {
            res.status(500).send({
                mensagem: err.message // erro interno
            })
        }
    }
}