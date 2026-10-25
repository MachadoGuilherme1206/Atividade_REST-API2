const Banco = require('./Banco');

// As regiões são fixas (cadastradas pelo script SQL); a API só as consulta
module.exports = class Regiao {
    static async consultarRegiao(idRegiao) {
        const query = 'SELECT * FROM regioes WHERE id_regiao = ?';
        try {
            const conexao = Banco.getConexao();
            const [resposta] = await conexao.execute(query, [idRegiao]);
            if (!resposta[0]) {
                return null;
            }
            return {
                id_regiao: resposta[0].id_regiao,
                nome_regiao: resposta[0].nome_regiao,
                percentual_bonus: Number(resposta[0].percentual_bonus)
            };
        } catch (error) {
            console.error('Erro ao consultar região:', error.message);
            throw error;
        }
    }
};
