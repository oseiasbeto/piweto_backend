const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");
const fs = require("fs");
const path = require("path");
const moment = require("moment");

module.exports = async function generateTicketsPDF(order, tickets, event) {
  try {
    // 1. Criar diretório temp se não existir
    const tempDir = path.join(__dirname, "..", "temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const generatedFiles = [];

    // 2. Gerar um PDF por ticket
    for (const ticket of tickets) {
      const fileName = `${ticket.code}.pdf`;
      const filePath = path.join(tempDir, fileName);
      const output = fs.createWriteStream(filePath);
      
      const doc = new PDFDocument({ size: "A4", margin: 30 });
      doc.pipe(output);

      // Configurações de estilo
      const primaryColor = "#2c3e50";
      const secondaryColor = "#3498db";

      // Cabeçalho
      doc.fillColor(primaryColor)
         .fontSize(18)
         .text(event.name, { align: "center" })
         .moveDown(0.5);

      doc.fillColor("#7f8c8d")
         .fontSize(12)
         .text(`Pedido #${order.id} • Emitido em: ${moment().format("DD/MM/YYYY HH:mm")}`, {
           align: "center",
         })
         .moveDown(1);

      // Gerar QR Code
      const qrPath = path.join(tempDir, `qrcode_${ticket.code}.png`);
      await QRCode.toFile(qrPath, ticket.code, { width: 150 });

      // Layout do ingresso
      doc.image(qrPath, 70, doc.y, { width: 150, align: "center" })
         .moveDown(1);

      doc.fillColor(primaryColor)
         .fontSize(16)
         .text(ticket?.batch?.name, { align: "center" })
         .moveDown(0.5);

      doc.fillColor("#333")
         .fontSize(12)
         .text(`Participante: ${order?.data?.full_name}`, { align: "center" })
         .text(`Data: ${moment(event?.starts_at?.date).format("DD/MM/YYYY HH:mm")}`, { align: "center" })
         .text(`Local: ${event?.address?.location || "A definir"}`, { align: "center" })
         .moveDown(1);

      doc.fillColor(secondaryColor)
         .font("Helvetica-Bold")
         .text(`Código: ${ticket.code}`, { align: "center", underline: true })
         .moveDown(2);

      doc.fillColor("#7f8c8d")
         .fontSize(10)
         .text("Apresente este QR Code na entrada do evento com documento de identificação.", { align: "center" });

      doc.end();

      // Esperar finalização do PDF
      await new Promise((resolve) => output.on("finish", resolve));
      
      // Adicionar ao array de arquivos gerados
      generatedFiles.push({
        fileName,
        filePath,
        ticketCode: ticket.code
      });

      // Remover QR Code temporário
      fs.unlinkSync(qrPath);
    }

    return generatedFiles;

  } catch (error) {
    console.error("Erro ao gerar PDFs dos ingressos:", error);
    throw error; // Propagar o erro para tratamento superior
  }
};