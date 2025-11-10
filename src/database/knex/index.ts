import knex, { Knex } from "knex";
const config = require("../../../knexfile");

// Detecta o ambiente atual e usa a configuração correspondente
const environment = process.env.NODE_ENV || "development";
const connection: Knex = knex(config[environment]);

export default connection;
