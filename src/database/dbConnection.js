const pg = require('pg');

module.exports = ()=>{
    const connString = "postgres://postgres:1234@localhost:5432/organicos";
    const conexao = new pg.Client(connString);

    conexao.connect();

    return conexao;
};