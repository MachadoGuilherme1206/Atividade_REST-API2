const mysql = require('mysql2/promise');

module.exports = class Banco {

    static HOST = process.env.DB_HOST || '127.0.0.1';
    static USER = process.env.DB_USER || 'root';
    static PASSWORD = process.env.DB_PASSWORD || '';
    static DATABASE = process.env.DB_DATABASE || 'db_vendas';
    static PORT = Number(process.env.DB_PORT) || 3306;
    static POOL = null;


    static getConexao() {
        if (Banco.POOL == null) {
            Banco.POOL = mysql.createPool({
                host: Banco.HOST,
                user: Banco.USER,
                password: Banco.PASSWORD,
                database: Banco.DATABASE,
                port: Banco.PORT,
                waitForConnections: true,
                connectionLimit: 10,
                // O MySQL devolve DECIMAL como string ("180.00"); com isso volta como número
                decimalNumbers: true,
                dateStrings: true
            });
        }
        return Banco.POOL;
    }

    static async testarConexao() {
        try {
            const conexao = Banco.getConexao();
            await conexao.query('SELECT 1');
            console.log(`Conectado ao MySQL (${Banco.HOST}:${Banco.PORT}/${Banco.DATABASE})`);
            return true;
        } catch (error) {
            const objResposta = {
                msg: 'Erro ao conectar ao banco de dados',
                erro: error.message
            };
            console.error(objResposta);
            return false;
        }
    }
};
