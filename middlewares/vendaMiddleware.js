const { normalizarDataHora } = require('../utils/data');

// data_venda não está aqui: se não vier, a venda é registrada com a data/hora atual
const CAMPOS_OBRIGATORIOS = [
    { nome: 'id_venda', rotulo: 'O código da venda (id_venda) é obrigatório' },
    { nome: 'id_vendedor', rotulo: 'O vendedor (id_vendedor) é obrigatório' },
    { nome: 'id_regiao', rotulo: 'A região (id_regiao) é obrigatória' },
    { nome: 'valor_venda', rotulo: 'O valor da venda é obrigatório' },
    { nome: 'tipo_cliente', rotulo: 'O tipo de cliente é obrigatório' }
];

function naoEnviado(valor) {
    return valor === undefined || valor === null;
}

// Number('') e Number(true) dão 0 e 1; aqui só passam números ou textos numéricos
function converterNumero(valor) {
    if (typeof valor === 'number') {
        return valor;
    }
    if (typeof valor === 'string' && valor.trim() !== '') {
        return Number(valor);
    }
    return NaN;
}

function ehInteiroPositivo(valor) {
    const numero = converterNumero(valor);
    return Number.isInteger(numero) && numero > 0;
}

module.exports = class VendaMiddleware {

    // Usado nas rotas /vendas/:id, /vendas/vendedor/:id e /vendas/regiao/:id
    validar_idParametro = (request, response, next) => {
        if (!ehInteiroPositivo(request.params.id)) {
            return response.status(400).send({
                status: false,
                error: 'O código informado na URL deve ser um número inteiro positivo'
            });
        }

        next();
    }

    validar_camposObrigatorios = (request, response, next) => {
        for (let i = 0; i < CAMPOS_OBRIGATORIOS.length; i++) {
            const campo = CAMPOS_OBRIGATORIOS[i];

            if (naoEnviado(request.body[campo.nome])) {
                return response.status(400).send({
                    status: false,
                    error: campo.rotulo
                });
            }
        }

        next();
    }

    validar_idVenda = (request, response, next) => {
        if (!ehInteiroPositivo(request.body.id_venda)) {
            return response.status(400).send({
                status: false,
                error: 'O código da venda deve ser um número inteiro positivo'
            });
        }

        next();
    }

    validar_idVendedor = (request, response, next) => {
        if (!ehInteiroPositivo(request.body.id_vendedor)) {
            return response.status(400).send({
                status: false,
                error: 'O código do vendedor deve ser um número inteiro positivo'
            });
        }

        next();
    }

    validar_idRegiao = (request, response, next) => {
        if (!ehInteiroPositivo(request.body.id_regiao)) {
            return response.status(400).send({
                status: false,
                error: 'O código da região deve ser um número inteiro positivo'
            });
        }

        next();
    }

    validar_valorVenda = (request, response, next) => {
        const valorVenda = converterNumero(request.body.valor_venda);

        if (isNaN(valorVenda)) {
            return response.status(400).send({
                status: false,
                error: 'O valor da venda deve ser um número'
            });
        }

        if (valorVenda <= 0) {
            return response.status(400).send({
                status: false,
                error: 'O valor da venda deve ser maior que zero'
            });
        }

        next();
    }

    // Aceita "pf", "Pf" ou "PF" e já deixa em maiúsculas para o resto do fluxo
    validar_tipoCliente = (request, response, next) => {
        const tipoCliente = String(request.body.tipo_cliente).trim().toUpperCase();

        switch (tipoCliente) {
            case 'PF':
            case 'PJ':
                request.body.tipo_cliente = tipoCliente;
                return next();
            default:
                return response.status(400).send({
                    status: false,
                    error: 'Tipo de cliente inválido. Use PF (Pessoa Física) ou PJ (Pessoa Jurídica)'
                });
        }
    }

    validar_dataVenda = (request, response, next) => {
        if (naoEnviado(request.body.data_venda)) {
            return next();
        }

        const dataVenda = normalizarDataHora(request.body.data_venda);

        if (!dataVenda) {
            return response.status(400).send({
                status: false,
                error: 'Data da venda inválida. Use o formato AAAA-MM-DD HH:MM:SS'
            });
        }

        // Já segue no formato que o DATETIME do MySQL espera
        request.body.data_venda = dataVenda;
        next();
    }
};
