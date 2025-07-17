const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");
const fs = require("fs");
const path = require("path");
const moment = require("moment");

// Configurações de design
const DESIGN = {
  colors: {
    primary: "#2c3e50",
    secondary: "#333333",
    text: "#000000",
    lightText: "#777777",
    background: "#ffffff",
    border: "#dddddd",
  },
  fonts: {
    title: "Helvetica-Bold",
    subtitle: "Helvetica-Bold",
    body: "Helvetica",
    footer: "Helvetica-Oblique",
  },
  sizes: {
    title: 22,
    subtitle: 16,
    body: 12,
    small: 10,
  },
  spacing: {
    large: 30,
    medium: 20,
    small: 10,
    afterTitle: 5,
    afterSection: 25,
  },
  qrCode: {
    size: 180,
    border: 5,
    borderRadius: 8,
  },
  logo: {
    width: 120,
    height: 40,
  },
};

// Utilitários
const sanitizeText = (text, fallback = "") => {
  if (!text || typeof text !== "string") return fallback;
  return text
    .replace(/[^\w\sÀ-ÿ.,!?@#$%^&*()_+=\[\]{}|\\:;"'<>`~-]/g, "")
    .replace(/\s{2,}/g, " ")
    .trim()
    .normalize("NFC");
};

const formatTitle = (doc, text) => {
  const maxWidth = doc.page.width - 100;
  const title = sanitizeText(text, "Evento");

  // Ajuste dinâmico do tamanho da fonte
  let fontSize = DESIGN.sizes.title;
  doc.font(DESIGN.fonts.title).fontSize(fontSize).fillColor("#000000"); // ADICIONE ESTA LINHA PARA DEFINIR A COR PRETA

  // Reduz o tamanho da fonte até o texto caber ou atingir o mínimo
  while (doc.widthOfString(title) > maxWidth && fontSize > DESIGN.sizes.body) {
    fontSize -= 1;
    doc.fontSize(fontSize);
  }

  // Quebra de linha inteligente para textos muito longos
  if (doc.widthOfString(title) > maxWidth) {
    doc.text(title, {
      width: maxWidth,
      align: "center",
      lineGap: 5,
    });
  } else {
    doc.text(title, { align: "center" });
  }

  doc.moveDown();
  return fontSize;
};

const addSection = (doc, text, options = {}) => {
  const defaults = {
    font: DESIGN.fonts.body,
    size: DESIGN.sizes.body,
    color: DESIGN.colors.text,
    align: "center",
    spacing: DESIGN.spacing.medium,
  };

  const config = { ...defaults, ...options };

  doc
    .font(config.font)
    .fontSize(config.size)
    .fillColor(config.color)
    .text(text, { align: config.align });

  doc.moveDown(config.spacing / 10);
};

module.exports = async function generateTicketsPDF(order, tickets, event) {
  const tempDir = path.join(__dirname, "..", "temp");
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const logoPath = path.join(__dirname, "..", "assets", "logo.png");
  const generatedFiles = [];

  try {
    for (const ticket of tickets) {
      const fileName = `${ticket.code}.pdf`;
      const filePath = path.join(tempDir, fileName);
      const output = fs.createWriteStream(filePath);

      const doc = new PDFDocument({
        size: "A4",
        margins: {
          top: 40,
          bottom: 40,
          left: 40,
          right: 40,
        },
        bufferPages: true,
      });

      doc.pipe(output);

      // Fundo branco
      doc
        .rect(0, 0, doc.page.width, doc.page.height)
        .fill(DESIGN.colors.background);

      // Logo centralizado
      if (fs.existsSync(logoPath)) {
        const logoX = (doc.page.width - DESIGN.logo.width) / 2;
        doc.image(logoPath, logoX, 50, {
          width: DESIGN.logo.width,
          height: DESIGN.logo.height,
        });
        doc.moveDown(8);
      }

      // Título do evento (com tratamento especial)
      const titleFontSize = formatTitle(doc, event?.name);
      doc.moveDown(DESIGN.spacing.afterTitle / (titleFontSize / 2));

      // Informações do evento
      addSection(doc, event?.address?.location || "Local a confirmar", {
        size: DESIGN.sizes.subtitle,
        color: DESIGN.colors.primary,
        spacing: 15,
      });

      const startDate = moment(event?.starts_at?.date).format("DD/MM/YYYY");
      const startTime = moment(event?.starts_at?.hm).format("HH:mm");
      addSection(doc, `Data: ${startDate} às ${startTime}`);

      // Área/Lote
      addSection(doc, ticket?.batch?.name || "Área Geral", {
        font: DESIGN.fonts.subtitle,
        size: DESIGN.sizes.subtitle,
        color: DESIGN.colors.secondary,
        spacing: 15,
      });

      // QR Code centralizado com borda
      const qrPath = path.join(tempDir, `qrcode_${ticket.code}.png`);
      await QRCode.toFile(qrPath, ticket.code, {
        width: DESIGN.qrCode.size,
        errorCorrectionLevel: "H",
      });

      const qrTotalSize = DESIGN.qrCode.size + DESIGN.qrCode.border * 2;
      const qrX = (doc.page.width - qrTotalSize) / 2;
      const qrY = doc.y;

      doc
        .roundedRect(
          qrX,
          qrY,
          qrTotalSize,
          qrTotalSize,
          DESIGN.qrCode.borderRadius
        )
        .fillAndStroke(DESIGN.colors.background, DESIGN.colors.border);

      doc.image(
        qrPath,
        qrX + DESIGN.qrCode.border,
        qrY + DESIGN.qrCode.border,
        {
          width: DESIGN.qrCode.size,
          height: DESIGN.qrCode.size,
        }
      );

      doc.y += qrTotalSize + DESIGN.spacing.medium;

      // Informações do participante
      addSection(doc, `Código: ${ticket.code}`, {
        spacing: DESIGN.spacing.small,
      });

      addSection(
        doc,
        `Participante: ${order?.data?.full_name || "Nome não informado"}`,
        {
          spacing: DESIGN.spacing.afterSection,
        }
      );

      // Instruções
      addSection(doc, "Instruções:", {
        font: DESIGN.fonts.subtitle,
        size: DESIGN.sizes.small,
        color: DESIGN.colors.primary,
        spacing: DESIGN.spacing.small,
      });

      const instructions = [
        "• Não compartilhe seu ingresso com outras pessoas",
        "• Pode ser apresentado digitalmente ou impresso",
        "• Chegue com antecedência ao local do evento",
        "• Não compre ingressos de terceiros",
        "• Use apenas a plataforma oficial",
      ];

      instructions.forEach((text) => {
        addSection(doc, text, {
          size: DESIGN.sizes.small,
          color: DESIGN.colors.lightText,
          spacing: 5,
        });
      });

      // Rodapé
      // doc.moveDown(DESIGN.spacing.medium);
      addSection(doc, "www.piweto.it.ao", {
        font: DESIGN.fonts.footer,
        size: DESIGN.sizes.small,
        color: DESIGN.colors.lightText,
      });

      doc.end();
      await new Promise((resolve) => output.on("finish", resolve));
      generatedFiles.push({ fileName, filePath, ticketCode: ticket.code });
      fs.unlinkSync(qrPath);
    }

    return generatedFiles;
  } catch (error) {
    console.error("Erro na geração de ingressos:", error);
    // Limpeza de arquivos temporários em caso de erro
    generatedFiles.forEach((file) => {
      try {
        fs.unlinkSync(file.filePath);
      } catch (e) {}
    });
    throw error;
  }
};
