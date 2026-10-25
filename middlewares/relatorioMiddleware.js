const { normalizarData } = require('../utils/data');

module.exports = class RelatorioMiddleware {

    // GET /relatorios/performance?inicio=2026-10-01&fim=2026-10-31
    validar_periodo = (request, response, next) => {
        const { inicio, fim } = request.query;

        if (!inicio || !fim) {
            return response.status(400).send({
                status: false,
                error: 'Informe o período com ?inicio=AAAA-MM-DD&fim=AAAA-MM-DD'
            });
        }

        const dataInicio = normalizarData(inicio);
        const dataFim = normalizarData(fim);

        if (!dataInicio || !dataFim) {
            return response.status(400).send({
                status: false,
                error: 'Datas inválidas. Use o formato AAAA-MM-DD'
            });
        }

        // No formato AAAA-MM-DD a comparação de texto já segue a ordem das datas
        if (dataInicio > dataFim) {
            return response.status(400).send({
                status: false,
                error: 'A data inicial não pode ser posterior à data final'
            });
        }

        // No Express 5 o request.query é somente leitura (é recalculado a cada acesso),
        // então o período validado segue para o controller em request.periodo
        request.periodo = { inicio: dataInicio, fim: dataFim };
        next();
    }
};
