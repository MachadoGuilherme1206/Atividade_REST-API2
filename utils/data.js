
const FORMATO_DATA = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/;


function normalizarDataHora(valor) {
    const partes = FORMATO_DATA.exec(String(valor).trim());
    if (!partes) {
        return null;
    }

    const ano = Number(partes[1]);
    const mes = Number(partes[2]);
    const dia = Number(partes[3]);
    const hora = Number(partes[4] || 0);
    const minuto = Number(partes[5] || 0);
    const segundo = Number(partes[6] || 0);

    const data = new Date(Date.UTC(ano, mes - 1, dia, hora, minuto, segundo));
    const valida =
        data.getUTCFullYear() === ano &&
        data.getUTCMonth() === mes - 1 &&
        data.getUTCDate() === dia &&
        data.getUTCHours() === hora &&
        data.getUTCMinutes() === minuto &&
        data.getUTCSeconds() === segundo;

    if (!valida) {
        return null;
    }

    const doisDigitos = (n) => String(n).padStart(2, '0');
    return `${ano}-${doisDigitos(mes)}-${doisDigitos(dia)} ` +
        `${doisDigitos(hora)}:${doisDigitos(minuto)}:${doisDigitos(segundo)}`;
}

function normalizarData(valor) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(valor).trim())) {
        return null;
    }
    const dataHora = normalizarDataHora(valor);
    return dataHora ? dataHora.substring(0, 10) : null;
}

module.exports = {
    normalizarDataHora,
    normalizarData
};
