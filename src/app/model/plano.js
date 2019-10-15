exports.selecionarPlanos = async(connection)=>{

    return await connection.query(`SELECT id, descricao, valor
    FROM public.plano_produtor;`)
        .then((data)=>{
            return data.rows;
        }).catch((err)=>{
            return err;
        })
}

exports.selecionarPlanoProdutor = async(id,connection)=>{

    return await connection.query(`SELECT PLANO_PRODUTOR.ID,NOME, PLANO_PRODUTOR.DESCRICAO AS DESCRICAO, PLANO_PRODUTOR.VALOR AS VALOR FROM USUARIO 
	INNER JOIN DADOS_PRODUTOR ON ( USUARIO.DADOS_PRODUTOR_ID = DADOS_PRODUTOR.ID )
	INNER JOIN PLANO_PRODUTOR ON (DADOS_PRODUTOR.PLANO_PRODUTOR_ID = PLANO_PRODUTOR.ID)
	WHERE USUARIO.ID = $1`, [id] )
        .then((data)=>{
            return data.rows;
        }).catch((err)=>{
            return err;
        })
}

exports.SelecionarDadosProdutor = async(req,connection)=>{

    const {id} = req.body;
    return await connection.query(`select usuario.dados_produtor_id from usuario inner join dados_produtor 
	on (usuario.dados_produtor_id = dados_produtor.id)
	where usuario.id = $1`, [id])
            .then((data)=>{
                return data.rows[0].dados_produtor_id;
            }).catch((err)=>{
                console.log(err)
                return err;
            })
}

exports.atualizarPlano = async(req,connection)=>{
    const {id, plano_id} = req;
    return await connection.query(`UPDATE public.dados_produtor
	SET plano_produtor_id=$1
	WHERE  id = $2;`, [plano_id,id])
            .then((data)=>{
                return data;
            }).catch((err)=>{
                c
                return err;
            })
}
