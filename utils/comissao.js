
const BONUS_TIPO_CLIENTE = {
    PF: 2,
    PJ: 3
};


function arredondarDinheiro(valor) {
    return Math.round((valor + Number.EPSILON) * 100) / 100;
}


function calcularComissao(valorVenda, percentualBase, tipoCliente, percentualRegiao) {
    const percentualCliente = BONUS_TIPO_CLIENTE[tipoCliente];

    if (percentualCliente === undefined) {
        throw new Error(`Tipo de cliente inválido para cálculo de comissão: ${tipoCliente}`);
    }

    const percentualTotal = Number(percentualBase) + percentualCliente + Number(percentualRegiao);

    return {
        percentualBase: Number(percentualBase),
        percentualCliente,
        percentualRegiao: Number(percentualRegiao),
        percentualTotal,
        valorComissao: arredondarDinheiro(Number(valorVenda) * percentualTotal / 100)
    };
}

module.exports = {
    BONUS_TIPO_CLIENTE,
    arredondarDinheiro,
    calcularComissao
};
