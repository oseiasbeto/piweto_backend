const mongoose = require("mongoose");

const payoutSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
        required: false, // Pode ser um saque geral ou de um evento específico
        default: null
    },
    amount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['in_transit', 'processing', 'completed', 'failed'],
        default: 'in_transit'
    },
    reason: {
        type: String,
        default: null // Apenas em caso de rejeição
    },
    admin_note: {
        type: String,
        default: null
    },
    payment_method: {
        type: String,
        enum: ['pix', 'bank_transfer'],
        required: true
    },
    bank_details: {
        iban: {
            type: String,
            required: function () {
                return this.payment_method === 'bank_transfer';
            }
        },
        bank_name: {
            type: String,
            required: function () {
                return this.payment_method === 'bank_transfer';
            }
        },
        account_holder: {
            type: String,
            required: function () {
                return this.payment_method === 'bank_transfer';
            }
        }
    },
    payout_at: {
        type: Date,
        default: null // Data em que o pagamento foi efetuado
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

module.exports = mongoose.model("Payout", payoutSchema);
