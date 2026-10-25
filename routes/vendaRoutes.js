const express = require('express');
const VendaController = require('../controllers/vendaController');
const VendaMiddleware = require('../middlewares/vendaMiddleware');

module.exports = class VendaRoutes {
    constructor() {
        this._router = express.Router();
        this._vendaController = new VendaController();
        this._vendaMiddleware = new VendaMiddleware();

        this.configurarRotas();
    }

    configurarRotas = () => {
        this._router.post(
            '/',
            this._vendaMiddleware.validar_camposObrigatorios,
            this._vendaMiddleware.validar_idVenda,
            this._vendaMiddleware.validar_idVendedor,
            this._vendaMiddleware.validar_idRegiao,
            this._vendaMiddleware.validar_valorVenda,
            this._vendaMiddleware.validar_tipoCliente,
            this._vendaMiddleware.validar_dataVenda,
            this._vendaController.Venda_registrar_controller
        );

        this._router.get('/', this._vendaController.Venda_listar_controller);

        this._router.get(
            '/vendedor/:id',
            this._vendaMiddleware.validar_idParametro,
            this._vendaController.Venda_porVendedor_controller
        );

        this._router.get(
            '/regiao/:id',
            this._vendaMiddleware.validar_idParametro,
            this._vendaController.Venda_porRegiao_controller
        );

        this._router.delete(
            '/:id',
            this._vendaMiddleware.validar_idParametro,
            this._vendaController.Venda_excluir_controller
        );
    };

    get router() {
        return this._router;
    }
};
