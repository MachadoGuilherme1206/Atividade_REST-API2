// Carrega o .env antes de qualquer outro require, para que o Banco
// já encontre as credenciais em process.env
require('dotenv').config();

const Servidor = require('./servidor');

// Instanciando o servidor
const servidor = new Servidor();

// Iniciando o servidor
servidor.iniciar();
