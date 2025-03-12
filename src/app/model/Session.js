const mongoose = require("mongoose")
const { randomUUID } = require("crypto")

const session = new mongoose.Schema({
    id: {
        type: String,
        default: randomUUID().toString()
    },
    token: {
        type: String,
        required: true
    },
    crypto: {
        iv: {
            type: String,
            default: null
        },
        key: {
            type: String,
            default: null
        }
    },
    userAgent: {
        type: String,
        default: null
    },
    status: {
        type: String,
        enum: ["a", "d"],
        default: "a"
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
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

module.exports = mongoose.model("Session", session);