const axios = require("axios");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const privateKey = fs.readFileSync(
  path.join(__dirname, "..", "keys", "paypay_rsa_private_key.pem"),
  "utf8"
);

function executePayPayPayment({ price, subject, order_id, timeout_express }) {
  function formatToDecimal(value) {
    return value.toFixed(2);
  }

  // Construir biz_content
  const bizContentData = {
    payer_ip: "127.0.0.1",
    timeout_express,
    sale_product_code: process.env.SALE_PRODUCT_PAYPAY,
    cashier_type: "SDK",
    trade_info: {
      out_trade_no: order_id, // Seu número de pedido
      subject: subject, // Nome do pedido
      currency: "AOA",
      price: formatToDecimal(price), // Preço do pedido
      quantity: 1, // Quantidade
      total_amount: formatToDecimal(price), // Quantidade total
      payee_identity: process.env.PARTENER_ID_PAYPAY,
    },
  };

  // Function to encrypt and base64 encode data
  function encryptAndBase64(data, privateKey) {
    const buffer = Buffer.from(data);
    const chunkSize = 117; // Para chave de 1024 bits com PKCS1_PADDING, tamanho máximo é 128 - 11
    const encryptedChunks = [];

    for (let i = 0; i < buffer.length; i += chunkSize) {
      const chunk = buffer.slice(i, i + chunkSize);
      const encryptedChunk = crypto.privateEncrypt(
        {
          key: privateKey,
          padding: crypto.constants.RSA_PKCS1_PADDING,
        },
        chunk
      );
      encryptedChunks.push(encryptedChunk);
    }

    // Concatenar todos os blocos criptografados e codificar em Base64
    return Buffer.concat(encryptedChunks).toString("base64");
  }

  // Encrypt and base64 encode biz_content
  const encryptedBizContent = encryptAndBase64(
    JSON.stringify(bizContentData),
    privateKey
  );

  // Função para obter o timestamp atual
  function getCurrentTimestamp() {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")} ${now
      .getHours()
      .toString()
      .padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now
      .getSeconds()
      .toString()
      .padStart(2, "0")}`;
  }

  // Construir o corpo da solicitação
  var requestBody = {
    request_no: order_id,
    service: "instant_trade",
    version: "1.0",
    partner_id: process.env.PARTENER_ID_PAYPAY,
    charset: "UTF-8",
    lang: "pt",
    sign_type: "RSA",
    timestamp: getCurrentTimestamp(),
    format: "JSON",
    biz_content: encryptedBizContent,
  };

  // Function to generate the signature
  function generateSignature(requestBody) {
    // Sort the request body keys and concatenate them into a string
    const sortedKeys = Object.keys(requestBody).sort();
    const paramString = sortedKeys
      .filter((key) => key !== "sign" && key !== "sign_type") // Exclude sign and sign_type parameters
      .map((key) => `${key}=${requestBody[key]}`)
      .join("&");

    // Sign the string using the private key
    const sign = crypto.createSign("RSA-SHA1");
    sign.update(paramString);
    const signature = sign.sign(privateKey, "base64");

    // Set the signature and sign_type back to the request body
    requestBody.sign = signature;
    requestBody.sign_type = "RSA";

    return signature;
  }

  // Gerar a assinatura
  generateSignature(requestBody);

  // Codificar URL de todos os valores no corpo da solicitação
  for (const key in requestBody) {
    if (
      requestBody.hasOwnProperty(key) &&
      key !== "sign" &&
      key !== "sign_type"
    ) {
      requestBody[key] = encodeURIComponent(requestBody[key]);
    }
  }

  // Converter para string JSON
  const requestBodyString = JSON.stringify(requestBody);

  // Enviar a solicitação
  return axios.post(process.env.API_PAYPAY, requestBodyString, {
    headers: {
      "Content-Type": "application/json",
    },
  });
}

function executeReferencePayment({
  price,
  subject,
  order_id,
  timeout_express,
}) {
  function formatToDecimal(value) {
    return value.toFixed(2);
  }

  // Construir biz_content
  const bizContentData = {
    payer_ip: "127.0.0.1",
    timeout_express,
    sale_product_code: process.env.SALE_PRODUCT_PAYPAY,
    cashier_type: "SDK",
    trade_info: {
      out_trade_no: order_id, // Seu número de pedido
      subject: subject, // Nome do pedido
      currency: "AOA",
      price: formatToDecimal(price), // Preço do pedido
      quantity: 1, // Quantidade
      total_amount: formatToDecimal(price), // Quantidade total
      payee_identity: process.env.PARTENER_ID_PAYPAY,
    },
    pay_method: {
      pay_product_code: 31,
      amount: formatToDecimal(price),
      bank_code: "REF",
    },
  };

  // Function to encrypt and base64 encode data
  function encryptAndBase64(data, privateKey) {
    const buffer = Buffer.from(data);
    const chunkSize = 117; // Para chave de 1024 bits com PKCS1_PADDING, tamanho máximo é 128 - 11
    const encryptedChunks = [];

    for (let i = 0; i < buffer.length; i += chunkSize) {
      const chunk = buffer.slice(i, i + chunkSize);
      const encryptedChunk = crypto.privateEncrypt(
        {
          key: privateKey,
          padding: crypto.constants.RSA_PKCS1_PADDING,
        },
        chunk
      );
      encryptedChunks.push(encryptedChunk);
    }

    // Concatenar todos os blocos criptografados e codificar em Base64
    return Buffer.concat(encryptedChunks).toString("base64");
  }

  // Encrypt and base64 encode biz_content
  const encryptedBizContent = encryptAndBase64(
    JSON.stringify(bizContentData),
    privateKey
  );

  // Função para obter o timestamp atual
  function getCurrentTimestamp() {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")} ${now
      .getHours()
      .toString()
      .padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now
      .getSeconds()
      .toString()
      .padStart(2, "0")}`;
  }

  // Construir o corpo da solicitação
  var requestBody = {
    request_no: order_id,
    service: "instant_trade",
    version: "1.0",
    partner_id: process.env.PARTENER_ID_PAYPAY,
    charset: "UTF-8",
    lang: "pt",
    sign_type: "RSA",
    timestamp: getCurrentTimestamp(),
    format: "JSON",
    biz_content: encryptedBizContent,
  };

  // Function to generate the signature
  function generateSignature(requestBody) {
    // Sort the request body keys and concatenate them into a string
    const sortedKeys = Object.keys(requestBody).sort();
    const paramString = sortedKeys
      .filter((key) => key !== "sign" && key !== "sign_type") // Exclude sign and sign_type parameters
      .map((key) => `${key}=${requestBody[key]}`)
      .join("&");

    // Sign the string using the private key
    const sign = crypto.createSign("RSA-SHA1");
    sign.update(paramString);
    const signature = sign.sign(privateKey, "base64");

    // Set the signature and sign_type back to the request body
    requestBody.sign = signature;
    requestBody.sign_type = "RSA";

    return signature;
  }

  // Gerar a assinatura
  generateSignature(requestBody);

  // Codificar URL de todos os valores no corpo da solicitação
  for (const key in requestBody) {
    if (
      requestBody.hasOwnProperty(key) &&
      key !== "sign" &&
      key !== "sign_type"
    ) {
      requestBody[key] = encodeURIComponent(requestBody[key]);
    }
  }

  // Converter para string JSON
  const requestBodyString = JSON.stringify(requestBody);

  // Enviar a solicitação
  return axios.post(process.env.API_PAYPAY, requestBodyString, {
    headers: {
      "Content-Type": "application/json",
    },
  });
}

function executeMulPayment({
  price,
  subject,
  phone_num,
  quantity,
  order_id,
  timeout_express,
}) {
  function formatToDecimal(value) {
    return value.toFixed(2);
  }

  // Construir biz_content
  const bizContentData = {
    payer_ip: "127.0.0.1",
    timeout_express,
    sale_product_code: process.env.SALE_PRODUCT_PAYPAY,
    cashier_type: "SDK",
    trade_info: {
      out_trade_no: order_id, // Seu número de pedido
      subject: subject, // Nome do pedido
      currency: "AOA",
      price: formatToDecimal(price), // Preço do pedido
      quantity, // Quantidade
      total_amount: formatToDecimal(price), // Quantidade total
      payee_identity: process.env.PARTENER_ID_PAYPAY,
      payee_identity_type: "1",
    },
    pay_method: {
      pay_product_code: 31,
      amount: formatToDecimal(price),
      bank_code: "MUL",
      phone_num,
    },
  };

  // Function to encrypt and base64 encode data
  function encryptAndBase64(data, privateKey) {
    const buffer = Buffer.from(data);
    const chunkSize = 117; // Para chave de 1024 bits com PKCS1_PADDING, tamanho máximo é 128 - 11
    const encryptedChunks = [];

    for (let i = 0; i < buffer.length; i += chunkSize) {
      const chunk = buffer.slice(i, i + chunkSize);
      const encryptedChunk = crypto.privateEncrypt(
        {
          key: privateKey,
          padding: crypto.constants.RSA_PKCS1_PADDING,
        },
        chunk
      );
      encryptedChunks.push(encryptedChunk);
    }

    // Concatenar todos os blocos criptografados e codificar em Base64
    return Buffer.concat(encryptedChunks).toString("base64");
  }

  // Encrypt and base64 encode biz_content
  const encryptedBizContent = encryptAndBase64(
    JSON.stringify(bizContentData),
    privateKey
  );

  // Função para obter o timestamp atual
  function getCurrentTimestamp() {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")} ${now
      .getHours()
      .toString()
      .padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now
      .getSeconds()
      .toString()
      .padStart(2, "0")}`;
  }

  // Construir o corpo da solicitação
  var requestBody = {
    request_no: order_id,
    service: "instant_trade",
    version: "1.0",
    partner_id: process.env.PARTENER_ID_PAYPAY,
    charset: "UTF-8",
    lang: "pt",
    sign_type: "RSA",
    timestamp: getCurrentTimestamp(),
    format: "JSON",
    biz_content: encryptedBizContent,
  };

  // Function to generate the signature
  function generateSignature(requestBody) {
    // Sort the request body keys and concatenate them into a string
    const sortedKeys = Object.keys(requestBody).sort();
    const paramString = sortedKeys
      .filter((key) => key !== "sign" && key !== "sign_type") // Exclude sign and sign_type parameters
      .map((key) => `${key}=${requestBody[key]}`)
      .join("&");

    // Sign the string using the private key
    const sign = crypto.createSign("RSA-SHA1");
    sign.update(paramString);
    const signature = sign.sign(privateKey, "base64");

    // Set the signature and sign_type back to the request body
    requestBody.sign = signature;
    requestBody.sign_type = "RSA";

    return signature;
  }

  // Gerar a assinatura
  generateSignature(requestBody);

  // Codificar URL de todos os valores no corpo da solicitação
  for (const key in requestBody) {
    if (
      requestBody.hasOwnProperty(key) &&
      key !== "sign" &&
      key !== "sign_type"
    ) {
      requestBody[key] = encodeURIComponent(requestBody[key]);
    }
  }

  // Converter para string JSON
  const requestBodyString = JSON.stringify(requestBody);

  // Enviar a solicitação
  return axios.post(process.env.API_PAYPAY, requestBodyString, {
    headers: {
      "Content-Type": "application/json",
    },
  });
}

function closePayment(out_trade_no, request_no) {
  // Construir biz_content
  const bizContentData = {
    out_trade_no,
  };

  // Function to encrypt and base64 encode data
  function encryptAndBase64(data, privateKey) {
    const buffer = Buffer.from(data);
    const chunkSize = 117; // Para chave de 1024 bits com PKCS1_PADDING, tamanho máximo é 128 - 11
    const encryptedChunks = [];

    for (let i = 0; i < buffer.length; i += chunkSize) {
      const chunk = buffer.slice(i, i + chunkSize);
      const encryptedChunk = crypto.privateEncrypt(
        {
          key: privateKey,
          padding: crypto.constants.RSA_PKCS1_PADDING,
        },
        chunk
      );
      encryptedChunks.push(encryptedChunk);
    }

    // Concatenar todos os blocos criptografados e codificar em Base64
    return Buffer.concat(encryptedChunks).toString("base64");
  }

  // Encrypt and base64 encode biz_content
  const encryptedBizContent = encryptAndBase64(
    JSON.stringify(bizContentData),
    privateKey
  );

  // Função para obter o timestamp atual
  function getCurrentTimestamp() {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")} ${now
      .getHours()
      .toString()
      .padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now
      .getSeconds()
      .toString()
      .padStart(2, "0")}`;
  }

  // Construir o corpo da solicitação
  var requestBody = {
    request_no,
    service: "trade_close",
    version: "1.0",
    partner_id: process.env.PARTENER_ID_PAYPAY,
    charset: "UTF-8",
    lang: "pt",
    sign_type: "RSA",
    timestamp: getCurrentTimestamp(),
    format: "JSON",
    biz_content: encryptedBizContent,
  };

  // Function to generate the signature
  function generateSignature(requestBody) {
    // Sort the request body keys and concatenate them into a string
    const sortedKeys = Object.keys(requestBody).sort();
    const paramString = sortedKeys
      .filter((key) => key !== "sign" && key !== "sign_type") // Exclude sign and sign_type parameters
      .map((key) => `${key}=${requestBody[key]}`)
      .join("&");

    // Sign the string using the private key
    const sign = crypto.createSign("RSA-SHA1");
    sign.update(paramString);
    const signature = sign.sign(privateKey, "base64");

    // Set the signature and sign_type back to the request body
    requestBody.sign = signature;
    requestBody.sign_type = "RSA";

    return signature;
  }

  // Gerar a assinatura
  generateSignature(requestBody);

  // Codificar URL de todos os valores no corpo da solicitação
  for (const key in requestBody) {
    if (
      requestBody.hasOwnProperty(key) &&
      key !== "sign" &&
      key !== "sign_type"
    ) {
      requestBody[key] = encodeURIComponent(requestBody[key]);
    }
  }

  // Converter para string JSON
  const requestBodyString = JSON.stringify(requestBody);

  // Enviar a solicitação
  return axios.post(process.env.API_PAYPAY, requestBodyString, {
    headers: {
      "Content-Type": "application/json",
    },
  });
}

function executePaymentToPayPayAccount(price, payee_identity, order_id) {
  function formatToDecimal(value) {
    return value.toFixed(2);
  }

  // Construir biz_content
  const bizContentData = {
    out_trade_no: order_id,
    payer_identity_type: "1",
    payer_identity: process.env.PARTENER_ID_PAYPAY,
    payee_identity_type: "2",
    payee_identity,
    aging: "R",
    transfer_amount: formatToDecimal(price),
    currency: "AOA",
    sale_product_code: process.env.SALE_PRODUCT_PAYPAY,
    memo: "Transferencia para a conta",
  };

  // Function to encrypt and base64 encode data
  function encryptAndBase64(data, privateKey) {
    const buffer = Buffer.from(data);
    const chunkSize = 117; // Para chave de 1024 bits com PKCS1_PADDING, tamanho máximo é 128 - 11
    const encryptedChunks = [];

    for (let i = 0; i < buffer.length; i += chunkSize) {
      const chunk = buffer.slice(i, i + chunkSize);
      const encryptedChunk = crypto.privateEncrypt(
        {
          key: privateKey,
          padding: crypto.constants.RSA_PKCS1_PADDING,
        },
        chunk
      );
      encryptedChunks.push(encryptedChunk);
    }

    // Concatenar todos os blocos criptografados e codificar em Base64
    return Buffer.concat(encryptedChunks).toString("base64");
  }

  // Encrypt and base64 encode biz_content
  const encryptedBizContent = encryptAndBase64(
    JSON.stringify(bizContentData),
    privateKey
  );

  // Função para obter o timestamp atual
  function getCurrentTimestamp() {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")} ${now
      .getHours()
      .toString()
      .padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now
      .getSeconds()
      .toString()
      .padStart(2, "0")}`;
  }

  // Construir o corpo da solicitação
  var requestBody = {
    request_no: order_id,
    service: "transfer_to_account",
    version: "1.0",
    partner_id: process.env.PARTENER_ID_PAYPAY,
    charset: "UTF-8",
    lang: "pt",
    sign_type: "RSA",
    timestamp: getCurrentTimestamp(),
    format: "JSON",
    biz_content: encryptedBizContent,
  };

  // Function to generate the signature
  function generateSignature(requestBody) {
    // Sort the request body keys and concatenate them into a string
    const sortedKeys = Object.keys(requestBody).sort();
    const paramString = sortedKeys
      .filter((key) => key !== "sign" && key !== "sign_type") // Exclude sign and sign_type parameters
      .map((key) => `${key}=${requestBody[key]}`)
      .join("&");

    // Sign the string using the private key
    const sign = crypto.createSign("RSA-SHA1");
    sign.update(paramString);
    const signature = sign.sign(privateKey, "base64");

    // Set the signature and sign_type back to the request body
    requestBody.sign = signature;
    requestBody.sign_type = "RSA";

    return signature;
  }

  // Gerar a assinatura
  generateSignature(requestBody);

  // Codificar URL de todos os valores no corpo da solicitação
  for (const key in requestBody) {
    if (
      requestBody.hasOwnProperty(key) &&
      key !== "sign" &&
      key !== "sign_type"
    ) {
      requestBody[key] = encodeURIComponent(requestBody[key]);
    }
  }

  // Converter para string JSON
  const requestBodyString = JSON.stringify(requestBody);

  // Enviar a solicitação
  axios
    .post(process.env.API_PAYPAY, requestBodyString, {
      headers: {
        "Content-Type": "application/json",
      },
    })
    .then((response) => {
      console.log("Response:", response.data);
    })
    .catch((error) => {
      console.error(
        "Error:",
        error.response ? error.response.data : error.message
      );
    });
}

function executePaymentToBankAccount(price, bank_details, order_id) {
  function formatToDecimal(value) {
    return value.toFixed(2);
  }

  const bizContentData = {
    out_trade_no: order_id,
    payer_identity_type: "1",
    payer_identity: process.env.PARTENER_ID_PAYPAY,
    amount: formatToDecimal(Number(price)),
    currency: "AOA",
    bank_card_no: bank_details.iban,
    bank_account_name: bank_details.account_holder,
    bank_code: bank_details.bank_name,
    sale_product_code: process.env.SALE_PRODUCT_PAYPAY,
    pay_product_code: "11",
    memo: "Transferencia de conta",
  };

  // Function to encrypt and base64 encode data
  function encryptAndBase64(data, privateKey) {
    const buffer = Buffer.from(data);
    const chunkSize = 117; // Para chave de 1024 bits com PKCS1_PADDING, tamanho máximo é 128 - 11
    const encryptedChunks = [];

    for (let i = 0; i < buffer.length; i += chunkSize) {
      const chunk = buffer.slice(i, i + chunkSize);
      const encryptedChunk = crypto.privateEncrypt(
        {
          key: privateKey,
          padding: crypto.constants.RSA_PKCS1_PADDING,
        },
        chunk
      );
      encryptedChunks.push(encryptedChunk);
    }

    // Concatenar todos os blocos criptografados e codificar em Base64
    return Buffer.concat(encryptedChunks).toString("base64");
  }

  // Encrypt and base64 encode biz_content
  const encryptedBizContent = encryptAndBase64(
    JSON.stringify(bizContentData),
    privateKey
  );

  // Função para obter o timestamp atual
  function getCurrentTimestamp() {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")} ${now
      .getHours()
      .toString()
      .padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now
      .getSeconds()
      .toString()
      .padStart(2, "0")}`;
  }

  // Construir o corpo da solicitação
  var requestBody = {
    request_no: order_id,
    service: "transfer_to_card",
    version: "1.0",
    partner_id: process.env.PARTENER_ID_PAYPAY,
    charset: "UTF-8",
    lang: "pt",
    sign_type: "RSA",
    timestamp: getCurrentTimestamp(),
    format: "JSON",
    biz_content: encryptedBizContent,
  };

  // Function to generate the signature
  function generateSignature(requestBody) {
    // Sort the request body keys and concatenate them into a string
    const sortedKeys = Object.keys(requestBody).sort();
    const paramString = sortedKeys
      .filter((key) => key !== "sign" && key !== "sign_type") // Exclude sign and sign_type parameters
      .map((key) => `${key}=${requestBody[key]}`)
      .join("&");

    // Sign the string using the private key
    const sign = crypto.createSign("RSA-SHA1");
    sign.update(paramString);
    const signature = sign.sign(privateKey, "base64");

    // Set the signature and sign_type back to the request body
    requestBody.sign = signature;
    requestBody.sign_type = "RSA";

    return signature;
  }

  // Gerar a assinatura
  generateSignature(requestBody);

  // Codificar URL de todos os valores no corpo da solicitação
  for (const key in requestBody) {
    if (
      requestBody.hasOwnProperty(key) &&
      key !== "sign" &&
      key !== "sign_type"
    ) {
      requestBody[key] = encodeURIComponent(requestBody[key]);
    }
  }

  // Converter para string JSON
  const requestBodyString = JSON.stringify(requestBody);

  // Enviar a solicitação
  return axios.post(process.env.API_PAYPAY, requestBodyString, {
    headers: {
      "Content-Type": "application/json",
    },
  });
}

module.exports = {
  executePayPayPayment,
  executeReferencePayment,
  executeMulPayment,
  executePaymentToPayPayAccount,
  executePaymentToBankAccount,
  closePayment
};
