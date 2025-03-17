const mongoose = require("mongoose")

const order = new mongoose.Schema({
    id: {
        type: String,
        required: true
    },
    batches: {
        type: Array,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    reservation_number: {
        type: Number,
        required: true
    },
    total_tickets_selected: {
        type: Number,
        required: true
    },
    amount_after_rate: {
        type: Number,
        required: true
    },
    amount_after_discount: {
        type: Number,
        required: true
    },
    biz_content: {
        type: Object,
        default: null
    },
    coupon: {
        type: Object,
        default: null
    },
    rate: {
        type: Number,
        required: true
    },
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
        required: true
    },
    data: {
        type: Object,
        required: true
    },
    status: {
        type: String,
        enum: ["a", 'c', "p"],
        default: "p"
    },
    expires_at: {
        type: Date,
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now()
    },
    updated_at: {
        type: Date,
        default: Date.now()
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
})

module.exports = mongoose.model("Order", order);