const { createClient } = require('redis');
const { cancelOrder } = require('./queues/cancelOrder')
const { deleteUser } = require('./queues/deleteUser')

// 🔹 Configuração das credenciais do Redis
const REDIS_HOST = process.env.REDIS_HOST;
const REDIS_PORT = process.env.REDIS_PORT;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD; // Defina se necessário

const redis = createClient({
    socket: {
        host: REDIS_HOST,
        port: REDIS_PORT,
    },
    password: REDIS_PASSWORD || undefined,
});

const subscriber = redis.duplicate(); // Criamos um cliente separado para assinaturas

// 🔹 Tratamento de erros
redis.on('error', (err) => console.error('❌ Redis Client Error:', err));
subscriber.on('error', (err) => console.error('❌ Redis Subscriber Error:', err));

async function monitorExpirations() {
    console.log('⏳ Iniciando monitoramento de expirações...');
    await subscriber.subscribe('__keyevent@0__:expired', async (key) => {
        const [type, id] = key.split(':')
        switch (type) {
            case 'pedido':
                await cancelOrder(id)
                break;
            case 'conta':
                await deleteUser(id)
                break;
        }
    });
    console.log('✅ Monitoramento de expirações iniciado.');
}


async function connectRedis() {
    console.log('⏳ Conectando ao Redis...');
    await redis.connect();
    await subscriber.connect();
    console.log('✅ Redis conectado com sucesso.');

    // 🔹 Ativar notificações de expiração
    await redis.configSet('notify-keyspace-events', 'Ex');
    console.log('✅ Keyspace notifications ativadas.');

    await monitorExpirations()
}

module.exports = { redis, subscriber, connectRedis };
