const express = require('express');
const { check, validationResult } = require('express-validator');
const router = express.Router();

const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

const plano = require('../model/plano');
const db = require('../../database/dbConnection');
const connection = db();

router.get('/planos_disponiveis', async(req,res)=>{

    try {

        const planos = await plano.selecionarPlanos(connection);

        if(!planos)
            return res.status(400).send({error: "Erro ao selecionar planos"});
        
        if(planos.length === 0)
            return res.status(400).send({error: "Nenhum registro encontrado"});

        return res.status(200).send(planos);
        
    } catch (error) {
        return res.status(400).send(error);
    }

});

router.get('/plano/produtor/:id', async(req,res)=>{

    try {

        let id = req.params.id;

        const planoProdutor = await plano.selecionarPlanoProdutor(id, connection);

        if(!planoProdutor)
            return res.status(400).send({error: "Erro ao retornar plano do produtor"});
        if(planoProdutor.length === 0)
            return res.status(400).send({error: "Nenhum dado encontrado"});

        return res.status(200).send(planoProdutor)
        
    } catch (error) {
        return res.status(400).send(error);
    }
});

router.put('/plano/atualizar', [check('id').isLength({min:1}), check('plano_id').isLength({min:1})] ,async(req,res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty())
        return res.status(442).send({error: errors.array()})
    try {

        const id_dados = await plano.SelecionarDadosProdutor(req,connection)

        if(!id_dados || id_dados.length === 0)
            return res.status(400).send({error: "Erro ao Selecionar Dados"});

        const dadosAtualizar = {id: id_dados, plano_id: req.body.plano_id};
        if(! await plano.atualizarPlano(dadosAtualizar,connection))
            return res.status(400).send({error: "Erro ao atualizar Plano"});

        return res.status(200).send({success: "Dados atualizados com sucesso"});

        
    } catch (error) {
        return res.status(400).send(error);
    }
});

module.exports = app => app.use("/planos", router);