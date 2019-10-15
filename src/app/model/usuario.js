exports.get = async function(connection){
    return await connection.query("select * from usuario")
        .then((res)=>{
            return res.rows;
        }).catch((err)=>{
            return err;
        });
}

exports.emailAndCpf = async function(req,connection){

    const { cpf, email }= req.body;
    
    return await connection.query(`SELECT NOME, EMAIL FROM USUARIO WHERE CPF = $1 OR EMAIL = $2`,
    [
        cpf,
        email
    ]
        )
        .then((data)=>{
            if(data.rows.length >= 1)
                return true;
            return false;
        }).catch((err)=>{
            let error = "Erro no Banco de Dados";
            return error;
        })
} 

exports.cadastrarUsuario = async (req, connection)=>{

    const { dados_produtor_id, tipo_user_id, nome, senha, nascimento,cpf, numero_celular, numero_telefone, email, sexo} = req.body;
    return await connection.query(
        `INSERT INTO USUARIO (DADOS_PRODUTOR_ID, TIPO_USER_ID,NOME, SENHA ,NASCIMENTO, 
            CPF, NUMERO_TELEFONE, NUMERO_CELULAR, EMAIL,
                SEXO)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
            dados_produtor_id,
            tipo_user_id,
            nome,
            senha,
            nascimento,
            cpf,
            numero_telefone,
            numero_celular,
            email,
            sexo
        ]
        ).then((data)=>{
            return true;
        }).catch((err)=>{
            return false;
        })

/* `INSERT INTO USUARIO (DADOS_PRODUTOR_ID, TIPO_USER_ID,NOME, SENHA ,NASCIMENTO, 
            CPF, NUMERO_TELEFONE, NUMERO_CELULAR, EMAIL,
                SEXO)
                    VALUES ('${dados_produtor_id}', '${tipo_user_id}', '${nome}', '${senha}', '${nascimento}', '${cpf}', '${numero_telefone}', '${numero_celular}', '${email}', '${sexo}')` */
}

exports.autenticarEmail = async (email,connection)=>{

    return await connection.query("SELECT ID, TIPO_USER_ID, EMAIL, SENHA FROM USUARIO WHERE EMAIL = $1", [email])
        .then((data)=>{
            if(data.rows.length >= 1)
                return data.rows;
            return [];
        }).catch((error)=>{
            return res.status(400).send(error);
        })
};

exports.atualizarUltimoLogin = async (id, connection)=>{

    return await connection.query(`UPDATE USUARIO SET ULTIMO_LOGIN = to_timestamp(${Date.now()/1000}) WHERE ID = $1`, [id])
        .then((data)=>{
            return true
        }).catch((err)=>{
            return err;
        })
}

exports.atualizarUser = async(req,connection)=>{
   
    const { nome, numero_telefone, numero_celular,  id} = req.body;
    return await connection.query(`UPDATE public.usuario SET nome= $1, numero_telefone= $2, numero_celular= $3, 
                    atualiado= to_timestamp(${Date.now()/1000}) WHERE id = $4`,
             [
                nome,
                numero_telefone,
                numero_celular,
                id
             ]
             )
             .then((data)=>{
                 return data;
             }).catch((err)=>{
                console.log(err)
                return err;
             });
}

exports.conferirSenha = async (id, connection)=>{
    
    return await connection.query("SELECT SENHA FROM USUARIO WHERE ID = $1", [id])
        .then((data)=>{
            return data.rows;
        }).catch((err)=>{
            return err;
        })
}

exports.novaSenha = async (req, connection)=>{

    const { nova_senha, id} = req.body;
    return await connection.query(`UPDATE USUARIO SET SENHA = $1, atualiado= to_timestamp(${Date.now()/1000}) WHERE ID = $2`, [nova_senha, id])
        .then((data)=>{
            return data;
        })
        .catch((err)=>{
            return err;
        })
}

exports.confirmarEmail = async (req, connection)=>{

    const { id } = req.body;
 
    return await connection.query(`UPDATE USUARIO SET EMAIL_CONFIRMADO = TRUE, atualiado= to_timestamp(${Date.now()/1000}) WHERE ID = $1`, [id])
        .then((data)=>{
            return data;
        }).catch((err)=>{
            return err;
        })
}

exports.conferirEmail = async (req,connection)=>{

    const { id } = req.body;
   
    return await connection.query("SELECT EMAIL, NOME, EMAIL_CONFIRMADO FROM USUARIO WHERE ID = $1", [id])
        .then((data)=>{
            return data.rows;
        })
        .catch((err)=>{
            return err;
        }) 
}

exports.inserirValoresGastor = async(connection)=>{

    return await connection.query(`INSERT INTO public.valores_gastos(
        valor_gasto_total, meses_full, meses_livre)
        VALUES ( 0, 0, 0) returning id;`)
        .then((data)=>{
            return data.rows[0].id;
        }).catch((err)=>{
            return err;
        })
}

exports.inserirReputacao = async(connection)=>{

    return await connection.query(`INSERT INTO public.reputacao(
        maior_nota, menor_nota, media, quantidade_avaliacao, quantidade_pontos)
       VALUES ( 0, 0, 0, 0, 0) returning id;`)
       .then((data)=>{
           return data.rows[0].id;
       }).catch((err)=>{
           return err;
       })
}

exports.inserirDadosProdutor = async(dados,connection)=>{
    
    const { reputacao_id, valores} = dados;
    return await connection.query(`INSERT INTO public.dados_produtor(
        plano_produtor_id, reputacao_id, valores_gastos_id)
       VALUES (1, $1, $2) returning id ` ,[reputacao_id, valores])
       .then((data)=>{
           return data.rows;
       }).catch((err)=>{
           return err;
       })
}

exports.selecionarDadosUsuario = async (id_usuario,connection)=>{


    return await connection.query(`SELECT *
	FROM public.usuario  where id = $1`, [id_usuario])
        .then((data)=>{
            if(data.rows.length >= 1)
                return data.rows;
            return [];
        }).catch((error)=>{
            return res.status(400).send(error);
        })
};

exports.vendasImpossibilitadas = async (id_usuario,connection)=>{
    return await connection.query(`SELECT logs_falta_estoque.id as id, quantidade_disponivel,quantidade_requirida,to_char(data, 'dd/MM/yyyy') as  data, momento, preco_producao, preco_venda,
    to_char(data_producao, 'dd/MM/yyyy') as data_producao, produto.nome as nome_prod, usuario.nome as nome_user
    from logs_falta_estoque inner join organicos on (organicos.id = logs_falta_estoque.id_produto)
        inner join produto on (produto.id = organicos.produto_id) inner join usuario on
            (logs_falta_estoque.id_consumidor = usuario.id) WHERE ID_PRODUTOR = $1 order by data desc limit 5`, [id_usuario])
        .then((data)=>{
            if(data.rows.length >= 1)
                return data.rows;
            return [];
        }).catch((error)=>{
            return res.status(400).send(error);
        })
};

exports.todasVendasImpossibilitadas = async(id_usuario, connection)=>{
    return await connection.query(`SELECT quantidade_disponivel,quantidade_requirida, data, momento, preco_producao, preco_venda,
    data_producao, produto.nome as nome_prod, usuario.nome as nome_user
    from logs_falta_estoque inner join organicos on (organicos.id = logs_falta_estoque.id_produto)
        inner join produto on (produto.id = organicos.produto_id) inner join usuario on
            (logs_falta_estoque.id_consumidor = usuario.id) WHERE ID_PRODUTOR = $1 order by data desc`, [id_usuario])
        .then((data)=>{
            if(data.rows.length >= 1)
                return data.rows;
            return [];
        }).catch((error)=>{
            return res.status(400).send(error);
        })
}

exports.ultimasVendasFinalizadas = async (id_usuario,connection)=>{

    return await connection.query(`select * from venda where situacao = true and vendedor_id = $1 order by data_finalizada desc limit 5`, [id_usuario])
        .then((data)=>{
            if(data.rows.length >= 1)
                return data.rows;
            return [];
        }).catch((error)=>{
            return res.status(400).send(error);
        })
};

exports.brutoLiquido = async (id_usuario,connection)=>{

    return await connection.query(`select sum(valor_total_produtos) valor_total, sum(valor_final) as valor_final 
	from venda where vendedor_id = $1 and situacao = true`, [id_usuario])
        .then((data)=>{
            if(data.rows.length >= 1)
                return data.rows;
            return [];
        }).catch((error)=>{
            return res.status(400).send(error);
        })
};

exports.avaliacaoConsumidor = async (id_usuario,connection)=>{

    return await connection.query(`	select  avaliacao_consumidor.avaliacao from venda inner join avaliacao_consumidor on
    (venda.avaliacao_consumidor_id = avaliacao_consumidor.id) where vendedor_id = $1`, [id_usuario])
        .then((data)=>{
            if(data.rows.length >= 1)
                return data.rows;
            return [];
        }).catch((error)=>{
            console.log(error)
            return res.status(400).send(error);
        })
};

exports.vendasAberto= async (id_usuario,connection)=>{

    return await connection.query(`select count(*) qtd from venda where vendedor_id = $1 and data_finalizada is null`, [id_usuario])
        .then((data)=>{
            if(data.rows.length >= 1)
                return data.rows;
            return [];
        }).catch((error)=>{
            return res.status(400).send(error);
        })
};

exports.reputacaoVendedor = async(id,connection)=>{

    return await connection.query(`select trunc(avg(avaliacao),2) as avaliacao from venda
    inner join avaliacao_consumidor on (venda.avaliacao_consumidor_id = avaliacao_consumidor.id)
    where vendedor_id = $1
    group by vendedor_id`, [id])
        .then((data)=>{
            return data.rows;
        }).catch((err)=>{
            return err;
        })
}

exports.maiorConsumidor = async(id,connection)=>{

    return await connection.query(`SELECT 
	SUM(VALOR_TOTAL_PRODUTOS) AS VALOR,
	USUARIO.NOME AS COMPRADOR
	FROM public.venda
	INNER JOIN USUARIO ON (USUARIO.ID = COMPRADOR_ID)
	where comprador_id = $1
	GROUP BY VALOR_TOTAL_PRODUTOS, USUARIO.NOME
    ORDER BY VALOR_TOTAL_PRODUTOS DESC LIMIT 1`,[id])
    .then((data)=>{
        return data.rows;
    }).catch((error)=>{
        return error;
    })
}

exports.ultimaVenda = async (id, connection)=>{
    return await connection.query(`SELECT VALOR_TOTAL_PRODUTOS, VALOR_FINAL, USUARIO.NOME FROM VENDA INNER JOIN PRODUTOS_VENDA ON (VENDA.ID = PRODUTOS_VENDA.VENDA_ID)
    INNER JOIN USUARIO ON (VENDA.COMPRADOR_ID = USUARIO.ID)
    WHERE VENDEDOR_ID = $1 AND SITUACAO = true
    GROUP BY VENDA.ID,USUARIO.NOME
    ORDER BY DATA_FINALIZADA DESC 
    LIMIT 1`,[id])
    .then((data)=>{
        return data.rows;
    }).catch((error)=>{
        return error;
    })
}


