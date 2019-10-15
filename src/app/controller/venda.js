const express = require('express');
const { check, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/auth');

const db = require('../../database/dbConnection');
const connection = db();

const vendas = require('../model/venda');

const router = express.Router();

router.post("/nova_venda", [
check('organicos_id').isLength({min:1}), check('quantidade').isLength({min:1}),
check('produtor_id').isLength({min:1}), check('usuario_id').isLength({min:1})
] ,async(req,res)=>{

    //INSERIR PRODUTO UM A UM
    //SE A ULTIMA VENDA EM ABERTO FOR FALSA, POIS AINDA NÃO FOI PAGA INSERIR NELA
    //SE NÃO EXISTIR CRIAR UMA NOVA

    //INSERIR TABELA PAGAMENTO
    //TABELA AVALIAÇÃO
    //TABELA COMISSAO
    //INSERIR VENDEDOR
    //INSERIR COMPRADOR

    const errors = validationResult(req);
    if(!errors.isEmpty())
        return res.status(442).send({error: errors.array()});

    //VERIFICAR VENDA EM ABERTO
    const dados = {vendedor_id: req.body.produtor_id, comprador_id: req.body.usuario_id };
    const vendaAberto = await vendas.verificarVendaEmAberto(dados,connection);
   
    if(!vendaAberto){
        const { organicos_id, quantidade } = req.body;
        
        const organico = await vendas.selecionarOrganico(organicos_id, connection);
        if(!organico)
            return res.status(400).send({error: "Produto não encontrado"});
        
        if(quantidade > organico.quantidade){
            
            let valor = quantidade * organico.preco_venda;
            let momento = "Requisição Inicial do Produto";
            const prodIndiponivel = {id_produto: organicos_id , id_consumidor:req.body.usuario_id ,id_produtor: req.body.produtor_id,
                quantidade_requida: quantidade ,quantidade_disponivel: organico.quantidade ,
                valor_perdido: valor, momento: momento};
            
            if(! await vendas.inserirLogProdIndiponivel(prodIndiponivel, connection))
                return res.status(400).send({error: "Erro ao inserir na tabela Logs de Estoque Indis."});
            
            return res.status(400).send({error: "Quantidade indisponivel"});
        }

        const valor =  quantidade * organico.preco_venda;
        const inserirNovaVenda = {vendedor_id: req.body.produtor_id, comprador_id: req.body.usuario_id, valor_total: valor};
        const idNovaVenda = await vendas.novaVenda(inserirNovaVenda,connection);

        if(!idNovaVenda)
            return res.status(400).send({error: "Falha ao iniciar nova venda"});

        const inserirProduto = {organicos_id: req.body.organicos_id, venda_id: idNovaVenda, quantidade: quantidade,valor_unitario: organico.preco_venda,valor_total: valor};

        if(!await vendas.adicionarNovoProduto(inserirProduto,connection))
            return res.status(400).send({error: "Erro ao adicionar o primeiro produto"});

        return res.status(200).send({success: "Nova Venda iniciada com sucesso", 
                                    inserirNovaVenda, idNovaVenda, inserirProduto, cod:60});
    }
    else {
        
        const vendaEmAberto = await vendas.selecionarVendaEmAberto(dados, connection);

        if(vendaEmAberto === 0)
            return res.status(400).send({error: "Erro ao continuar venda"});
        
        const { organicos_id, quantidade } = req.body;

        const organico = await vendas.selecionarOrganico(organicos_id, connection);
        if(!organico)
            return res.status(400).send({error: "Produto não encontrado"});
            
            if(quantidade > organico.quantidade){
            
                let valor = quantidade * organico.preco_venda;
                let momento = "Requisição de Produto em andamento";
                const prodIndiponivel = {id_produto: organicos_id , id_consumidor:req.body.usuario_id ,id_produtor: req.body.produtor_id,
                    quantidade_requida: quantidade ,quantidade_disponivel: organico.quantidade ,
                    valor_perdido: valor, momento: momento};
                
                if(! await vendas.inserirLogProdIndiponivel(prodIndiponivel, connection))
                    return res.status(400).send({error: "Erro ao inserir na tabela Logs de Estoque Indis."});
                
                return res.status(400).send({error: "Quantidade indisponivel"});
            }
    
        const valor =  quantidade * organico.preco_venda;
        const inserirNovaVenda = {id: vendaEmAberto[0].id,vendedor_id: req.body.produtor_id, comprador_id: req.body.usuario_id, valor_total: valor};
        if(! await vendas.atualizarVenda(inserirNovaVenda, connection))
            return res.status(400).send({error: "Erro ao atualizar venda"});

        const inserirProduto = {organicos_id: req.body.organicos_id, venda_id: vendaEmAberto[0].id, quantidade: quantidade,valor_unitario: organico.preco_venda,valor_total: valor};

        if(! await vendas.adicionarNovoProduto(inserirProduto,connection))
            return res.status(400).send({error: "Erro ao inserir produto em venda ja aberta"});

        return res.status(200).send({success:"Venda Atualizada com Sucesso" ,inserirNovaVenda,inserirProduto, cod:61});
        
    }
    
});

router.get("/vendas_abertas/:id",  async(req,res)=>{

    try {
       
        const  id  = req.params.id;
        const vendasAbertas = await vendas.vendasAbertas(id, connection);

        if(!vendasAbertas)
            return res.status(400).send({error: "Erro ao acessar banco de dados"});

        return res.status(200).send(vendasAbertas);

    } catch (error) {
         
    }
});

router.get("/produtos_venda_aberta/:id", async(req,res)=>{

    try {
        
        const id = req.params.id;
        const produtosVendas = await vendas.produtosVendasAbertas(id, connection);

        if(!produtosVendas)
            return res.status(400).send({error: "Erro ao selecionar do Banco de Dados"});

        return res.status(200).send(produtosVendas);
    } catch (error) {
        
    }
});

router.get("/produtos_mais_vendidos/:id", async(req,res)=>{

    try {

    const id = req.params.id;
    const organicosMaisVendidos = await vendas.organicosMaisVendidos(connection);
    const meusOrganicosMaisVendidos = await vendas.meusOrganicosMaisVendidos(id, connection);
    if(!organicosMaisVendidos)
        return res.status(400).send({error: "Erro ao consultar Banco de Dados"});
    
    if(!meusOrganicosMaisVendidos)
        return res.status(400).send({error: "Erro ao consultar Banco de Dados"});
    
    return res.status(200).send({organicosMaisVendidos,meusOrganicosMaisVendidos});
        
    } catch (error) {
        return res.status(400).send(error)
    }
});

router.get("/lucro/:id", async(req,res)=>{

    try {

        const id = req.params.id;

        const maiorLucros = await vendas.maioresTaxasLucro(connection);
        const meusMaioresLucros = await vendas.minhasMaioresTaxasLucro(id,connection);

        if(!maiorLucros)
            return res.status(400).send({error: "Erro ao consultar Banco de Dados"});

        if(!meusMaioresLucros)
            return res.status(400).send({error: "Erro ao consultar Banco de Dados"});

        return res.status(200).send({maiorLucros, meusMaioresLucros});
        
    } catch (error) {
        return res.status(400).send(error);
    }

});

router.put('/atualizar_frete_desconto',[check('frete').isLength({min:1}), check('desconto').isLength({min:1}),
check('id').isLength({min:1})], 
authMiddleware ,async(req,res)=>{

    try {

        const errors = validationResult(req);
        if(!errors.isEmpty())
            return res.status(442).send({error: errors.array()});

        if(! await vendas.atualizarDescontoFrete(req,connection))
            return res.status(400).send({error: "Erro ao atualizar Frete e Desconto"});

        return res.status(200).send({success: "Sucesso ao atualizar frete e desconto"});
        
    } catch (error) {
        return res.status(400).send(error);        
    }
});

router.post('/remover_um_produto', [check('produtos_venda_id').isLength({min:1})] ,async(req,res)=>{

    try {

        const errors = validationResult(req);
        if(!errors.isEmpty())
            return res.status(442).send(errors);

        const { produtos_venda_id } = req.body;
        const produtoVenda = await vendas.selecionarProdutoVendaUsuario(produtos_venda_id,connection);
        if(!produtoVenda)
            return res.status(400).send(produtoVenda);
        
        if(produtoVenda[0].quantidade > 0){
            if(! await vendas.removerUmProduto(produtos_venda_id, connection))
                return res.status(400).send({error: "Erro ao remover produto"});
            
            const dados = {valor_unitario: produtoVenda[0].valor_unitario, id:produtoVenda[0].venda_id};
            if(! await vendas.atualizarValorVendaTotal(dados,connection))
                return res.status(400).send({error: "Erro ao Atualizar Tabela Venda"}); 

            return res.status(200).send({success: "Sucesso ao Remover",produtoVenda});
        }
        return res.status(200).send(produtoVenda);

        
    } catch (error) {
        return res.status(400).send(error);
    }
});

router.post('/adicionar_um_produto', [check('produtos_venda_id').isLength({min:1})] ,async(req,res)=>{

    try {

        const errors = validationResult(req);
        if(!errors.isEmpty())
            return res.status(442).send(errors);

        const { produtos_venda_id } = req.body;
        const produtoVenda = await vendas.selecionarProdutoVendaUsuario(produtos_venda_id,connection);
        if(!produtoVenda)
            return res.status(400).send(produtoVenda);

        const qtd = await vendas.verificarQuantidade(produtoVenda[0].organicos_id,connection);
        if(produtoVenda[0].quantidade + 1 > qtd[0].quantidade)
            return res.status(400).send({error: "Quantidade maior do que o estoque"});
        
        else {

            if(! await vendas.adicionarUmProduto(produtos_venda_id, connection))
                return res.status(400).send({error: "Erro ao remover produto"});
            
            const dados = {valor_unitario: produtoVenda[0].valor_unitario, id:produtoVenda[0].venda_id};
            if(! await vendas.atualizarValorVendaTotalAdd(dados,connection))
                return res.status(400).send({error: "Erro ao Atualizar Tabela Venda"});

            return res.status(200).send({success: "Sucesso ao Adicionar",produtoVenda});

        }
            
    } catch (error) {
        return res.status(400).send(error);
    }
});
router.get('/vendas_abertas_usuario/:id', async(req,res)=>{

    try {
        const id = req.params.id;
        const vendasAbertasUsuario = await vendas.vendasAbertasUsuario(id,connection);
        if(!vendasAbertasUsuario)
            return res.status(400).send({error: "Erro ao acessar banco de dados"});

        const idvenda = await vendasAbertasUsuario[0].id;
    
        const produtosVendasAberta = await vendas.visualizarProdutosVendaUsuario(idvenda,connection);
        if(!produtosVendasAberta)
            return res.status(400).send({error: "Erro ao acessar banco de dados"});

        return res.status(200).send({vendasAbertasUsuario, produtosVendasAberta});
    } catch (error) {
        return res.status(400).send(error);
    }
});

router.post('/finalizar_venda_usuario', [
    check('venda_id').isLength({min:1}),
    check('vendedor_id').isLength({min:1}),
    check('tipo_pagamento').isLength({min:1})
], async(req,res)=>{
    try {
        const errors = validationResult(req);
        if(!errors.isEmpty())
            return res.status(442).send({error: errors.array()});
        
        const {venda_id, vendedor_id} = req.body;
        const produtosEmFalta =  await vendas.verificarQuantidadeParaBaixa(venda_id, connection);
        //verificar ser existe quantidade suficiente para baixar
        if(produtosEmFalta.length > 0)
            return res.status(400).send(produtosEmFalta)
        
        await vendas.selecionarOrganicos(venda_id, connection)
       .then((data)=>{
           //baixar organico por organico
            data.forEach(element => {
                let dados = {id: element.organicos_id ,quantidade: element.quantidade};
                vendas.baixarQuantidadeEstoque(dados,connection);
            });
       });

       //verificar comissao do sistema
       const comissaoSistema = await vendas.comissaoSistema(connection);
       if(!comissaoSistema)
            return res.status(400).send({error:"Erro ao acessar comissao do sistema"})
       //verificar valores da venda
       const venda = await vendas.selecionarVenda(venda_id,connection);
       if(!venda)
            return res.status(400).send({error: "Erro ao acessar valores de venda"});
       //inserir pagamento
       const dadosPagamento = {valor_pago: parseInt(venda[0].valor_total_produtos) + parseInt(venda[0].valor_total_produtos) * (venda[0].valor_frete/100) - venda[0].valor_total_produtos * (venda[0].valor_desconto/100)
        -venda[0].valor_total_produtos * (comissaoSistema[0].porcentagem/100), 
        tipo_pagamento: req.body.tipo_pagamento};
       const idPagamento = await vendas.inserirPagamento(dadosPagamento,connection);
       if(!idPagamento)
            return res.status(400).send({error: "Erro ao inserir Pagamento"});
        //atualizar a venda
       
            const valoresVenda = {valor_total_produtos: venda[0].valor_total_produtos, 
        frete: venda[0].valor_total_produtos * (venda[0].valor_frete/100), 
        desconto: venda[0].valor_total_produtos * (venda[0].valor_desconto/100),
        valor_final: parseInt(venda[0].valor_total_produtos) + parseInt(venda[0].valor_total_produtos) * (venda[0].valor_frete/100) - venda[0].valor_total_produtos * (venda[0].valor_desconto/100),
        valor_sistema: venda[0].valor_total_produtos * (comissaoSistema[0].porcentagem/100),
        valor_para_produtor: parseInt(venda[0].valor_total_produtos) + parseInt(venda[0].valor_total_produtos) * (venda[0].valor_frete/100) - venda[0].valor_total_produtos * (venda[0].valor_desconto/100)
        -venda[0].valor_total_produtos * (comissaoSistema[0].porcentagem/100),
        id_pagamento: idPagamento[0].id,id_venda: venda_id}

        if(!await vendas.atualizarVendaParaFinalizar(valoresVenda,connection))
                return res.status(400).send({error: "erro ao atualizar e finalizar venda"});
        //inserir na tabela comissao venda
        const dadosComissaoVenda = {venda_id: venda_id, comissao_sistema_id: comissaoSistema[0].id, 
            valor_total_venda:venda[0].valor_total_produtos  , 
            valor_total_comissao:  venda[0].valor_total_produtos * (comissaoSistema[0].porcentagem/100),
             porcentagem:comissaoSistema[0].porcentagem }

        if(!await vendas.inserirComissaoVenda(dadosComissaoVenda,connection))
            return res.status(400).send({error: "Erro ao inserir na tabela comissao venda"});
        //atualizar tabela de comissão do sistema
        const comissaoSis = {valo_total: venda[0].valor_total_produtos * (comissaoSistema[0].porcentagem/100), id:comissaoSistema[0].id};
        if(! await vendas.atualizarComissaoSistema(comissaoSis,connection))
            return res.status(400).send({error: "Erro ao atualizar a comissao do sistema"});        
        return await res.status(200).send({dadosPagamento,valoresVenda,dadosComissaoVenda});
        
    } catch (error) {
        
    }
});

router.get('/vendas_para_finalizar/:id' ,async(req,res)=>{

    try {
        
        const id = req.params.id;
        const vendasParaFinalizar = await vendas.vendasParaFinalizar(id,connection);
        if(!vendasParaFinalizar)
            return res.status(400).send({error: "Erro ao acessar vendas para finalizar"});

        return res.status(200).send(vendasParaFinalizar);
        
    } catch (error) {
        return res.status(400).send(error);
    }
});

router.put('/finalizar_venda_vendedor', async(req,res)=>{

    try {
        if(!await vendas.atualizarVendaFinalizada(req.body.id, connection))
            return res.status(400).send({error: "Erro ao finalalizar Venda"});
        return res.status(200).send({success: "Venda Finalizada com Sucesso"})
    } catch (error) {
        return res.status(400).send(error);
    }
})

router.get('/vendas_para_avaliar/:id', async(req,res)=>{

    try {

        const id = req.params.id;
        const vendasParaAvaliar = await vendas.getVendasNaoAvaliadas(id,connection);
        if(!vendasParaAvaliar)
            return res.status(400).send({error:"Erro ao acessar banco de dados"});

        return res.status(200).send({vendasParaAvaliar})
        
    } catch (error) {
        return res.status(400).send(error);
    }
});

router.post('/avaliar_venda',[
    check('venda_id').isLength({min:1}),
    check('avaliacao').isFloat({min:0.0, max:10.0})
] ,async(req,res)=>{

    try {
        const errors = validationResult(req);
        if(!errors.isEmpty())
            return res.status(442).send({error: errors});
        const idAvaliacao =  await vendas.inserirAvaliacao(req,connection);
     
        if(!idAvaliacao)
            return res.status(400).send({error: "Erro ao inserir atualização"});

        const dados = {venda_id: req.body.venda_id, avaliacao_id: idAvaliacao[0].id};

        if(! await vendas.atualizarVendaAvaliacao(dados,connection))
            return res.status(400).send({error: "Erro ao atualizar tabela venda com a avaliação"});

        const reputacao = await vendas.selecionarReputacao(req.body.vendedor_id,connection);
        let maior_nota  = reputacao[0].maior_nota < req.body.avaliacao ? req.body.avaliacao : reputacao[0].maior_nota;
        let menor_nota =  reputacao[0].menor_nota > req.body.avaliacao ? req.body.avaliacao : reputacao[0].menor_nota;
        let qtd_avaliacao = parseInt(reputacao[0].quantidade_avaliacao) + 1;
        let quantidade_pontos = parseInt(reputacao[0].quantidade_pontos) + parseInt(req.body.avaliacao);
        let media = quantidade_pontos/qtd_avaliacao;
        const dadosReputacao = {id: reputacao[0].id, maior_nota:maior_nota, menor_nota:menor_nota, media:media, quantidade_avaliacao:qtd_avaliacao, quantidade_pontos:quantidade_pontos};
        if(!vendas.atualizarReputacao(dadosReputacao,connection))
            return res.status(400).send({error:"Erro ao inserir reputação"});
        return res.status(200).send({dadosReputacao});


    } catch (error) {
        return res.status(400).send(error);
    }
});

router.put('/alterar_status', async(req,res)=>{
    try {
        
        if(! await vendas.atualizarStatus(req,connection))
            return res.status(400).send({error: "Erro ao atulizar Sistema"});
        return res.status(200).send({success: "Sucesso ao Atualizar"});
        
    } catch (error) {
        return res.status(400).send({error});
    }
});

router.get('/produtos_para_venda', async(req,res)=>{

    try {
        const produtos = await vendas.getOrganicosParaVenda(connection);
        if(!produtos)
            return res.status(400).send({error: "Erro ao consultar banco de dados"});

        return res.status(200).send({produtos});
    } catch (error) {
        return res.status(442).send(error);
    }
});

router.get('/media/:id', async(req,res)=>{
    try {
        const id = req.params.id;
        const media = await vendas.reputacaoProdutor(id,connection);
        if(! media)
            return res.status(400).send({error: "Erro ao acessar banco de dados"});
        return res.status(200).send({media})
    } catch (error) {
        return res.status(400).send({error});
    }
});

router.get('/situacao_compras/:id', async(req,res)=>{

    try {
        const id = req.params.id;
        const situacao = await vendas.situacaoCompra(id,connection);
        if(! situacao)
            return res.status(400).send({error: "Erro ao consultar banco de dados"});
        return res.status(200).send(situacao);
    } catch (error) {
        return res.status(400).send(error);
    }
});

module.exports = app => app.use("/venda", router);