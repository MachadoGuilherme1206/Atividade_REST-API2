
const CAMPOS_OBRIGATORIOS = [
    { nome: 'nome', rotulo: 'O nome do vendedor é obrigatório' },
    { nome: 'meta_mensal', rotulo: 'A meta mensal é obrigatória' },
    { nome: 'percentual_base', rotulo: 'O percentual base é obrigatório' }
];

function naoEnviado(valor) {
    return valor === undefined || valor === null;
}

function converterNumero(valor) {
    if (typeof valor === 'number') {
        return valor;
    }
    if (typeof valor === 'string' && valor.trim() !== '') {
        return Number(valor);
    }
    return NaN;
}

module.exports = class VendedorMiddleware {

    validar_idParametro = (request, response, next) => {
        const id = converterNumero(request.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return response.status(400).send({
                status: false,
                error: 'O código do vendedor deve ser um número inteiro positivo'
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

    // O PUT só altera meta e percentual; sem nenhum dos dois não há o que atualizar
    validar_camposAtualizacao = (request, response, next) => {
        if (naoEnviado(request.body.meta_mensal) && naoEnviado(request.body.percentual_base)) {
            return response.status(400).send({
                status: false,
                error: 'Informe meta_mensal e/ou percentual_base para atualizar'
            });
        }

        next();
    }

    validar_nome = (request, response, next) => {
        const nome = request.body.nome;

        if (naoEnviado(nome)) {
            return next();
        }

        if (typeof nome !== 'string' || nome.trim() === '') {
            return response.status(400).send({
                status: false,
                error: 'O nome do vendedor é obrigatório'
            });
        }

        if (nome.trim().length > 100) {
            return response.status(400).send({
                status: false,
                error: 'O nome do vendedor deve ter no máximo 100 caracteres'
            });
        }

        next();
    }

    validar_metaMensal = (request, response, next) => {
        if (naoEnviado(request.body.meta_mensal)) {
            return next();
        }

        const metaMensal = converterNumero(request.body.meta_mensal);

        if (isNaN(metaMensal)) {
            return response.status(400).send({
                status: false,
                error: 'A meta mensal deve ser um número'
            });
        }

        if (metaMensal <= 0) {
            return response.status(400).send({
                status: false,
                error: 'A meta mensal deve ser maior que zero'
            });
        }

        next();
    }

    validar_percentualBase = (request, response, next) => {
        if (naoEnviado(request.body.percentual_base)) {
            return next();
        }

        const percentualBase = converterNumero(request.body.percentual_base);

        if (isNaN(percentualBase)) {
            return response.status(400).send({
                status: false,
                error: 'O percentual base deve ser um número'
            });
        }

        if (percentualBase < 0 || percentualBase > 100) {
            return response.status(400).send({
                status: false,
                error: 'O percentual base deve estar entre 0 e 100'
            });
        }

        next();
    }


    validar_filtroAtivo = (request, response, next) => {
        const ativo = request.query.ativo;

        if (naoEnviado(ativo)) {
            return next();
        }

        if (!['true', 'false', '1', '0'].includes(String(ativo).toLowerCase())) {
            return response.status(400).send({
                status: false,
                error: 'O filtro ativo deve ser true ou false'
            });
        }

        next();
    }
};
