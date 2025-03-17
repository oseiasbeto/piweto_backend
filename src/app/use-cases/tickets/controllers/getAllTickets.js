const Ticket = require("../../../model/Ticket");

module.exports = {
    async getAllTickets(req, res) {
        try {
            const queryObj = { ...req.query };

            // Permitir busca por tags com regex case-insensitive
            if (req.query.tags) {
                queryObj.tags = { $regex: req.query.tags, $options: 'i' };
            }

            // Remover campos que não fazem parte do filtro
            const excludeFields = ['page', 'sort', 'limit', 'fields', 'populate'];
            excludeFields.forEach(el => delete queryObj[el]);

            let queryStr = JSON.stringify(queryObj);
            queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

            // Sorting
            const sortBy = req.query.sort ? req.query.sort.split(",").join(" ") : '-createdAt';

            // Seleção de campos específicos
            const fields = req.query.fields ? req.query.fields.split(",").join(" ") : '';

            // Paginação
            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 10;
            const skip = (page - 1) * limit;

            // Construir a query inicial
            let query = Ticket.find(JSON.parse(queryStr))
                .select(fields)
                .sort(sortBy)
                .skip(skip)
                .limit(limit);

            // Adicionar populate dinamicamente
            if (req.query.populate) {
                const populateFields = req.query.populate.split(','); 
                
                populateFields.forEach(field => {
                    query = query.populate(field.trim()); // Aplica populate dinamicamente
                });
            }

            // Executar a consulta
            const tickets = await query;

            // Criar metadados de paginação
            let metadata = {};
            if (req.query.page && tickets.length) {
                const count = await Ticket.countDocuments(JSON.parse(queryStr));
                if (skip > count) {
                    return res.status(404).send({ message: "This page does not exist" });
                }
                metadata = {
                    currentPage: page,
                    totalPages: Math.ceil(count / limit),
                    totalDocuments: count
                };
            }

            res.status(200).send({ tickets, metadata });
        } catch (err) {
            res.status(500).send({ message: err.message });
        }
    }
};
