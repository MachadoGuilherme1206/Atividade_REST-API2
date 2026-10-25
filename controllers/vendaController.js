const Venda = require('../models/Venda');
const Vendedor = require('../models/Vendedor');
const Regiao = require('../models/Regiao');
const responderErro = require('../utils/responderErro');

module.exports = class VendaController {
    Venda_registrar_controller = async (req, res) => {
        try {
            const venda = new Venda();
            venda.idVenda = Number(req.body.id_venda);
            venda.idVendedor = Number(req.body.id_vendedor);
            venda.idRegiao = Number(req.body.id_regiao);
            venda.valorVenda = Number(req.body.valor_venda);
            venda.tipoCliente = req.body.tipo_cliente;
            venda.dataVenda = req.body.data_venda || null;

            // registrarVenda valida vendedor/região/código, calcula a comissão e grava
            const comissao = await venda.registrarVenda();

            // Relê do banco para devolver a venda completa (com nomes e a data gravada)
            const vendaRegistrada = await Venda.consultarVenda(venda.idVenda);

            return res.status(201).send({
                status: true,
                message: 'Venda registrada com sucesso',
                venda: vendaRegistrada,
                comissao: {
                    percentual_base: comissao.percentualBase,
                    percentual_cliente: comissao.percentualCliente,
                    percentual_regiao: comissao.percentualRegiao,
                    percentual_total: comissao.percentualTotal,
                    valor_comissao: comissao.valorComissao
                }
            });
        } catch (error) {
            return responderErro(res, error, 'Erro ao registrar venda');
        }
    }

    Venda_listar_controller = async (req, res) => {
        try {
            const vendas = await Venda.listarVendas();

            return res.status(200).send({
                status: true,
                message: 'Vendas encontradas com sucesso',
                quantidade: vendas.length,
                vendas
            });
        } catch (error) {
            return responderErro(res, error, 'Erro ao consultar vendas');
        }
    }

    Venda_porVendedor_controller = async (req, res) => {
        try {
            const idVendedor = Number(req.params.id);

            // Vendedor inexistente é 404; vendedor sem vendas é 200 com lista vazia
            const vendedor = await Vendedor.consultarVendedor(idVendedor);
            if (!vendedor) {
                return res.status(404).send({
                    status: false,
                    message: 'Vendedor não encontrado'
                });
            }

            const vendas = await Venda.consultarVendasPorVendedor(idVendedor);

            return res.status(200).send({
                status: true,
                message: `Vendas de ${vendedor.nome} encontradas com sucesso`,
                vendedor,
                quantidade: vendas.length,
                vendas
            });
        } catch (error) {
            return responderErro(res, error, 'Erro ao consultar vendas do vendedor');
        }
    }

    Venda_porRegiao_controller = async (req, res) => {
        try {
            const idRegiao = Number(req.params.id);

            const regiao = await Regiao.consultarRegiao(idRegiao);
            if (!regiao) {
                return res.status(404).send({
                    status: false,
                    message: 'Região não encontrada'
                });
            }

            const vendas = await Venda.consultarVendasPorRegiao(idRegiao);

            return res.status(200).send({
                status: true,
                message: `Vendas da região ${regiao.nome_regiao} encontradas com sucesso`,
                regiao,
                quantidade: vendas.length,
                vendas
            });
        } catch (error) {
            return responderErro(res, error, 'Erro ao consultar vendas da região');
        }
    }

    Venda_excluir_controller = async (req, res) => {
        try {
            const idVenda = Number(req.params.id);
            const vendaExistente = await Venda.consultarVenda(idVenda);

            // Remover algo que não existe é 404, não erro de servidor
            if (!vendaExistente) {
                return res.status(404).send({
                    status: false,
                    message: 'Venda não encontrada'
                });
            }

            const venda = new Venda();
            venda.idVenda = idVenda;

            await venda.excluirVenda();

            return res.status(200).send({
                status: true,
                message: 'Venda excluída com sucesso',
                venda: vendaExistente
            });
        } catch (error) {
            return responderErro(res, error, 'Erro ao excluir venda');
        }
    }
};
