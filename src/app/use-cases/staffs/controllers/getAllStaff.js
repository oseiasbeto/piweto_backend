const Staff = require("../../../model/Staff");
const mongoose = require('mongoose');

module.exports = {
    async getAllStaff(req, res) {
        try {
            const { page = 1, limit = 10, sort, q, status, ...otherQuery } = req.query;

            // Construir pipeline de aggregation
            const pipeline = [];

            // Converter campos que são ObjectId
            const formattedQuery = { ...otherQuery };

            if (formattedQuery.event) {
                formattedQuery.event = new mongoose.Types.ObjectId(formattedQuery.event);
            }
            if (formattedQuery.member) {
                formattedQuery.member = new mongoose.Types.ObjectId(formattedQuery.member);
            }
            if (formattedQuery._id) {
                formattedQuery._id = new mongoose.Types.ObjectId(formattedQuery._id);
            }

            // Match inicial baseado nos query params básicos
            let matchStage = { ...formattedQuery };

            if (q) {
                matchStage.tags = { $regex: q, $options: 'i' };
            }

            pipeline.push({ $match: matchStage });

            // Lookup para trazer os dados do evento
            pipeline.push({
                $lookup: {
                    from: 'events', // Nome da coleção de eventos
                    localField: 'event',
                    foreignField: '_id',
                    as: 'eventData'
                }
            });

            // Lookup para trazer os dados do member
            pipeline.push({
                $lookup: {
                    from: 'users', // Nome da coleção de members
                    localField: 'member',
                    foreignField: '_id',
                    as: 'memberData'
                }
            });

            // Unwind dos arrays
            pipeline.push({
                $unwind: {
                    path: '$eventData',
                    preserveNullAndEmptyArrays: true
                }
            });

            pipeline.push({
                $unwind: {
                    path: '$memberData',
                    preserveNullAndEmptyArrays: true
                }
            });

            // Filtro por status do evento se existir
            if (status) {
                pipeline.push({
                    $match: {
                        'eventData.status': status
                    }
                });
            }

            // Ordenação
            const sortOption = {};
            if (sort) {
                const sortFields = sort.split(",");
                sortFields.forEach(field => {
                    const direction = field.startsWith('-') ? -1 : 1;
                    const fieldName = field.replace(/^-/, '');
                    sortOption[fieldName] = direction;
                });
            } else {
                sortOption.created_at = -1;
            }
            pipeline.push({ $sort: sortOption });

            // Contar total de documentos
            const countPipeline = [...pipeline];
            countPipeline.push({ $count: 'total' });

            // Aplicar paginação
            const skip = (parseInt(page) - 1) * parseInt(limit);
            pipeline.push({ $skip: skip });
            pipeline.push({ $limit: parseInt(limit) });

            // Projeção final
            pipeline.push({
                $project: {
                    // Campos do staff
                    tags: 1,
                    created_at: 1,
                    updated_at: 1,
                    invite: 1,
                    invite_token: 1,
                    invite_expires_at: 1,
                    role: 1,

                    // Campos do evento
                    event: {
                        _id: '$eventData._id',
                        id: '$eventData.id',
                        name: '$eventData.name',
                        status: '$eventData.status',
                        slug: '$eventData.slug',
                        category: '$eventData.category',
                        address: '$eventData.address',
                        starts_at: '$eventData.starts_at',
                        ends_at: '$eventData.ends_at',
                        tickets_purchased_count: '$eventData.tickets_purchased_count',
                        tickets_available_count: '$eventData.tickets_available_count',
                        created_at: '$eventData.created_at',
                        updated_at: '$eventData.updated_at'
                    },

                    // Campos do member
                    member: {
                        _id: '$memberData._id',
                        full_name: '$memberData.full_name',
                        phone: '$memberData.phone',
                    }
                }
            });

            // Executar as queries
            const [staffs, totalResult] = await Promise.all([
                Staff.aggregate(pipeline),
                Staff.aggregate(countPipeline)
            ]);

            const total = totalResult[0]?.total || 0;

            // Formata a resposta
            const response = {
                success: true,
                staffs: staffs,
                metadata: {
                    total: total,
                    limit: parseInt(limit),
                    page: parseInt(page),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    hasNextPage: (parseInt(page) * parseInt(limit)) < total,
                    hasPrevPage: parseInt(page) > 1,
                }
            };

            return res.status(200).json(response);
        } catch (error) {
            console.error("Error fetching staff:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error",
                error: error.message,
            });
        }
    },
};