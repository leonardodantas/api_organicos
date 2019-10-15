const express = require('express');
const { check, validationResult} = require('express-validator');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

const produto = require('../model/produtos');

const db = require('../../database/dbConnection');
const connection = db();

router.get("/todos_produtos",authMiddleware ,async (req,res)=>{

    try {
        const todosProdutos = await produto.selecionarTodosProdutos(connection);
        
        if(!todosProdutos)
            return res.status(400).send({error: "Erro ao acessar banco de dados"});
        
        if(todosProdutos.length === 0)
            return res.status(400).send({error: "Nenhum registro encontrado"});

        return res.status(200).send({todosProdutos});
        
    } catch (error) {
        return res.status(400).send({error});
    }
});

router.get("/produto/:id" ,authMiddleware ,async (req,res)=>{

    try {
        const id = req.params.id;
        const todosProdutos = await produto.selecionarProduto(id,connection);
        
        if(!todosProdutos)
            return res.status(400).send({error: "Nenhum registro encotrado"});

        return res.status(200).send({todosProdutos});
        
    } catch (error) {
        return res.status(400).send({error});
    }
});

router.post("/inserir",[check('nome').isLength({min:6})], authMiddleware, async(req,res)=>{

    const errors = validationResult(req);

    if (! errors.isEmpty()) 
        return await res.status(422).json({ errors: errors.array() });

    try {
        const { nome } = req.body;
        
        if(!await produto.inserirProduto(nome,connection))
            return res.status(400).send({error: "Erro ao inserir sistema"});

        const produtoDados = req.body;
        return res.status(200).send({success: "Produto inserido com sucesso",produtoDados});

    } catch (error) {
        return res.status(400).send(error);
    }
});


module.exports = app => app.use("/produto",  router);