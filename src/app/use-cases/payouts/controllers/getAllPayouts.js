const Payout = require("../../../model/Payout");

/**
 * @description Lista todos os pagamentos com possibilidade de filtros e paginação
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} - Retorna os pagamentos com metadados de paginação
 */

module.exports = {
    async getAllPayouts(req, res) {
        try {
            const { page = 1, limit = 10, sort = '-created_at', fields, ...queryObj } = req.query;

            // Construir a query de busca com operadores MongoDB
            let queryStr = JSON.stringify(queryObj);
            queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

            const query = JSON.parse(queryStr);

            // Seleção de campos
            const selectFields = fields ? fields.split(",").join(" ") : '';

            // Opções de paginação
            const options = {
                page: parseInt(page),
                limit: parseInt(limit),
                sort: sort.split(",").join(" "),
                populate: { path: "user", select: "full_name phone email" },
                select: selectFields,
                customLabels: {
                    docs: 'payouts',
                    totalDocs: 'total',
                    limit: 'limit',
                    page: 'currentPage',
                    nextPage: 'nextPage',
                    prevPage: 'prevPage',
                    totalPages: 'totalPages',
                    hasNextPage: 'hasNext',
                    hasPrevPage: 'hasPrev'
                }
            };

            // Busca paginada
            const result = await Payout.paginate(query, options);

            // Formata a resposta
            const response = {
                success: true,
                payouts: result.payouts,
                metadata: {
                    total: result.total,
                    limit: result.limit,
                    page: result.currentPage,
                    totalPages: result.totalPages,
                    hasNextPage: result.hasNext,
                    hasPrevPage: result.hasPrev
                }
            };

            return res.status(200).json(response);
        } catch (err) {
            console.error("Error fetching payouts:", err);
            return res.status(500).json({
                success: false,
                message: "Internal server error",
                error: err.message
            });
        }
    }
}