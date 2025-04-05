const mongoose = require("mongoose");

const financial = new mongoose.Schema({
  total_earnings: { 
    type: Number, 
    default: 0 
  }, // Ganhos totais da empresa (soma de todos os valores dos eventos)
  total_paid: { 
    type: Number, 
    default: 0 
  }, // Total já pago aos organizadores (saques aprovados)
  pending_amount: { 
    type: Number, 
    default: 0 
  }, // Saldo disponível mas não sacado
  platform_profit: { 
    type: Number, 
    default: 0 
  }, // Lucro = total_earnings - total_paid
},{
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

module.exports = mongoose.model("Financial", financial);