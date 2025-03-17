const mongoose = require("mongoose")

const staff = new mongoose.Schema({
    role: {
        type: String,
        default: "manager"
    },
    member: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
        required: true
    },
    invite: {
        expires_at: {
            type: Date,
            default: null
        },
        status: {
            type: String,
            enum: ['a', 'r', 'p'],
            default: 'p'
        },
        token: {
            type: Date,
            default: null
        },
        sent_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        }
    },
    tags: [],
    is_admin: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
})

module.exports = mongoose.model("Staff", staff);