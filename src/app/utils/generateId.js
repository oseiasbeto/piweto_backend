function generateId() {
  // Gera um número entre 100000 e 999999 (nunca começará com 0)
  const code = Math.floor(100000 + Math.random() * 900000);
  return code.toString(); // Retorna como string (ex: "742813")
}

module.exports = generateId;