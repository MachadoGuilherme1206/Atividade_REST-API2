const express = require('express');
const RelatorioController = require('../controllers/relatorioController');
const RelatorioMiddleware = require('../middlewares/relatorioMiddleware');

module.exports = class RelatorioRoutes {
    constructor() {
        this._router = express.Router();
        this._relatorioController = new RelatorioController();
        this._relatorioMiddleware = new RelatorioMiddleware();

        this.configurarRotas();
    }

    configurarRotas = () => {
        this._router.get(
            '/performance',
            this._relatorioMiddleware.validar_periodo,
            this._relatorioController.Relatorio_performance_controller
        );
    };

    get router() {
        return this._router;
    }
};
