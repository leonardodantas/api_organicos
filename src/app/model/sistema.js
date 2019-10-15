exports.dadosSistema = async (connection)=>{

    return await connection.query(`select data, porcentagem, valor_total from comissao_sistema order by id desc limit 1`)
        .then((data)=>{
            return data.rows[0];
        })
        .catch((err)=>{
            return err;
        })
}

exports.todosDadosSistema = async (connection)=>{

    return await connection.query(`select * from comissao_sistema order by id desc`)
        .then((data)=>{
            return data.rows;
        }).catch((err)=>{
            return err;
        })
}

exports.logsLogin = async (connection)=>{

    return await connection.query(`select upper(descricao) as descricao, usuario.nome as nome,
    tipo_usuario.tipo as tipo
    from logs_login inner join usuario on (logs_login.id_usuario = usuario.id)
        inner join tipo_usuario on (logs_login.id_tipo_usuario = tipo_usuario.id)
        order by logs_login.id desc`)
    .then((data)=>{
        return data.rows;
    })
    .catch((err)=>{
        return err;
    })
}

exports.logsProdutos = async (connection)=>{

    return await connection.query(`	select upper(logs_organicos.descricao) as descricao, organicos.preco_producao as preco_producao, 
    organicos.preco_venda as preco_venda, to_char(data_producao, 'dd/MM/yyyy') as data_producao, data_validade,
    produto.nome as produto
    from logs_organicos
    inner join organicos on (logs_organicos.id_organico = organicos.id)
        inner join produto on (organicos.produto_id = produto.id)
            order by logs_organicos.id desc`)
    .then((data)=>{
        return data.rows;
    })
    .catch((err)=>{
        return err;
    })
}

exports.atualizarTabelaComissao = async (req,connection)=>{

    const {porcentagem} = req.body;
    return await connection.query(`INSERT INTO public.comissao_sistema(
        porcentagem,  valor_total)
       VALUES ( $1, 0)`, [porcentagem])
    .then((data)=>{
        return data;
    })
    .catch((err)=>{
        console.log(err)
        return err;
    })
}

exports.valoresEmAberto = async(connection)=>{
    
    return await connection.query(`select sum(valor_total_produtos) as bruto,
    trunc(avg(valor_desconto),2) as media_desconto,
    trunc(avg(valor_frete),2) as media_frete,
    (select porcentagem from comissao_sistema order by id desc limit 1) as porc_sistema
    from venda where situacao = false`)
    .then((data)=>{
        return data.rows;
    }).catch((err)=>{
        return err;
    })
}

exports.valoresFinalizados = async(connection)=>{

    return await connection.query(`select sum(valor_total_produtos) as bruto,
    trunc(sum(valor_final),2) as liquido_usuario,
    trunc(avg(valor_desconto),2) as media_desconto,
    trunc(avg(valor_frete),2) as media_frete
    from venda 
    where situacao = true`)
    .then((data)=>{
        return data.rows;
    }).catch((err)=>{
        return err;
    })
}

exports.mediasComissoes = async(connection)=>{

    return await connection.query(`select trunc(avg(porcentagem),2) as media_porc, 
    trunc(avg(valor_total_venda), 2) as media_total_venda,
    trunc(avg(valor_total_comissao), 2)as media_total_comissao
    from comissao_venda`)
    .then((data)=>{
        return data.rows;
    }).catch((err)=>{
        console.log(err)
        return err;
    })
}