const Batch = require("../../../model/Batch")

module.exports = {
    async getAllBatches(req, res) {
        try {
            const queryObj = { ...req.query }

            const excludeFields = ['page', 'sort', 'limit', 'fields']
            excludeFields.forEach(el => delete queryObj[el])

            let queryStr = JSON.stringify(queryObj)
            queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`)

            const sortBy = req.query.sort ? req.query.sort.split(",").join(" ") : '-createdAt'
            const fields = req.query.fields ? req.query.fields.split(",").join(" ") : ''

            const page = req.query.page || 1
            const limit = req.query.limit || 10
            const skip = (page - 1) * limit

            let batches = await Batch.find(JSON.parse(queryStr))
                .select(fields)
                .sort(sortBy)
                .skip(skip)
                .limit(Number(limit))

            let metadata;
            if (req.query.page && batches.length) {
                const count = await Batch.countDocuments(JSON.parse(queryStr))
                if (skip > count) return res.status(404).send({
                    message: "this page does not exists"
                })
                metadata = {
                    currentPage: Number(req.query.page),
                    totalPages: Math.ceil(count / Number(limit)),
                    totalDocuments: count
                }
            } else metadata = {}

            res.status(200).send({
                batches,
                metadata
            })
        } catch (err) {
            res.status(500).send({
                mensagem: err.message // erro interno
            })
        }
    }
}