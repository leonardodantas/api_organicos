const express = require('express');
const { check, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

const organico = require('../model/organicos');

const db = require('../../database/dbConnection');
const connection = db();
 
async function generateErros(req,res){

    const errors = validationResult(req);
    if(!errors.isEmpty())
        return await res.status(442).send({error: errors.array()});
}

router.get('/local_producao', authMiddleware, async(req,res)=>{

    const cidades = await organico.selecionarTodasCidades(connection);

    if(!cidades)
        return res.status(400).send({error: "Erro ao selecionar cidades"});
    return res.status(200).send(cidades);
});

router.post('/inserir',[
    check('produtor_id').isLength({min:1}),
    check('cidade_id').isLength({min:1}),
    check('produto_id').isLength({min:0}),
    check('quantidade').isInt({min:1}),
    check('preco_producao').isFloat(),
    check('preco_venda').isFloat(),
    check('descricao').isLength({min:10}),
    check('data_producao').isLength({min:1}),
    check('data_validade').isLength({min:1})
    
], authMiddleware, async (req,res)=>{

    generateErros(req,res);

    try {

        const { produtor_id, cidade_id } = await req.body;

        if(!await organico.verificarIdProdutor(produtor_id,connection))
            return await res.status(400).send({error: "ID incomparivel com a categoria"});

        const id = await organico.inserirLocalProducao(cidade_id, connection);

        if(!id)
            return await res.status(400).send({error: "Erro ao inserir local de producao"});

        req.body.local_producao_id = id;
        
        if(!await organico.inserirProduto(req,connection))
            return await res.status(400).send({error: "Erro ao inseir no banco de dados"});

        return await res.status(200).send(req.body);
        

    } catch (error) {
        return res.status(400).send(error);
    }

});

router.get("/listar", authMiddleware, async (req,res)=>{

    try {
        const organicosListar = await organico.selecionarTodosOrganicos(connection);

        if(!organicosListar)
            return res.status(400).send({error: "Erro ao retornar banco de dados"});

        if(organicosListar.length === 0)
            return res.status(400).send({error: "Nenhum registro encontrado"});
    
        return res.status(200).send({organicosListar});
        
    } catch (error) {
        return res.status(400).send(error);
    }

});

router.get("/listar/produtor/:id", async (req,res)=>{

    const organicosProdutor = await organico.selecionarOrganicosProdutor(req,connection);

    if(!organicosProdutor)
        return res.status(400).send({error: "Erro ao retornar banco de dados"});
    
    if(organicosProdutor.length === 0)
        return res.status(200).send([]);
    
    return res.status(200).send({organicosProdutor});
});

router.get("/listar/todos/produtor/:id", async (req,res)=>{

    const organicosProdutor = await organico.selecionarTodosOrganicosProdutor(req,connection);

    if(!organicosProdutor)
        return res.status(400).send({error: "Erro ao retornar banco de dados"});
    
    if(organicosProdutor.length === 0)
        return res.status(200).send([]);
    
    return res.status(200).send({organicosProdutor});
});

router.get("/listar/:id_produto/produtor/:id", authMiddleware,async (req,res)=>{

    const organicosProdutor = await organico.selecionarOrganicosProdutorProduto(req,connection);

    if(!organicosProdutor)
        return res.status(400).send({error: "Erro ao retornar banco de dados"});
    
    if(organicosProdutor.length === 0)
        return res.status(400).send({error: "Nenhum registro encontrado"});
    
    return res.status(200).send({organicosProdutor});
});

router.get('/estoque_minimo/:id', async(req,res)=>{

    try {

        const id = req.params.id;
        const estoqueMinimo = await organico.estoqueMinimo(id,connection);
        if(!estoqueMinimo)
            return res.status(400).send({error: "Erro ao acessar Banco de Dads"});

        return res.status(200).send(estoqueMinimo);

    } catch (error) {
        return res.status(400).send({error});
    }
})

//router.get("listar")

module.exports = app => app.use('/organicos', router);