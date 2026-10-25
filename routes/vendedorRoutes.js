const express = require('express');
const VendedorController = require('../controllers/vendedorController');
const VendedorMiddleware = require('../middlewares/vendedorMiddleware');

module.exports = class VendedorRoutes {
    constructor() {
        this._router = express.Router();
        this._vendedorController = new VendedorController();
        this._vendedorMiddleware = new VendedorMiddleware();

        this.configurarRotas();
    }

    configurarRotas = () => {
        this._router.post(
            '/',
            this._vendedorMiddleware.validar_camposObrigatorios,
            this._vendedorMiddleware.validar_nome,
            this._vendedorMiddleware.validar_metaMensal,
            this._vendedorMiddleware.validar_percentualBase,
            this._vendedorController.Vendedor_cadastrar_controller
        );

        this._router.get(
            '/',
            this._vendedorMiddleware.validar_filtroAtivo,
            this._vendedorController.Vendedor_listar_controller
        );

        this._router.get(
            '/:id',
            this._vendedorMiddleware.validar_idParametro,
            this._vendedorController.Vendedor_consultar_controller
        );

        this._router.put(
            '/:id',
            this._vendedorMiddleware.validar_idParametro,
            this._vendedorMiddleware.validar_camposAtualizacao,
            this._vendedorMiddleware.validar_metaMensal,
            this._vendedorMiddleware.validar_percentualBase,
            this._vendedorController.Vendedor_atualizar_controller
        );

        this._router.patch(
            '/:id/desativar',
            this._vendedorMiddleware.validar_idParametro,
            this._vendedorController.Vendedor_desativar_controller
        );
    };

    get router() {
        return this._router;
    }
};
