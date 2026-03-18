const Staff = require("../../../model/Staff");
const mongoose = require('mongoose');

module.exports = {
    async getAllStaff(req, res) {
        try {
            const { page = 1, limit = 10, sort, q, staff_type, status, ...otherQuery } = req.query;

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

            // Match inicial
            let matchStage = { ...formattedQuery };

            if (q) {
                matchStage.tags = { $regex: q, $options: 'i' };
            }

            pipeline.push({ $match: matchStage });

            // ✅ NOVO: Filtro por tipo de staff (is_admin)
            if (staff_type === 'y') {
                pipeline.push({
                    $match: { is_admin: true }
                });
            } else if (staff_type === 'n') {
                pipeline.push({
                    $match: { is_admin: false }
                });
            }

            // Lookup evento
            pipeline.push({
                $lookup: {
                    from: 'events',
                    localField: 'event',
                    foreignField: '_id',
                    as: 'eventData'
                }
            });

            // Lookup member
            pipeline.push({
                $lookup: {
                    from: 'users',
                    localField: 'member',
                    foreignField: '_id',
                    as: 'memberData'
                }
            });

            // Unwind
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

            // ✅ NOVO: Filtro de status (com suporte ao 'e' expirado)
            if (status) {
                const now = new Date();

                if (status === 'e') {
                    // Eventos expirados
                    pipeline.push({
                        $match: {
                            'eventData.starts_at.date': { $lt: now }
                        }
                    });
                } else if (status === 'n') {
                    // Eventos ativos válidos
                    pipeline.push({
                        $match: {
                            'eventData.starts_at.date': { $gte: now }
                        }
                    });
                } else {
                    // Qualquer outro status
                    pipeline.push({
                        $match: {
                            'eventData.status': status,
                            'eventData.starts_at.date': { $gte: now },
                        }
                    });
                }
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

            // Contagem total
            const countPipeline = [...pipeline];
            countPipeline.push({ $count: 'total' });

            // Paginação
            const skip = (parseInt(page) - 1) * parseInt(limit);
            pipeline.push({ $skip: skip });
            pipeline.push({ $limit: parseInt(limit) });

            // Projeção final
            pipeline.push({
                $project: {
                    tags: 1,
                    created_at: 1,
                    updated_at: 1,
                    invite: 1,
                    invite_token: 1,
                    invite_expires_at: 1,
                    role: 1,
                    is_admin: 1,

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

                    member: {
                        _id: '$memberData._id',
                        full_name: '$memberData.full_name',
                        phone: '$memberData.phone',
                    }
                }
            });

            // Executar queries
            const [staffs, totalResult] = await Promise.all([
                Staff.aggregate(pipeline),
                Staff.aggregate(countPipeline)
            ]);

            const total = totalResult[0]?.total || 0;

            return res.status(200).json({
                success: true,
                staffs,
                metadata: {
                    total,
                    limit: parseInt(limit),
                    page: parseInt(page),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    hasNextPage: (parseInt(page) * parseInt(limit)) < total,
                    hasPrevPage: parseInt(page) > 1,
                }
            });

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