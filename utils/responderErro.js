const ErroNegocio = require('./ErroNegocio');


function responderErro(response, error, mensagemPadrao) {
    if (error instanceof ErroNegocio) {
        return response.status(error.statusHttp).send({
            status: false,
            message: error.message
        });
    }

    return response.status(500).send({
        status: false,
        message: mensagemPadrao,
        erro: error.code || error.message
    });
}

module.exports = responderErro;
