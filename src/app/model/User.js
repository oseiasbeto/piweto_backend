const mongoose = require("mongoose")

const user = new mongoose.Schema({
    first_name: {
        type: String,
        required: true
    },
    last_name: {
        type: String,
        required: true
    },
    full_name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        default: null
    },
    google_id: {
        type: String,
        default: null
    },
    phone: {
        type: String,
        default: null
    },
    avatar: {
        key: {
            type: String,
            default: null
        },
        url: {
            type: String,
            default: null
        }
    },
    bio: {
        type: String,
        default: ""
    },
    status: {
        type: String,
        enum: ["a", "d", "p"],
        default: "p"
    },
    role: {
        type: String,
        enum: ["organizer", "consumer", "admin", "manager"],
        default: "consumer"
    },
    address: {
        type: Object,
        default: {
            location: ""
        }
    },
    bi_number: {
        type: String,
        default: null
    },
    state_code: {
        type: String,
        default: "+244"
    },
    is_checked: {
        type: Boolean,
        default: false
    },
    check_email: {
        type: String,
        default: null
    },
    check_email_token: {
        type: String,
        default: null
    },
    check_email_expires_at: {
        type: Date,
        default: null
    },
    check_otp_code: {
        type: String,
        default: null
    },
    check_otp_expires_at: {
        type: Date,
        default: null
    },
    password_reset_otp_code: {
        type: String,
        default: null
    },
    password_reset_otp_expires_at: {
        type: Date,
        default: null
    },
    password: {
        type: String,
        default: null
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
})


module.exports = mongoose.model("User", user);