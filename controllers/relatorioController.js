const Relatorio = require('../models/Relatorio');
const responderErro = require('../utils/responderErro');

module.exports = class RelatorioController {
    Relatorio_performance_controller = async (req, res) => {
        try {
            // Período já validado e normalizado pelo RelatorioMiddleware
            const { inicio, fim } = req.periodo;

            const relatorio = await Relatorio.gerarRelatorioPerformance(inicio, fim);

            return res.status(200).send({
                status: true,
                message: 'Relatório gerado com sucesso',
                relatorio
            });
        } catch (error) {
            return responderErro(res, error, 'Erro ao gerar relatório de performance');
        }
    }
};
