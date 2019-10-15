exports.atualizarDescontoFrete = async(dados,connection)=>{

    const {id, frete, desconto} = dados.body;
    return await connection.query(`UPDATE VENDA SET VALOR_FRETE = $2, 
                                        VALOR_DESCONTO = $3 WHERE ID = $1`, [id, frete, desconto])
    .then((data)=>{
        return data;
    }).catch((err)=>{
        return err;
    })
}

exports.adicionarNovoProduto = async(dados,connection)=>{

    const { organicos_id, venda_id, quantidade, valor_unitario, valor_total} = dados;

    return await connection.query(`INSERT INTO public.produtos_venda(
        organicos_id, venda_id, quantidade, valor_unitario, valor_total)
        VALUES ( $1, $2, $3, $4, $5)`, [organicos_id, venda_id, quantidade, valor_unitario, valor_total])
        .then((data)=>{
            return data;
        }).catch((err)=>{
            return err;
        })
}

exports.verificarVendaEmAberto = async(dados,connection)=>{

    const {vendedor_id, comprador_id} = dados;
    return await connection.query(`select data_finalizada from venda where data_finalizada is null 
        and vendedor_id = $1 and comprador_id = $2`, [vendedor_id, comprador_id])
    .then((data)=>{
        if(data.rows.length > 0)
            return true;
        return false;
    }).catch((err)=>{
        return err;
    })
}

exports.selecionarVendaEmAberto = async(dados,connection)=>{
    const {vendedor_id, comprador_id} = dados;
    return await connection.query(`select id from venda where data_finalizada is null 
        and vendedor_id = $1 and comprador_id = $2`, [vendedor_id, comprador_id])
    .then((data)=>{
        return data.rows;
    }).catch((err)=>{
        return err;
    })
}

exports.selecionarOrganico = async(id,connection)=>{

    return await connection.query(`select quantidade, preco_venda from organicos where id = $1`,[id])
        .then((data)=>{
            return data.rows[0];
        }).catch((err)=>{
            return err;
        })
}

exports.novaVenda = async(dados,connection)=>{

    const { vendedor_id, comprador_id, valor_total} = dados;
    
    return await connection.query(`INSERT INTO public.venda(
        vendedor_id, comprador_id, valor_total_produtos, valor_frete, valor_desconto, valor_final, situacao)
      VALUES ( $1, $2, $3, 0, 0, $3, false) returning id`, [vendedor_id, comprador_id, valor_total])
      .then((data)=>{
          return data.rows[0].id;
      }).catch((err)=>{
          return err;
      })
}

exports.atualizarVenda = async(dados,connection)=>{

    const {id, vendedor_id,comprador_id,valor_total} = dados;

    return await connection.query(`UPDATE VENDA SET VALOR_TOTAL_PRODUTOS = (VALOR_TOTAL_PRODUTOS + $1) WHERE ID = $2`, [valor_total,id])
        .then((data)=>{
            return data;
        }).catch((err)=>{
            return err;
        })
}

exports.inserirLogProdIndiponivel = async(dados,connection)=>{

    const {id_produto, id_consumidor,id_produtor,
        quantidade_requida,quantidade_disponivel,
        valor_perdido, momento} = dados;

    return await connection.query(`INSERT INTO public.logs_falta_estoque(
         id_produtor, id_consumidor, id_produto, quantidade_requirida, 
        quantidade_disponivel,  valor_perdido, momento)
        VALUES ( $1, $2, $3, $4, $5, $6, $7)`, 
        [
            id_produtor,
            id_consumidor,
            id_produto,
            quantidade_requida,
            quantidade_disponivel,
            valor_perdido,
            momento
        ]
        )
        .then((data)=>{
            return data;
        }).catch((err)=>{
            return err;
        })
}

exports.vendasAbertas = async(id, connection)=>{
    
    return await connection.query(`select venda.id as id ,usuario.nome as comprador, valor_total_produtos,
	valor_frete, valor_desconto, valor_final
	from venda inner join usuario on (venda.comprador_id = usuario.id)
	where data_finalizada is null 
    and vendedor_id = $1`, [id])
        .then((data)=>{
            return data.rows;
        }).catch((err)=>{
            return err;
        })
}

exports.produtosVendasAbertas = async(id,connection)=>{

    return await connection.query(`select produtos_venda.id as id, organicos.quantidade as quantidade_estoque,
	produtos_venda.quantidade as quantidade_venda, valor_unitario, valor_total, preco_producao, preco_venda,(preco_venda - preco_producao ) as lucro,
	to_char(data_producao, 'dd/MM/yyyy') as data_producao, produto.nome as nome_produto
	from produtos_venda inner join organicos on (organicos.id = produtos_venda.organicos_id)
	inner join produto on (organicos.produto_id = produto.id)
	where venda_id = $1`, [id])
        .then((data)=>{
            return data.rows;
        }).catch((err)=>{
            return err;
        })
}

exports.organicosMaisVendidos = async(connection)=>{

    return await connection.query(`select  sum(produtos_venda.quantidade) qtd, produto.nome, trunc(avg(preco_producao),2) media_producao,
    trunc(avg(preco_venda),2) media_venda, (trunc(avg(preco_venda),2) - trunc(avg(preco_producao),2)) as lucro
    from 
    produtos_venda
    inner join organicos on (organicos_id = organicos.id)
    inner join produto on (produto.id = organicos.produto_id)
    group by organicos_id, produto.nome order by qtd desc`)
    .then((data)=>{
        return data.rows
    }).catch((err)=>{
        return err;
    })
}

exports.meusOrganicosMaisVendidos = async(id,connection)=>{

    return await connection.query(`select  sum(produtos_venda.quantidade) qtd, produto.nome, trunc(avg(preco_producao),2) media_producao,
    trunc(avg(preco_venda),2) media_venda, (trunc(avg(preco_venda),2) - trunc(avg(preco_producao),2)) as lucro
    from 
    produtos_venda
    inner join organicos on (organicos_id = organicos.id)
    inner join produto on (produto.id = organicos.produto_id)
    where produtor_id = $1
    group by organicos_id, produto.nome order by qtd desc`,[id])
    .then((data)=>{
        return data.rows
    }).catch((err)=>{
        return err;
    })
}

exports.maioresTaxasLucro = async(connection)=>{

    return await connection.query(`select produto.nome, trunc(avg(preco_producao),2) as producao,  
    trunc(avg(preco_venda),2) as venda,
    (trunc(avg(preco_venda),2) - trunc(avg(preco_producao),2)) as lucro
    from 
    produtos_venda
    inner join organicos on (organicos_id = organicos.id)
    inner join produto on (produto.id = organicos.produto_id)
    group by produto.id
    order by lucro desc limit 10`)
    .then((data)=>{
        return data.rows;
    }).catch((err)=>{
        return err
    })
}

exports.minhasMaioresTaxasLucro = async(id,connection)=>{

    return await connection.query(`select produto.nome, trunc(avg(preco_producao),2) as producao,  
    trunc(avg(preco_venda),2) as venda,
    (trunc(avg(preco_venda),2) - trunc(avg(preco_producao),2)) as lucro
    from 
    produtos_venda
    inner join organicos on (organicos_id = organicos.id)
    inner join produto on (produto.id = organicos.produto_id)
    where produtor_id = $1
    group by produto.id
    order by lucro desc limit 10`, [id])
    .then((data)=>{
        return data.rows;
    }).catch((err)=>{
        return err
    })
}

exports.vendasAbertasUsuario = async(id,connection)=>{
    console.log(id)
    return await connection.query(`	select id, vendedor_id,valor_total_produtos,  trunc((valor_total_produtos * (valor_frete/100)),2) as frete, 
    trunc((valor_total_produtos * (valor_desconto/100)),2) as desconto,
    trunc((valor_total_produtos + valor_total_produtos * (valor_frete/100) - valor_total_produtos * (valor_desconto/100)),2) as valor_final   
    from venda where comprador_id = $1 and data_finalizada is null`,[id])
        .then((data)=>{
            console.log(data.rows)
            return data.rows;
        }).catch((err)=>{
            return err;
        })
}

exports.visualizarProdutosVendaUsuario = async(id, connection)=>{
    return await connection.query(`select organicos.id as id_organico, produtos_venda.id
    as produtos_venda_id,usuario.nome as produtor, valor_unitario, produtos_venda.quantidade, 
    valor_total, produto.nome as produto from venda inner join produtos_venda on (venda.id = produtos_venda.venda_id)
	inner join usuario on (venda.vendedor_id = usuario.id)
	inner join organicos on (organicos.id = produtos_venda.organicos_id)
	inner join produto on (organicos.produto_id = produto.id) where venda.id = $1 `,[id])
        .then((data)=>{
            return data.rows;
        }).catch((err)=>{
            
            return err;
        })

}

exports.selecionarProdutoVendaUsuario = async(id,connection)=>{
  
    return await connection.query(`select * from produtos_venda where produtos_venda.id = $1`, [id])
    .then((data)=>{
        return data.rows;
    }).catch((err)=>{
        return err;
    })
}

exports.removerUmProduto = async(id,connection)=>{
    return await connection.query(`update produtos_venda set quantidade = quantidade - 1, 
    valor_total = valor_total - valor_unitario where produtos_venda.id = $1`, [id])
        .then((data)=>{
            return data;
        }).catch((err)=>{
            return err;
        })
}

exports.atualizarValorVendaTotal = async(dados, connection)=>{
    const {valor_unitario,id} = dados;
    return await connection.query(`update venda set valor_total_produtos = 
        valor_total_produtos - $1 where id = $2`, [valor_unitario,id])
        .then((data)=>{
            return data;
        }).catch((err)=>{
            return err;
        })
}

exports.atualizarValorVendaTotalAdd = async(dados, connection)=>{
    const {valor_unitario,id} = dados;
    return await connection.query(`update venda set valor_total_produtos = 
        valor_total_produtos + $1 where id = $2`, [valor_unitario,id])
        .then((data)=>{
            return data;
        }).catch((err)=>{
            return err;
        })
}

exports.verificarQuantidade = async(id,connection)=>{

    return await connection.query(`select quantidade from organicos where id = $1`,[id])
    .then((data)=>{
        return data.rows;
    }).catch((err)=>{
        return err;
    })
}

exports.adicionarUmProduto = async(id,connection)=>{
    return await connection.query(`update produtos_venda set quantidade = quantidade + 1, 
    valor_total = valor_total + valor_unitario where produtos_venda.id = $1`, [id])
        .then((data)=>{
            return data;
        }).catch((err)=>{
            return err;
        })
}

exports.vendaDadosUsuario = async(dados,connection)=>{
    return await connection.query(`select * from venda where id =33 and vendedor_id = 55`)
    .then((data)=>{
        return data[0].rows;
    }).catch((err)=>{
        return err;
    })
}
exports.vendasParaFinalizar = async(id,connection)=>{

    return await connection.query(`select * from venda 
        where data_finalizada is not
         null and situacao = false and vendedor_id = $1 order by id`,[id])
        .then((data)=>{
            return data.rows;
        }).catch((err)=>{
            return err;
        })
}

exports.atualizarStatus = async(dados,connection)=>{
    const {status,id} = dados.body;
    console.log(status,id)
    return await connection.query(`UPDATE ORGANICOS SET STATUS = $1 WHERE ID = $2`,[status,id])
        .then((data)=>{
            return data;
        }).catch((err)=>{
            return err;
        })
}

exports.atualizarVendaFinalizada = async(id,connection)=>{
    console.log(id)
   return await connection.query(`UPDATE VENDA SET situacao = TRUE WHERE ID = $1`,[id])
        .then((data)=>{
            return data;
        }).catch((err)=>{
            console.log(err)
            return err;
        })
}

exports.selecionarProdutoVenda = async(dados,connection)=>{

    const {venda_id, organicos_id} = dados;
    return await connection.query(`select * from produtos_venda where produtos_venda.organicos_id = $1 
    and produtos_venda.venda_id = $2`,[venda_id,organicos_id])
        .then((data)=>{
            return data.rows
        })
}

//finalizar venda usuarios
exports.verificarQuantidadeParaBaixa = async(venda_id,connection)=>{
    return await connection.query(`select produto.nome as produto, organicos.quantidade as quantidade_dispo from produtos_venda 
    inner join organicos on (organicos_id = organicos.id)
    inner join produto on (produto.id = organicos.produto_id)
    where venda_id = $1 and (produtos_venda.quantidade > organicos.quantidade)`, [venda_id])
        .then((data)=>{
            return data.rows;
        }).catch((err)=>{
            return err;
        })
}

exports.selecionarOrganicos = async(venda_id, connection)=>{
    return await connection.query(`select organicos_id, quantidade from produtos_venda where venda_id = $1`, [venda_id])
    .then((data)=>{
        return data.rows;
    }).catch((err)=>{
        return err;
    })
}

exports.baixarQuantidadeEstoque = async(dados,connection)=>{
    const {id,quantidade} = dados;
    return await connection.query(`update organicos set
     quantidade = quantidade - $1 where id = $2`, [quantidade,id])
        .then((data)=>{
            return data;
        }).catch((err)=>{
            return err;
        })
}

exports.comissaoSistema = async(connection)=>{

    return await connection.query(`select id, porcentagem from comissao_sistema order by id desc limit 1`)
        .then((data)=>{
            return data.rows;
        }).catch((err)=>{
            return err;
        })
}

exports.selecionarVenda = async(id, connection)=>{

    return await connection.query(`select valor_total_produtos, valor_frete, 
        valor_desconto from venda where id = $1`, [id])
        .then((data)=>{
            return data.rows;
        }).catch((err)=>{
            return err;
        })
}

exports.inserirComissaoVenda = async(dados, connection)=>{

    const {venda_id, comissao_sistema_id, valor_total_venda, valor_total_comissao, porcentagem} = dados;
    return await connection.query(`INSERT INTO public.comissao_venda(
        venda_id, comissao_sistema_id, valor_total_venda, valor_total_comissao, porcentagem)
        VALUES ($1, $2, $3, $4, $5);`,[
            venda_id,
            comissao_sistema_id,
            valor_total_venda,
            valor_total_comissao,
            porcentagem
        ]).then((data)=>{
            return data
        }).catch((err)=>{
            return err
        })
}

exports.atualizarComissaoSistema = async(dados,connection)=>{

    const {valor_total, id} = dados;
    return await connection.query(`UPDATE public.comissao_sistema
	SET   valor_total= valor_total + $1
    WHERE id = $2`, [valor_total,id])
    .then((data)=>{
        return data;
    }).catch((err)=>{
        return err;
    })
}

exports.inserirPagamento = async(dados,connection)=>{

    const {valor_pago, tipo_pagamento} = dados;
    return await connection.query(`INSERT INTO public.pagamento(
        valor_pago, tipo_pagamento)
        VALUES ( $1, $2) returning id`, [valor_pago, tipo_pagamento])
        .then((data)=>{
            return data.rows
        }).catch((err)=>{
            return err;
        })
}

exports.atualizarVendaParaFinalizar = async(dados,connection)=>{

    const {id_pagamento,valor_total_produtos, valor_final, id_venda} = dados;
    return await connection.query(`UPDATE public.venda
	SET pagamento_id=$1, valor_total_produtos=$2, valor_final=$3, data_finalizada=now()
    WHERE id=$4`, [id_pagamento,valor_total_produtos, valor_final, id_venda])
    .then((data)=>{
        return data;
    }).catch((err)=>{
        return err;
    })
}

//visualizar vendas que ainda não foram avaliadas
exports.getVendasNaoAvaliadas = async(id,connection)=>{

    return await connection.query(`select venda.id as id, vendedor_id as produtor_id, valor_total_produtos, valor_frete, valor_desconto, valor_final,
    usuario.nome as produtor
    from venda 
    inner join usuario on (vendedor_id = usuario.id)
    where comprador_id = $1 and situacao = true and avaliacao_consumidor_id is null`, [id])
        .then((data)=>{
            return data.rows;
        }).catch((err)=>{ 
            return err;
        })
}

exports.inserirAvaliacao = async(req,connection)=>{
    const {avaliacao,voltaria_comprar} = req.body;
    return await connection.query(`INSERT INTO public.avaliacao_consumidor(
         avaliacao, voltaria_comprar)
       VALUES ( $1, $2) returning id`, [avaliacao,voltaria_comprar])
       .then((data)=>{
           return data.rows;
       }).catch((err)=>{
           return err;
       })
}

exports.atualizarVendaAvaliacao = async(dados,connection)=>{

    const {venda_id, avaliacao_id} = dados;
    return await connection.query('UPDATE VENDA SET AVALIACAO_CONSUMIDOR_ID = $1 WHERE ID = $2', [avaliacao_id,venda_id])
        .then((data)=>{
            return data;
        }).catch((err)=>{
            return err;
        })
}

exports.selecionarReputacao = async(id,connection)=>{

    return await connection.query(`select reputacao.id as id, maior_nota, menor_nota,media,quantidade_avaliacao,quantidade_pontos from usuario inner join dados_produtor on (dados_produtor.id = usuario.dados_produtor_id)
	inner join reputacao on (reputacao.id = dados_produtor.reputacao_id)
	where usuario.id = $1`,[id])
        .then((data)=>{
            return data.rows;
        }).catch((err)=>{
            return err;
        })
}

exports.atualizarReputacao = async(dados,connection)=>{
    const {id, maior_nota, menor_nota, media, quantidade_avaliacao, quantidade_pontos} = dados;
    return await connection.query(`UPDATE public.reputacao
	SET maior_nota=$1, menor_nota=$2, media=$3, quantidade_avaliacao=$4, quantidade_pontos=$5
    WHERE id = $6;`, [maior_nota,menor_nota,media,quantidade_avaliacao,quantidade_pontos,id])
        .then((data)=>{
            return data;
        }).catch((err)=>{
            return err;
        })
}

exports.getOrganicosParaVenda = async(connection)=>{
    return await connection.query(`select  organicos.id as id,produto.img as img,produto.nome as produto, organicos.quantidade as qtd, 
	organicos.preco_venda as valor,
	organicos.descricao as descricao, to_char(organicos.data_producao,'dd/MM/yyy') as fab,
    to_char(organicos.data_validade,'dd/MM/yyy') as val,
    usuario.id as produtor_id
	from organicos
	inner join produto on (organicos.produto_id = produto.id)
	inner join usuario on (organicos.produtor_id = usuario.id)
	inner join dados_produtor on (usuario.dados_produtor_id = dados_produtor_id)
	where status = true
	group by organicos.id,produto, qtd, valor, organicos.descricao, fab,val,usuario.id
	,dados_produtor.plano_produtor_id,produto.img
    order by dados_produtor.plano_produtor_id desc `)
    .then((data)=>{
        return data.rows;
    }).catch((err)=>{
        return err;
    })
}

exports.reputacaoProdutor = async(id,connection)=>{
    
    return await connection.query(`select media, usuario.nome as nome from 
	organicos inner join usuario 
	 on (organicos.produtor_id = usuario.id)
	inner join dados_produtor on (dados_produtor.id = usuario.dados_produtor_id)
	inner join reputacao on (dados_produtor.reputacao_id = reputacao.id)
	 where organicos.id = $1 `,[id])
    .then((data)=>{
        return data.rows;
    }).catch((err)=>{
        return err;
    })
}

exports.situacaoCompra = async(id,connection)=>{
    return await connection.query(`select valor_final, data_finalizada, situacao from venda where comprador_id = $1 order by id asc`,[id])
        .then((data)=>{
            return data.rows;
        }).catch((err)=>{
            return err;
        })
}