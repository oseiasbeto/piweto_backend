function formatAmount(amount) {
    // Converte o número para string
    let amountStr = amount.toString();

    // Define a parte inteira e decimal
    let [integerPart, decimalPart] = amountStr.split('.');

    // Adiciona separadores de milhar com pontos
    let formattedInteger = '';
    let count = 0;

    // Percorre a parte inteira do número da direita para a esquerda
    for (let i = integerPart.length - 1; i >= 0; i--) {
        count++;
        formattedInteger = integerPart[i] + formattedInteger;

        // Adiciona o ponto a cada 3 dígitos
        if (count % 3 === 0 && i !== 0) {
            formattedInteger = '.' + formattedInteger;
        }
    }

    // Combina a parte inteira com a parte decimal, se existir
    let formattedAmount = formattedInteger + (decimalPart ? ',' + decimalPart : '') + ' Kz';

    return formattedAmount;
}
module.exports = formatAmount