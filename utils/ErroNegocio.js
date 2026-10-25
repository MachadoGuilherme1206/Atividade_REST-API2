
module.exports = class ErroNegocio extends Error {
    constructor(mensagem, statusHttp = 400) {
        super(mensagem);
        this.name = 'ErroNegocio';
        this.statusHttp = statusHttp;
    }
};
