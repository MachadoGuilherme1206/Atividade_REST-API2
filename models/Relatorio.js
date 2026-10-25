const Banco = require('./Banco');
const { arredondarDinheiro } = require('../utils/comissao');


const FILTRO_PERIODO = 'v.data_venda >= ? AND v.data_venda < DATE_ADD(?, INTERVAL 1 DAY)';

// Indicadores gerais: quantidade, valor total, comissão total e comissão média por venda
async function consultarTotais(conexao, periodo) {
    const query = `
        SELECT COUNT(*) AS total_vendas,
               COALESCE(SUM(v.valor_venda), 0) AS valor_total,
               COALESCE(SUM(v.valor_comissao), 0) AS comissao_total,
               COALESCE(AVG(v.valor_comissao), 0) AS comissao_media
        FROM vendas v
        WHERE ${FILTRO_PERIODO}
    `;
    const [resposta] = await conexao.execute(query, periodo);
    return resposta[0];
}


async function consultarPorRegiao(conexao, periodo) {
    const query = `
        SELECT r.id_regiao, r.nome_regiao,
               COUNT(v.id_venda) AS quantidade_vendas,
               COALESCE(SUM(v.valor_venda), 0) AS valor_total,
               COALESCE(AVG(v.valor_comissao), 0) AS comissao_media
        FROM regioes r
        LEFT JOIN vendas v ON v.id_regiao = r.id_regiao AND ${FILTRO_PERIODO}
        GROUP BY r.id_regiao, r.nome_regiao
        ORDER BY r.id_regiao
    `;
    const [resposta] = await conexao.execute(query, periodo);
    return resposta;
}

async function consultarPorTipoCliente(conexao, periodo) {
    const query = `
        SELECT v.tipo_cliente,
               COUNT(*) AS quantidade_vendas,
               SUM(v.valor_venda) AS valor_total
        FROM vendas v
        WHERE ${FILTRO_PERIODO}
        GROUP BY v.tipo_cliente
    `;
    const [resposta] = await conexao.execute(query, periodo);
    return resposta;
}


async function consultarTopVendedor(conexao, periodo, coluna) {
    const query = `
        SELECT vd.id_vendedor, vd.nome,
               COUNT(v.id_venda) AS quantidade_vendas,
               SUM(v.valor_venda) AS valor_total,
               SUM(v.valor_comissao) AS comissao_total
        FROM vendas v
        INNER JOIN vendedores vd ON vd.id_vendedor = v.id_vendedor
        WHERE ${FILTRO_PERIODO}
        GROUP BY vd.id_vendedor, vd.nome
        ORDER BY SUM(v.${coluna}) DESC, vd.id_vendedor
        LIMIT 1
    `;
    const [resposta] = await conexao.execute(query, periodo);
    return resposta[0] || null;
}


async function consultarMetas(conexao, periodo) {
    const query = `
        SELECT DATE_FORMAT(v.data_venda, '%Y-%m') AS mes,
               vd.id_vendedor, vd.nome, vd.meta_mensal,
               SUM(v.valor_venda) AS total_vendido
        FROM vendas v
        INNER JOIN vendedores vd ON vd.id_vendedor = v.id_vendedor
        WHERE ${FILTRO_PERIODO}
        GROUP BY DATE_FORMAT(v.data_venda, '%Y-%m'), vd.id_vendedor, vd.nome, vd.meta_mensal
        ORDER BY mes, total_vendido DESC
    `;
    const [resposta] = await conexao.execute(query, periodo);
    return resposta;
}

function formatarVendedor(linha) {
    if (!linha) {
        return null;
    }
    return {
        id_vendedor: linha.id_vendedor,
        nome: linha.nome,
        quantidade_vendas: Number(linha.quantidade_vendas),
        valor_total: arredondarDinheiro(Number(linha.valor_total)),
        comissao_total: arredondarDinheiro(Number(linha.comissao_total))
    };
}

function montarMetas(linhas) {
    const meses = {};

    for (let i = 0; i < linhas.length; i++) {
        const linha = linhas[i];
        const totalVendido = Number(linha.total_vendido);
        const metaMensal = Number(linha.meta_mensal);
        const atingiu = totalVendido >= metaMensal;

        if (!meses[linha.mes]) {
            meses[linha.mes] = {
                mes: linha.mes,
                quantidade_atingiram: 0,
                vendedores: []
            };
        }

        if (atingiu) {
            meses[linha.mes].quantidade_atingiram++;
        }

        meses[linha.mes].vendedores.push({
            id_vendedor: linha.id_vendedor,
            nome: linha.nome,
            meta_mensal: metaMensal,
            total_vendido: arredondarDinheiro(totalVendido),
            percentual_atingido: arredondarDinheiro(totalVendido / metaMensal * 100),
            atingiu_meta: atingiu
        });
    }

    const porMes = Object.values(meses);
    let totalAtingidas = 0;
    for (let i = 0; i < porMes.length; i++) {
        totalAtingidas += porMes[i].quantidade_atingiram;
    }

    return {
        total_metas_atingidas: totalAtingidas,
        por_mes: porMes
    };
}

module.exports = class Relatorio {
    static async gerarRelatorioPerformance(inicio, fim) {
        const periodo = [inicio, fim];

        try {
            const conexao = Banco.getConexao();

            // As consultas são independentes entre si: rodam em paralelo no pool
            const [totais, porRegiao, porTipoCliente, melhorVendedor, maiorComissao, metas] = await Promise.all([
                consultarTotais(conexao, periodo),
                consultarPorRegiao(conexao, periodo),
                consultarPorTipoCliente(conexao, periodo),
                consultarTopVendedor(conexao, periodo, 'valor_venda'),
                consultarTopVendedor(conexao, periodo, 'valor_comissao'),
                consultarMetas(conexao, periodo)
            ]);

            // PF e PJ aparecem sempre, mesmo que um deles não tenha vendas no período
            const vendasPorTipoCliente = {
                PF: { quantidade_vendas: 0, valor_total: 0 },
                PJ: { quantidade_vendas: 0, valor_total: 0 }
            };
            for (let i = 0; i < porTipoCliente.length; i++) {
                const linha = porTipoCliente[i];
                vendasPorTipoCliente[linha.tipo_cliente] = {
                    quantidade_vendas: Number(linha.quantidade_vendas),
                    valor_total: arredondarDinheiro(Number(linha.valor_total))
                };
            }

            return {
                periodo: { inicio, fim },
                total_vendas: Number(totais.total_vendas),
                valor_total_vendido: arredondarDinheiro(Number(totais.valor_total)),
                comissao_total: arredondarDinheiro(Number(totais.comissao_total)),
                vendas_por_regiao: porRegiao.map((linha) => ({
                    id_regiao: linha.id_regiao,
                    nome_regiao: linha.nome_regiao,
                    quantidade_vendas: Number(linha.quantidade_vendas),
                    valor_total: arredondarDinheiro(Number(linha.valor_total))
                })),
                vendas_por_tipo_cliente: vendasPorTipoCliente,
                melhor_vendedor: formatarVendedor(melhorVendedor),
                maior_comissao: formatarVendedor(maiorComissao),
                metas_atingidas: montarMetas(metas),
                comissao_media_geral: arredondarDinheiro(Number(totais.comissao_media)),
                comissao_media_por_regiao: porRegiao.map((linha) => ({
                    id_regiao: linha.id_regiao,
                    nome_regiao: linha.nome_regiao,
                    comissao_media: arredondarDinheiro(Number(linha.comissao_media))
                }))
            };
        } catch (error) {
            console.error('Erro ao gerar relatório de performance:', error.message);
            throw error;
        }
    }
};
