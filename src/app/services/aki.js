const axios = require("axios");

function formatToDecimal(value) {
  return value.toFixed(2);
}

function executeGPOPayment({
  amount,
  subject,
  phone_num,
  order_id,
  out_trade_no
}) {
  // Construir o corpo da solicitação
  var requestBody = {
    WaitFeedback: true,
    Payment: {
      Order_id: order_id,
      Amount: formatToDecimal(amount),
      Destination: phone_num,
      Description: subject,
      CallBack: {
        Success: {
          URL: "https://api.piweto.it.ao/v1/orders/notification-trigger",
          Method: "POST",
          Body: JSON.stringify({ 
            status: "TRADE_FINISHED",
            out_trade_no,
          }),
          BodyType: "application/json"
        },
        Failure: {
          URL: "https://api.piweto.it.ao/v1/orders/notification-trigger",
          Method: "POST",
          Body: JSON.stringify({
            status: "TRADE_FAILED",
            out_trade_no
          }),
          BodyType: "application/json"
        }
      }
    }
  };

  // Enviar a solicitação
  return axios.post(process.env.API_AKI + '/MultiCaixa/v1/Express/Payment', requestBody, {
    headers: {
      "Content-Type": "application/json",
      "Authorization": "atmn_DF8343B4DBBC921D117B1D5FD213DA9D50B1EC6C9D7615156383C6A041D6C29F"
    },
  });
}

module.exports = {
  executeGPOPayment
};
