const mongoose = require("mongoose");

const coupon = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true
    },
    discount_type: {
        type: String,
        enum: ["percentage", "fixed"],
        deafault: "percentage",
    },
    discount_value: {
        type: Number,
        required: true
    },
    event_type: {
        type: String,
        default: "all",
        enum: ["all", "specific"]
    },
    minimum_order_amount: {
        type: Number,
        default: null
    },
    max_uses: {
        type: Number,
        default: null
    },
    current_uses: {
        type: Number,
        default: 0
    },
    valid_from: {
        type: Date,
        required: true
    },
    valid_until: {
        type: Date,
        required: true
    },
    applicable_event: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event"
    }],
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    status: {
        type: String,
        enum: ["active", "inactive", "expired"],
        default: "active"
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
});

module.exports = mongoose.model("Coupon", coupon);