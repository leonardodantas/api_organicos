exports.inserirProduto = async (req,connection)=>{
   
    const { produtor_id, local_producao_id, produto_id, quantidade,
             preco_producao, preco_venda, descricao, data_producao, data_validade, estoque } = req.body;
            
    return await connection.query(`INSERT INTO public.organicos(
        produtor_id, local_producao_id, produto_id, quantidade, preco_producao, preco_venda, descricao, data_producao, data_validade, estoque_minimo)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);`,
        [
            produtor_id,
            local_producao_id,
            produto_id, 
            quantidade,
            preco_producao, 
            preco_venda, 
            descricao, 
            data_producao, 
            data_validade,
            estoque 
        ])
        .then((data)=>{
            return true;
        }).catch((err)=>{
            return false;
        });
}

exports.selecionarTodasCidades = async(connection)=>{

    return await connection.query("select * from cidade order by nome")
        .then((data)=>{
            return data.rows;
        }).catch((err)=>{
            return err;
        })
}

exports.inserirLocalProducao = async (cidade_id,connection)=>{

    return await connection.query("INSERT INTO LOCAL_PRODUCAO (CIDADE_ID) VALUES ($1) RETURNING ID", [cidade_id])
        .then((data)=>{
            return data.rows[0].id;
        }).catch((err)=>{
            return false;
        })
}

exports.selecionarTodosOrganicos = async (connection)=>{

    return await connection.query(`select USUARIO.NOME AS NOME, CPF, EMAIL, SEXO, CRIADO,NUMERO_TELEFONE, NUMERO_CELULAR,  
	QUANTIDADE, PRECO_VENDA, PRECO_PRODUCAO, DESCRICAO, CIDADE.NOME AS CIDADE,DATA_PRODUCAO,
		DATA_VALIDADE
		from organicos INNER JOIN USUARIO ON (ORGANICOS.PRODUTOR_ID = USUARIO.ID) 
			INNER JOIN PRODUTO ON(ORGANICOS.PRODUTO_ID = PRODUTO.ID)
                INNER JOIN  CIDADE ON (ORGANICOS.LOCAL_PRODUCAO_ID = CIDADE.ID) WHERE ORGANICOS.STATUS = FALSE`)
    .then((data)=>{
        return data.rows;
    }).catch((err)=>{
        return err;
    })
}

exports.selecionarOrganicosProdutor = async (req,connection)=>{

    const  id  = req.params.id;
   
    return await connection.query(`select ORGANICOS.ID AS ID, USUARIO.NOME AS NOME, CPF, EMAIL, SEXO, CRIADO,NUMERO_TELEFONE, NUMERO_CELULAR,  
	QUANTIDADE, PRECO_VENDA, PRECO_PRODUCAO, DESCRICAO, CIDADE.NOME AS CIDADE,DATA_PRODUCAO,
		DATA_VALIDADE, PRODUTO.NOME AS NOME_PRODUTO, ORGANICOS.ESTOQUE_MINIMO AS ESTOQUE_MINIMO, ORGANICOS.STATUS
		from organicos INNER JOIN USUARIO ON (ORGANICOS.PRODUTOR_ID = USUARIO.ID) 
			INNER JOIN PRODUTO ON(ORGANICOS.PRODUTO_ID = PRODUTO.ID)
                INNER JOIN  CIDADE ON (ORGANICOS.LOCAL_PRODUCAO_ID = CIDADE.ID)
                    WHERE USUARIO.ID = $1`, [id])
    .then((data)=>{
        return data.rows;
    }).catch((err)=>{
        return err;
    })
}

exports.selecionarOrganicosProdutorProduto = async (req,connection)=>{

    const  id  = req.params.id;
    const id_produto = req.params.id_produto;
   
    return await connection.query(`select QUANTIDADE, PRECO_VENDA, PRECO_PRODUCAO, DESCRICAO, CIDADE.NOME AS CIDADE,DATA_PRODUCAO,
    DATA_VALIDADE, PRODUTO.NOME AS NOME_PRODUTO
    from organicos INNER JOIN USUARIO ON (ORGANICOS.PRODUTOR_ID = USUARIO.ID) 
        INNER JOIN PRODUTO ON(ORGANICOS.PRODUTO_ID = PRODUTO.ID)
            INNER JOIN  CIDADE ON (ORGANICOS.LOCAL_PRODUCAO_ID = CIDADE.ID)
                WHERE USUARIO.ID = $1 AND PRODUTO.ID = $2`, [id, id_produto])
    .then((data)=>{
        return data.rows;
    }).catch((err)=>{
        return err;
    })
}

exports.selecionarTodosOrganicosProdutor = async (req,connection)=>{

    const  id  = req.params.id;
   
    return await connection.query(`select produto.id as id, SUM(QUANTIDADE) AS QTD, TRUNC(AVG(PRECO_VENDA),2) AS MED_VENDA, TRUNC(AVG(PRECO_PRODUCAO),2) AS MED_PROD,
	PRODUTO.NOME AS NOME_PRODUTO
		from organicos INNER JOIN USUARIO ON (ORGANICOS.PRODUTOR_ID = USUARIO.ID) 
			INNER JOIN PRODUTO ON(ORGANICOS.PRODUTO_ID = PRODUTO.ID)
                INNER JOIN  CIDADE ON (ORGANICOS.LOCAL_PRODUCAO_ID = CIDADE.ID)
                     WHERE USUARIO.ID = $1 GROUP BY NOME_PRODUTO, produto.id`, [id])
    .then((data)=>{
        return data.rows;
    }).catch((err)=>{
        return err;
    })
}

exports.verificarIdProdutor = async (id, connection)=>{
 
    return await connection.query("SELECT TIPO_USER_ID FROM USUARIO WHERE ID = $1", [id])
        .then((data)=>{
            if( data.rows[0].tipo_user_id)
                return true;
            return false;
        })
        .catch((err)=>{
            
            return err;
        })
}

exports.estoqueMinimo = async(id, connection)=>{
    return await connection.query(`select * from organicos 
    inner join produto on (produto.id = organicos.produto_id)
    where estoque_minimo > quantidade and produtor_id = $1 and status = true`,[id])
        .then((data)=>{
            return data.rows;
        }).catch((err)=>{
            return err;
        })
}