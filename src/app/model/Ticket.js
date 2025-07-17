const mongoose = require("mongoose")
const mongoosePaginate = require("mongoose-paginate-v2");

const ticket = new mongoose.Schema({
    id: {
        type: String,
        required: true
    },
    code: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    batch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Batch",
        required: true
    },
    tags: [],
    price: {
        type: Number,
        required: true
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        required: true
    },
    description: {
        type: String,
        default: ""
    },
    booking_number: {
        type: Number,
        default: 0
    },
    check_in: {
        at: {
            type: Date,
            default: null
        },
        status: {
            type: String,
            enum: ['a', 'd', 'p'],
            default: 'p'
        },
        checked_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        }
    },
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
        required: true
    },
    costumer: {
        type: Object,
        required: true
    },
    status: {
        type: String,
        enum: ["a", 'd', "p"],
        default: "p"
    },
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
})

ticket.plugin(mongoosePaginate);

module.exports = mongoose.model("Ticket", ticket);