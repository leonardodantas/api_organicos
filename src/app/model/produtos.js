exports.selecionarTodosProdutos = async(connection)=>{

    return await connection.query(`select * from produto order by id asc`)
        .then((data)=>{
            return data.rows;
        }).catch((err)=>{
            return err;
        })
}


exports.selecionarProduto = async(id,connection)=>{
   
    return await connection.query(`select * from produto where id = $1 order by id asc`, [id])
        .then((data)=>{
            if(data.rows.length)
                return data.rows;
            return data.rows[0];
        })
        .catch((err)=>{
            return err;
        })
}

exports.inserirProduto = async (prod, connection)=>{

    return await connection.query(`INSERT INTO PRODUTO (NOME) VALUES ($1)`, [prod])
        .then((data)=>{
            return data;
        }).catch((err)=>{
            return err;
        })
}