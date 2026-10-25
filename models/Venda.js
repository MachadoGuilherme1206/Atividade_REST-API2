const Banco = require('./Banco');
const Vendedor = require('./Vendedor');
const Regiao = require('./Regiao');
const ErroNegocio = require('../utils/ErroNegocio');
const { calcularComissao } = require('../utils/comissao');

// SELECT base das consultas de venda: o JOIN traz o nome do vendedor e da região,
// para a resposta não mostrar só os ids
const SELECT_VENDAS = `
    SELECT v.id_venda, v.id_vendedor, vd.nome AS nome_vendedor,
           v.id_regiao, r.nome_regiao, v.data_venda, v.valor_venda,
           v.tipo_cliente, v.valor_comissao
    FROM vendas v
    INNER JOIN vendedores vd ON vd.id_vendedor = v.id_vendedor
    INNER JOIN regioes r ON r.id_regiao = v.id_regiao
`;

function formatarLinha(linha) {
    if (!linha) {
        return null;
    }
    return {
        id_venda: linha.id_venda,
        id_vendedor: linha.id_vendedor,
        nome_vendedor: linha.nome_vendedor,
        id_regiao: linha.id_regiao,
        nome_regiao: linha.nome_regiao,
        data_venda: linha.data_venda,
        valor_venda: Number(linha.valor_venda),
        tipo_cliente: linha.tipo_cliente,
        valor_comissao: Number(linha.valor_comissao)
    };
}

module.exports = class Venda {
    constructor() {
        this._idVenda = null;
        this._idVendedor = null;
        this._idRegiao = null;
        this._dataVenda = null;
        this._valorVenda = null;
        this._tipoCliente = null;
        this._valorComissao = null;
    }

    toJSON() {
        return {
            id_venda: this.idVenda,
            id_vendedor: this.idVendedor,
            id_regiao: this.idRegiao,
            data_venda: this.dataVenda,
            valor_venda: Number(this.valorVenda),
            tipo_cliente: this.tipoCliente,
            valor_comissao: Number(this.valorComissao)
        };
    }


    async registrarVenda() {
        try {
            if (Number(this.valorVenda) <= 0) {
                throw new ErroNegocio('O valor da venda deve ser maior que zero', 400);
            }

            const vendaExistente = await Venda.consultarVenda(this.idVenda);
            if (vendaExistente) {
                throw new ErroNegocio(`Já existe uma venda cadastrada com o código ${this.idVenda}`, 400);
            }

            const vendedor = await Vendedor.consultarVendedor(this.idVendedor);
            if (!vendedor) {
                throw new ErroNegocio(`Vendedor ${this.idVendedor} não encontrado`, 404);
            }
            if (!vendedor.ativo) {
                throw new ErroNegocio(`O vendedor ${vendedor.nome} está inativo e não pode registrar vendas`, 400);
            }

            const regiao = await Regiao.consultarRegiao(this.idRegiao);
            if (!regiao) {
                throw new ErroNegocio(`Região ${this.idRegiao} não encontrada`, 404);
            }

            const comissao = calcularComissao(
                this.valorVenda,
                vendedor.percentual_base,
                this.tipoCliente,
                regiao.percentual_bonus
            );
            this.valorComissao = comissao.valorComissao;

            // Sem data no corpo, a venda é registrada com a data e hora atuais
            const query = `
                INSERT INTO vendas
                    (id_venda, id_vendedor, id_regiao, data_venda, valor_venda, tipo_cliente, valor_comissao)
                VALUES (?, ?, ?, COALESCE(?, NOW()), ?, ?, ?)
            `;
            const values = [
                this.idVenda,
                this.idVendedor,
                this.idRegiao,
                this.dataVenda,
                this.valorVenda,
                this.tipoCliente,
                this.valorComissao
            ];

            const conexao = Banco.getConexao();
            await conexao.execute(query, values);

            return comissao;
        } catch (error) {
            // Duas requisições com o mesmo código ao mesmo tempo podem passar pela
            // checagem acima; a chave primária barra a segunda, e aqui vira um 400
            if (error.code === 'ER_DUP_ENTRY') {
                throw new ErroNegocio(`Já existe uma venda cadastrada com o código ${this.idVenda}`, 400);
            }
            if (!(error instanceof ErroNegocio)) {
                console.error('Erro ao registrar venda:', error.message);
            }
            throw error;
        }
    }

    static async listarVendas() {
        const query = `${SELECT_VENDAS} ORDER BY v.data_venda, v.id_venda`;
        try {
            const conexao = Banco.getConexao();
            const [resposta] = await conexao.execute(query);
            return resposta.map(formatarLinha);
        } catch (error) {
            console.error('Erro ao consultar vendas:', error.message);
            throw error;
        }
    }

    static async consultarVenda(idVenda) {
        const query = `${SELECT_VENDAS} WHERE v.id_venda = ?`;
        try {
            const conexao = Banco.getConexao();
            const [resposta] = await conexao.execute(query, [idVenda]);
            return formatarLinha(resposta[0]);
        } catch (error) {
            console.error('Erro ao consultar venda:', error.message);
            throw error;
        }
    }

    static async consultarVendasPorVendedor(idVendedor) {
        const query = `${SELECT_VENDAS} WHERE v.id_vendedor = ? ORDER BY v.data_venda, v.id_venda`;
        try {
            const conexao = Banco.getConexao();
            const [resposta] = await conexao.execute(query, [idVendedor]);
            return resposta.map(formatarLinha);
        } catch (error) {
            console.error('Erro ao consultar vendas do vendedor:', error.message);
            throw error;
        }
    }

    static async consultarVendasPorRegiao(idRegiao) {
        const query = `${SELECT_VENDAS} WHERE v.id_regiao = ? ORDER BY v.data_venda, v.id_venda`;
        try {
            const conexao = Banco.getConexao();
            const [resposta] = await conexao.execute(query, [idRegiao]);
            return resposta.map(formatarLinha);
        } catch (error) {
            console.error('Erro ao consultar vendas da região:', error.message);
            throw error;
        }
    }

    async excluirVenda() {
        const query = 'DELETE FROM vendas WHERE id_venda = ?';
        try {
            const conexao = Banco.getConexao();
            const [resposta] = await conexao.execute(query, [this.idVenda]);
            return resposta.affectedRows > 0;
        } catch (error) {
            console.error('Erro ao excluir venda:', error.message);
            throw error;
        }
    }

    get idVenda() {
        return this._idVenda;
    }
    set idVenda(idVenda) {
        this._idVenda = idVenda;
    }

    get idVendedor() {
        return this._idVendedor;
    }
    set idVendedor(idVendedor) {
        this._idVendedor = idVendedor;
    }

    get idRegiao() {
        return this._idRegiao;
    }
    set idRegiao(idRegiao) {
        this._idRegiao = idRegiao;
    }

    get dataVenda() {
        return this._dataVenda;
    }
    set dataVenda(dataVenda) {
        this._dataVenda = dataVenda;
    }

    get valorVenda() {
        return this._valorVenda;
    }
    set valorVenda(valorVenda) {
        this._valorVenda = valorVenda;
    }

    get tipoCliente() {
        return this._tipoCliente;
    }
    set tipoCliente(tipoCliente) {
        this._tipoCliente = tipoCliente;
    }

    get valorComissao() {
        return this._valorComissao;
    }
    set valorComissao(valorComissao) {
        this._valorComissao = valorComissao;
    }
};
