const mongoose = require("mongoose")

const event = new mongoose.Schema({
    id: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    slug: {
        type: String,
        required: true
    },
    cover: {
        original: {
            type: String,
            default: null
        },
        low: {
            type: String,
            default: null
        },
        high: {
            type: String,
            default: null
        },
        medium: {
            type: String,
            default: null
        },
        key: {
            type: String,
            default: null
        }
    },
    type: {
        type: String,
        required: true
    },
    show_on_map: {
        type: Boolean,
        default: false
    },
    views: {
        type: Number,
        default: 0
    },
    balance: {
        type: Number,
        default: 0
    },
    tickets_available_count: {
        type: Number,
        default: 0
    },
    tickets_checked_count: {
        type: Number,
        default: 0
    },
    tickets_purchased_count: {
        type: Number,
        default: 0
    },
    orders_pending_cash: {
        type: Number,
        default: 0
    },
    sales_count: {
        type: Number,
        default: 0
    },
    data_bank: {
        iban: {
            type: String,
            default: ""
        },
        bank_name: {
            type: String,
            default: ""
        },
        account_holder: {
            type: String,
            default: ""
        }
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    address: {
        type: Object,
        required: function () {
            if (this.type == 'presence') return true
            else return false
        }
    },
    status: {
        type: String,
        enum: ['a', 'r', 'd', 'p'],
        default: 'p'
    },
    visibility: {
        type: String,
        enum: ['public', 'private'],
        required: true
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    starts_at: {
        date: {
            type: Date,
            required: true
        },
        hm: {
            type: Date,
            required: true
        }
    },
    tags: [],
    ends_at: {
        date: {
            type: Date,
            required: true
        },
        hm: {
            type: Date,
            required: true
        }
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

module.exports = mongoose.model("Event", event);