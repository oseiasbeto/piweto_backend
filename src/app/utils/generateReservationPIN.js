function generateReservationPIN() {
  // Gera um número aleatório de 4 dígitos (entre 0000 e 9999)
  const pin = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0"); // Garante 4 dígitos (preenche com zeros à esquerda se necessário)

  return pin; // Retorna apenas o PIN (ex: "0427")
}

module.exports = generateReservationPIN;