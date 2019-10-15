const express = require('express');
const { check, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

const sistema = require('../model/sistema');

const db = require('../../database/dbConnection');
const connection = db();


router.get("/dados_atuais" ,async (req,res)=>{

    try {

        const dadosAtuais = await sistema.dadosSistema(connection);

        if(!dadosAtuais)
            return res.status(400).send({error: "Erro ao acessar banco de dados"});
        
        if(dadosAtuais === undefined )
            return res.status(400).send({error: "Nenhum dado encontrado"});

        return res.status(200).send(dadosAtuais)
        
    } catch (error) {
        return res.status(400).send({error})
    }

});

router.get("/todos_dados", async (req,res)=>{

  try {
        const todoDadosSistema = await sistema.todosDadosSistema(connection);

        if(!todoDadosSistema)
            return res.status(400).send({error: "Erro ao acessar banco de dados"});

        if(todoDadosSistema === undefined)
            return res.status(400).send({error: "Nenhum dado encontrado"});

        return res.status(200).send(todoDadosSistema);
  } catch (error) {
      return res.status(400).send(error);
  }

});

router.get("/logs_login" ,async (req,res)=>{
    
    try {

        const logsLogin = await sistema.logsLogin(connection);

        if(!logsLogin)
            return res.status(400).send({error: "Erro ao acessar banco de dados"});

        if(logsLogin === undefined)
            return res.status(400).send({error:"Nenhum dado encontrado"});

        
        return res.status(200).send(logsLogin);
        
    } catch (error) {
        return res.status(400).send(error);    
    }
});

router.get("/logs_produtos", authMiddleware, async (req,res)=>{
    
    try {

        const logsLogin = await sistema.logsProdutos(connection);

        if(!logsLogin)
            return res.status(400).send({error: "Erro ao acessar banco de dados"});

        if(logsLogin === undefined)
            return res.status(400).send({error:"Nenhum dado encontrado"});

        
        return res.status(200).send(logsLogin);
        
    } catch (error) {
        return res.status(400).send(error);    
    }
});

router.post("/atualizar_sistema", [check('porcentage').isLength({min:0.0, max:100.0})], authMiddleware ,async(req,res)=>{

    const errors = validationResult(req);
    if(! errors.isEmpty())
        return await res.status(442).send({error: errors.array()});

    const sistemaDados  = req.body;
    try {

        if(! await sistema.atualizarTabelaComissao(req,connection))
            return await res.status(400).send({error: "Erro ao atualizar sistema"});

        return res.status(200).send({success: "Dados Atualizados com sucesso", sistemaDados })
        
    } catch (error) {
        return res.status(400).send({error});
    }

});

router.get('/valores_sistema', async(req,res)=>{

    try {
        const valoresAbertos = await sistema.valoresEmAberto(connection);
        const valoresFinalizados = await sistema.valoresFinalizados(connection);
        const mediasComissoes = await sistema.mediasComissoes(connection);

        if(!valoresAbertos || !valoresFinalizados || !mediasComissoes)
            return res.status(400).send({error: "Erro ao consultar Banco de Dados"});

        return res.status(200).send({valoresAbertos, valoresFinalizados, mediasComissoes});
    } catch (error) {
        return res.status(400).send({error});
    }
});

module.exports = app => app.use("/sistema", router);