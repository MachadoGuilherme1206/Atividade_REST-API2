const Banco = require('./Banco');


function formatarLinha(linha) {
    if (!linha) {
        return null;
    }
    return {
        id_vendedor: linha.id_vendedor,
        nome: linha.nome,
        meta_mensal: Number(linha.meta_mensal),
        percentual_base: Number(linha.percentual_base),
        ativo: Boolean(linha.ativo)
    };
}

module.exports = class Vendedor {
    constructor() {
        this._idVendedor = null;
        this._nome = null;
        this._metaMensal = null;
        this._percentualBase = null;
        this._ativo = true;
    }

    toJSON() {
        return {
            id_vendedor: this.idVendedor,
            nome: this.nome,
            meta_mensal: Number(this.metaMensal),
            percentual_base: Number(this.percentualBase),
            ativo: Boolean(this.ativo)
        };
    }


    async cadastrarVendedor() {
        const query = `
            INSERT INTO vendedores (nome, meta_mensal, percentual_base, ativo)
            VALUES (?, ?, ?, ?)
        `;
        try {
            const conexao = Banco.getConexao();
            const values = [this.nome, this.metaMensal, this.percentualBase, this.ativo];
            const [resposta] = await conexao.execute(query, values);

            // O id é AUTO_INCREMENT: o MySQL devolve o gerado em insertId
            this.idVendedor = resposta.insertId;
            return resposta.affectedRows > 0;
        } catch (error) {
            console.error('Erro ao cadastrar vendedor:', error.message);
            throw error;
        }
    }

    static async listarVendedores(filtros = {}) {
        let query = 'SELECT * FROM vendedores WHERE 1=1';
        const values = [];

        if (filtros.ativo !== undefined) {
            query += ' AND ativo = ?';
            values.push(filtros.ativo ? 1 : 0);
        }
        query += ' ORDER BY id_vendedor';

        try {
            const conexao = Banco.getConexao();
            const [resposta] = await conexao.execute(query, values);
            return resposta.map(formatarLinha);
        } catch (error) {
            console.error('Erro ao consultar vendedores:', error.message);
            throw error;
        }
    }

    static async consultarVendedor(idVendedor) {
        const query = 'SELECT * FROM vendedores WHERE id_vendedor = ?';
        try {
            const conexao = Banco.getConexao();
            const [resposta] = await conexao.execute(query, [idVendedor]);
            return formatarLinha(resposta[0]);
        } catch (error) {
            console.error('Erro ao consultar vendedor:', error.message);
            throw error;
        }
    }


    async atualizarVendedor() {
        const query = `
            UPDATE vendedores
            SET meta_mensal = ?, percentual_base = ?
            WHERE id_vendedor = ?
        `;
        try {
            const conexao = Banco.getConexao();
            const values = [this.metaMensal, this.percentualBase, this.idVendedor];
            await conexao.execute(query, values);

            return true;
        } catch (error) {
            console.error('Erro ao atualizar vendedor:', error.message);
            throw error;
        }
    }

    async desativarVendedor() {
        const query = 'UPDATE vendedores SET ativo = FALSE WHERE id_vendedor = ?';
        try {
            const conexao = Banco.getConexao();
            const [resposta] = await conexao.execute(query, [this.idVendedor]);
            this.ativo = false;
            return resposta.affectedRows > 0;
        } catch (error) {
            console.error('Erro ao desativar vendedor:', error.message);
            throw error;
        }
    }

    get idVendedor() {
        return this._idVendedor;
    }
    set idVendedor(idVendedor) {
        this._idVendedor = idVendedor;
    }

    get nome() {
        return this._nome;
    }
    set nome(nome) {
        this._nome = nome;
    }

    get metaMensal() {
        return this._metaMensal;
    }
    set metaMensal(metaMensal) {
        this._metaMensal = metaMensal;
    }

    get percentualBase() {
        return this._percentualBase;
    }
    set percentualBase(percentualBase) {
        this._percentualBase = percentualBase;
    }

    get ativo() {
        return this._ativo;
    }
    set ativo(ativo) {
        this._ativo = ativo;
    }
};
