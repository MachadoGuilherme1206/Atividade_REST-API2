const Vendedor = require('../models/Vendedor');
const responderErro = require('../utils/responderErro');

// Usada no PUT: devolve o valor enviado no corpo ou, se ausente, o valor atual
function valorOuAtual(valorEnviado, valorAtual) {
    if (valorEnviado === undefined || valorEnviado === null) {
        return valorAtual;
    }
    return valorEnviado;
}

module.exports = class VendedorController {
    Vendedor_cadastrar_controller = async (req, res) => {
        try {
            const vendedor = new Vendedor();
            vendedor.nome = req.body.nome.trim();
            vendedor.metaMensal = Number(req.body.meta_mensal);
            vendedor.percentualBase = Number(req.body.percentual_base);
            vendedor.ativo = true;

            await vendedor.cadastrarVendedor();

            return res.status(201).send({
                status: true,
                message: 'Vendedor cadastrado com sucesso',
                vendedor
            });
        } catch (error) {
            return responderErro(res, error, 'Erro ao cadastrar vendedor');
        }
    }

    Vendedor_listar_controller = async (req, res) => {
        try {
            const filtros = {};
            if (req.query.ativo !== undefined) {
                filtros.ativo = ['true', '1'].includes(String(req.query.ativo).toLowerCase());
            }

            const vendedores = await Vendedor.listarVendedores(filtros);

            return res.status(200).send({
                status: true,
                message: 'Vendedores encontrados com sucesso',
                vendedores
            });
        } catch (error) {
            return responderErro(res, error, 'Erro ao consultar vendedores');
        }
    }

    Vendedor_consultar_controller = async (req, res) => {
        try {
            const vendedor = await Vendedor.consultarVendedor(Number(req.params.id));

            if (vendedor) {
                return res.status(200).send({
                    status: true,
                    message: 'Vendedor encontrado com sucesso',
                    vendedor
                });
            }
            return res.status(404).send({
                status: false,
                message: 'Vendedor não encontrado'
            });
        } catch (error) {
            return responderErro(res, error, 'Erro ao consultar vendedor');
        }
    }

    Vendedor_atualizar_controller = async (req, res) => {
        try {
            const idVendedor = Number(req.params.id);
            const vendedorExistente = await Vendedor.consultarVendedor(idVendedor);

            // Sem o vendedor no banco não existe o que atualizar: 404, e não erro de servidor
            if (!vendedorExistente) {
                return res.status(404).send({
                    status: false,
                    message: 'Vendedor não encontrado'
                });
            }

            const vendedor = new Vendedor();
            vendedor.idVendedor = idVendedor;
            vendedor.nome = vendedorExistente.nome;
            vendedor.ativo = vendedorExistente.ativo;

            // Atualização parcial: campo ausente no corpo mantém o valor atual
            vendedor.metaMensal = Number(valorOuAtual(req.body.meta_mensal, vendedorExistente.meta_mensal));
            vendedor.percentualBase = Number(valorOuAtual(req.body.percentual_base, vendedorExistente.percentual_base));

            await vendedor.atualizarVendedor();

            // As vendas já registradas mantêm a comissão gravada; o novo percentual
            // vale só para as próximas vendas
            return res.status(200).send({
                status: true,
                message: 'Vendedor atualizado com sucesso',
                vendedor
            });
        } catch (error) {
            return responderErro(res, error, 'Erro ao atualizar vendedor');
        }
    }

    Vendedor_desativar_controller = async (req, res) => {
        try {
            const idVendedor = Number(req.params.id);
            const vendedorExistente = await Vendedor.consultarVendedor(idVendedor);

            if (!vendedorExistente) {
                return res.status(404).send({
                    status: false,
                    message: 'Vendedor não encontrado'
                });
            }

            if (!vendedorExistente.ativo) {
                return res.status(400).send({
                    status: false,
                    message: 'O vendedor já está inativo'
                });
            }

            const vendedor = new Vendedor();
            vendedor.idVendedor = idVendedor;
            vendedor.nome = vendedorExistente.nome;
            vendedor.metaMensal = vendedorExistente.meta_mensal;
            vendedor.percentualBase = vendedorExistente.percentual_base;

            await vendedor.desativarVendedor();

            return res.status(200).send({
                status: true,
                message: 'Vendedor desativado com sucesso. O histórico de vendas foi mantido',
                vendedor
            });
        } catch (error) {
            return responderErro(res, error, 'Erro ao desativar vendedor');
        }
    }
};
