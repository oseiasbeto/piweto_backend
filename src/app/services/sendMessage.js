const axios = require("axios");


// Função principal para envio de emails
async function sendMessage(to, message) {
    try {
        const apiKey = process.env.WESENDER_APIKEY

        await axios.post('https://api.wesender.co.ao/envio/apikey', {
            ApiKey: apiKey,
            Destino: [`${to}`],
            Mensagem: message,
            CEspeciais: 'false'
        })
        console.log('✅ SMS enviado com sucesso!');
    } catch (err) {
        console.log("Erro ao enviar a SMS: ", err.message);
    }
}

module.exports = sendMessage