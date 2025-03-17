const mongoose = require("mongoose")

const batch = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    quantity_for_purchase: {
        max: {
            type: Number,
            required: true
        },
        min: {
            type: Number,
            required: true
        }
    },
    price: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    nomenclature: {
        type: String,
        default: 'ticket'
    },
    available_tickets: {
        type: String,
        default: "for_date"
    },
    visibility: {
        type: String,
        enum: ['public', 'private'],
        required: true
    },
    tickets_period_sales: {
        type: String,
        batch: String
    },
    description: {
        type: String,
        default: ""
    },
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
        required: true
    },
    starts_at: {
        date: {
            type: Date,
            required: Date
        },
        hm: {
            type: String,
            default: null
        }
    },
    ends_at: {
        date: {
            type: Date,
            required: Date
        },
        hm: {
            type: Date,
            default: null
        }
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
})

module.exports = mongoose.model("Batch", batch);