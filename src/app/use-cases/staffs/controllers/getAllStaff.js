const Staff = require("../../../model/Staff")

module.exports = {
    async getAllStaff(req, res) {
        try {
            const queryObj = { ...req.query }

            if (req.query.tags) {
                const tags = req.query.tags
                queryObj.tags = { $regex: tags, $options: 'i' }
            }

            const excludeFields = ['page', 'sort', 'limit', 'fields']
            excludeFields.forEach(el => delete queryObj[el])

            let queryStr = JSON.stringify(queryObj)
            queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`)

            const sortBy = req.query.sort ? req.query.sort.split(",").join(" ") : '-createdAt'
            const fields = req.query.fields ? req.query.fields.split(",").join(" ") : ''

            const page = req.query.page || 1
            const limit = req.query.limit || 10
            const skip = (page - 1) * limit

            let staffs = await Staff.find(JSON.parse(queryStr))
                .select(fields)
                .sort(sortBy)
                .skip(skip)
                .limit(Number(limit))
                .populate("event")

            let metadata;
            if (req.query.page && staffs.length) {
                const count = await Staff.countDocuments(JSON.parse(queryStr))
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
                staffs,
                metadata
            })
        } catch (err) {
            res.status(500).send({
                mensagem: err.message // erro interno
            })
        }
    }
}