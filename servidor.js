const express = require('express');
const Banco = require('./models/Banco');
const VendedorRoutes = require('./routes/vendedorRoutes');
const VendaRoutes = require('./routes/vendaRoutes');
const RelatorioRoutes = require('./routes/relatorioRoutes');

module.exports = class Servidor {
  constructor() {
    this._app = express();
    this._porta = Number(process.env.PORTA) || 3000;

    this._app.use(express.json());

    this._vendedorRoutes = new VendedorRoutes();
    this._vendaRoutes = new VendaRoutes();
    this._relatorioRoutes = new RelatorioRoutes();

    this.configurarRotas();
    this.configurarErros();
  }

  configurarRotas = () => {
    this._app.use('/vendedores', this._vendedorRoutes.router);
    this._app.use('/vendas', this._vendaRoutes.router);
    this._app.use('/relatorios', this._relatorioRoutes.router);
  };

  // Sem estes handlers o Express responderia em HTML; a API responde sempre em JSON
  configurarErros = () => {
    this._app.use((request, response) => {
      response.status(404).send({
        status: false,
        message: `Rota ${request.method} ${request.originalUrl} não encontrada`
      });
    });

    this._app.use((error, request, response, next) => {
      // Corpo da requisição com JSON mal formado
      if (error.type === 'entity.parse.failed') {
        return response.status(400).send({
          status: false,
          error: 'O corpo da requisição não é um JSON válido'
        });
      }

      console.error('Erro não tratado:', error);
      return response.status(500).send({
        status: false,
        message: 'Erro interno do servidor'
      });
    });
  };

  iniciar = async () => {
    // A API sobe mesmo com o banco fora do ar: nesse caso cada requisição
    // responde 500, e o aviso abaixo já indica o problema no terminal
    await Banco.testarConexao();

    // No Express 5 este callback também é chamado quando a porta falha (ex.: já em uso)
    this._app.listen(this._porta, (error) => {
      if (error) {
        console.error(`Não foi possível iniciar o servidor na porta ${this._porta}:`, error.message);
        process.exit(1);
      }
      console.log(`Servidor rodando na porta ${this._porta}`);
    });
  };
};
