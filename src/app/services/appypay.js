const axios = require('axios');
const { redis } = require("../redisClient"); // Importa cliente Redis para caching
const formatToDecimal = require('../utils/formatToDecimal');

// Gera o token
async function generateToken() {
  try {
    const params = new URLSearchParams();
    params.append('grant_type', process.env.GRANT_TYPE_APPYPAY);
    params.append('client_id', process.env.CLIENT_ID_APPYPAY);
    params.append('client_secret', process.env.SECRET_KEY_APPYPAY);
    params.append('resource', process.env.RESOURCE_APPYPAY);

    const response = await axios.post(
      process.env.AUTH_URL_APPYPAY,
      params,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const data = response.data;
    return data.access_token;
  } catch (error) {
    console.error('Erro ao gerar token:', error.response?.data || error.message);
    throw error;
  }
}

async function saveToken(token) {
  try {
    // Verifica se o token é válido antes de salvar
    if (!token || typeof token !== 'string') {
      throw new Error('Token inválido');
    }

    await redis.set('appypay_token', token);
    console.log('Token salvo no Redis:', new Date().toISOString());
  } catch (error) {
    console.error('Erro ao salvar token no Redis:', error);
    throw error;
  }
}

// Busca token do Redis
async function getToken() {
  return await redis.get('appypay_token');
}

// Inicializa e agenda refresh a cada 55 minutos
async function initTokenRefresh() {
  try {
    console.log('Iniciando gestão de token AppyPay...');

    // Gera o primeiro token
    const token = await generateToken();
    await saveToken(token);

    // Agenda refresh a cada 55 minutos
    setInterval(async () => {
      try {
        console.log('Atualizando token AppyPay...');
        const newToken = await generateToken();
        await saveToken(newToken);
      } catch (error) {
        console.error('Erro ao atualizar token:', error);
      }
    }, 55 * 60 * 1000); // 55 minutos

    console.log('Gestão de token AppyPay iniciada com sucesso');
  } catch (error) {
    console.error('Erro ao inicializar token AppyPay:', error);
  }
}

async function executeGPOPayment({
  orderId,
  amount,
  currency = 'AOA',
  subject,
  phoneNumber,
  customer
}) {
  const token = await getToken();
  if (!token) {
    throw new Error('Token não disponível. Certifique-se de que o token foi gerado corretamente.');
  }
  const response = await axios.post(
    process.env.API_APPYPAY + '/charges',
    {
      amount,
      currency,
      description: subject,
      merchantTransactionId: orderId,
      paymentMethod: process.env.GPO_MERCHANT_ID_APPYPAY,
      paymentInfo: {
        phoneNumber: phoneNumber
      },
      notify: {
        name: customer?.name ?? null,
        telephone: customer?.phone ?? phoneNumber,
        email: customer?.email ?? null,
        smsNotification: true,
        emailNotification: true
      }
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  return response;
}

module.exports = {
  initTokenRefresh,
  executeGPOPayment
};