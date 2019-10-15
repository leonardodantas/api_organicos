const express = require('express');
const { check } = require('express-validator');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const authMiddleware = require('../middleware/auth');

const authConfig = require('../../config/auth.json');

const user = require('../model/usuario');
const db = require('../../database/dbConnection');
const connection = db();

const router = express.Router();

//usar em todas as rotas
//router.use(authMiddleware);

function generateToken(params = {}){
    return token = jwt.sign(params, authConfig.secret,{
        expiresIn: 89409
    });
}

async function generateErrors(req, res){

    const errors = validationResult(req);
    if (! errors.isEmpty()) 
        return await res.status(422).json({ errors: errors.array() });

}

router.get('/' ,async (req,res)=>{
    
    await user.get(connection)
    .then((data)=>{
        res.send(data);
    }); 

});

router.post('/cadastrar',[check('email').isEmail(),
    check('senha').isLength({min: 6}), check('cpf').isLength({min:11})], async (req,res)=>{
 
    const errors = validationResult(req);
    if (! errors.isEmpty()) 
        return await res.status(422).json({ errors: errors.array(), error: 52 });
  
    try {

        const { tipo_user_id } = req.body;

        if(!tipo_user_id || tipo_user_id >= 2){
            req.body.tipo_user_id = 2;
            req.body.dados_produtor_id = 1;
        }
        else {

            const idReputacao = await user.inserirReputacao(connection);
            const idValores = await user.inserirValoresGastor(connection);
            if(!idReputacao || !idValores)
                return res.status(400).send({error: "Falha ao inserir valores da tabela reputação ou valores"});
            
            const dados = {reputacao_id: idReputacao, valores: idValores};
           
            const dados_produtor_id = await user.inserirDadosProdutor(dados, connection);

            if(!dados_produtor_id || dados_produtor_id === undefined)
                return res.status(400).send({error: "Erro ao criar tabela dados_produtor"})

            req.body.tipo_user_id = 1;
            console.log(dados_produtor_id[0].id)
            req.body.dados_produtor_id = dados_produtor_id[0].id;

        }
        
        if(await user.emailAndCpf(req,connection))
            return res.status(400).send({error:51});
        
        const hash = await bcrypt.hash(req.body.senha,10); 

        req.body.senha = hash;

        if(await user.cadastrarUsuario(req,connection)){
            req.body.senha = undefined;
            const usuario = {nome: req.body.nome, email: req.body.email, cpf: req.body.cpf }
            return res.status(200).send(usuario);
        }

        return res.status(400)("ERRO AO CADASTRAR USUARIO");
               
        
    } catch (error) {
        return res.status(400).send(error);
    }
    
});

router.post('/login',[check('email').isEmail(), check('senha').isLength({min:6})], async (req,res)=>{

    const errors = validationResult(req);
    if (! errors.isEmpty()) 
        return await res.status(422).json({ errors: errors.array(), error: 52 });
    
    try {

        const { email, senha } = req.body;
        const usuario =  await  user.autenticarEmail(email,connection)
        
        if(await usuario.length === 0)
            return res.status(400).send({error : 54});
            
        if(! await bcrypt.compare(senha, usuario[0].senha))
            return res.status(400).send({error: 53});

        usuario[0].senha = undefined;

        if(await user.atualizarUltimoLogin(usuario[0].id, connection))
            return await res.status(200).send({usuario, token: generateToken({id: usuario.id})})

    } catch (error) {
        return res.status(400).send(error);
    }

});

router.put('/atualizar', [
    check('nome').isLength({min:8}), check('numero_celular').isLength({min:8}),check('numero_telefone').isLength({min:8})
] ,authMiddleware, async (req,res)=>{

    const errors = validationResult(req);
    if (! errors.isEmpty()) 
        return await res.status(422).json({ errors: errors.array(), error: 52 });

    try {

        if(!await user.atualizarUser(req,connection))
            return res.status(400).send({error: "Erro ao atualizar dados"});

        return res.status(200).send({success: "Usuario atualizado com sucesso"});
        
    } catch (error) {
        return res.status(400).send({error: "Erro banco de dados"});
    }    

});

router.put('/atualizar_senha',[check('senha').isLength({min:6})] ,authMiddleware, async(req,res)=>{

    generateErrors(req,res);

    try {

        const { id, senha ,nova_senha } = req.body;
        const senha_b  = await user.conferirSenha(id, connection);

        if(! await bcrypt.compare(senha,senha_b[0].senha))
            return res.status(400).send({error: "Senha invalida"});

        const hash = await bcrypt.hash(nova_senha, 10);
        req.body.nova_senha = hash;
        
        if(await user.novaSenha(req, connection)){
            return res.status(200).send({success: "Senha alterada com sucesso"});
        }

        return await res.status(400).send({error: "Erro ao atualizar senha"});
        
    } catch (error) {
        return await res.status(400).send({error});
    }

});

router.put('/conf_email', [check('id').isLength({min: 1})],authMiddleware, async (req,res)=>{

    generateErrors(req,res);

    try {

        if(await user.confirmarEmail(req, connection)){
            const usuario = await user.conferirEmail(req,connection);

            if(usuario.length > 0)
                return await res.status(200).send({usuario});
        }
            

        return await res.status(400).send({error: "Erro ao confirmar email"});
        
    } catch (error) {
        return await res.status(400).send({error});
    }
});

router.get('/conferir_email', [check('id').isLength({min:1})] ,authMiddleware, async (req,res)=>{

    generateErrors(req,res);

    try {

        const usuario = await user.conferirEmail(req,connection);

        if(usuario.length > 0)
            return await res.status(200).send({usuario});
        
        return await res.status(400).send({error: "Erro ao verificar Email do Usuario"});
        
    } catch (error) {
        return await res.status(400).send({error});
    }

});

router.get('/dados_usuario/:id', authMiddleware,[check('id').isLength({min: 1})]
    , async(req,res)=>{

    const errors = validationResult(req);
    if (! errors.isEmpty()) 
        return await res.status(422).json({ errors: errors.array() });

    try {
        const id = req.params.id;

        const dadosUsuario = await user.selecionarDadosUsuario(id,connection);
        if(dadosUsuario.length === 0)
            return res.status(400).send({result: 0});
        
        const vendasImpo = await user.vendasImpossibilitadas(id, connection);
        if(!vendasImpo.length === 0) 
            return res.status(400).send({result: 0});

        const ultimasVendFina = await user.ultimasVendasFinalizadas(id, connection);
        if(!ultimasVendFina === 0)  
            return res.status(400).send({result: 0});
        
        const todosDados = {dadosUsuario, vendasImpo, ultimasVendFina};
        return res.status(200).send(todosDados);
    } catch (error) {
        return await res.status(400).send({error});
    
    }

        
});

router.get('/vendas_impossibilitadas/:id', authMiddleware, async(req,res)=>{

    try {
        const id = req.params.id;
        const vendasImpossibilitadas = await user.vendasImpossibilitadas(id, connection);
        if(!vendasImpossibilitadas)
            return res.status(400).send({error: "Erro ao selecionar vendas"});

        return res.status(200).send(vendasImpossibilitadas);
    } catch (error) {
        return res.status(400).send(error);
    }
});

router.get('/dados_dashboard/:id',authMiddleware ,[check('id').isLength({min:1})] ,async(req,res)=>{

    const errors = validationResult(req);
    if(! errors.isEmpty())
        return res.status(442).send({error: errors.array()});

    const id = req.params.id;
    
    const brutoLiquido = await user.brutoLiquido(id, connection);
    if(!brutoLiquido)
        return res.status(400).send({error: "1Nenhum registro encontrado"});

    const avaliacao = await user.reputacaoVendedor(id,connection);
   
    if(!avaliacao) 
        return res.status(400).send({error: "2Nenhum registro encontrado"}); 
    
    const vendasAberto = await user.vendasAberto(id,connection);
    if(!vendasAberto)
        return res.status(400).send({error: "3Nenhum registro encontrado"});

    const dados = {brutoLiquido, avaliacao, vendasAberto}
        return res.status(200).send(dados);
});

router.get("/reputacao/:id", async(req,res)=>{

    try {
        
        const id = req.params.id;
        const reputacao = await user.reputacaoVendedor(id, connection);

        if(!reputacao)
            return res.status(400).send({error: "Erro ao somar reputação"});

        return res.status(200).send({reputacao});
    } catch (error) {
        return res.status(400).send(error);
    }
});

router.get('/maior_consumidor/:id', async(req,res)=>{

    try {
        const id = req.params.id;
        const maiorConsumidor = await user.maiorConsumidor(id,connection);
        if(!maiorConsumidor)
            return res.status(400).send({error: "Erro ao acessar banco de dados"});

        return res.status(200).send(maiorConsumidor);
    } catch (error) {
        return res.status(400).send(error);
    }
});

router.get('/ultima_finalizada/:id', async(req,res)=>{

    try {
        const id = req.params.id;
        const ultimaFinalizada = await user.ultimaVenda(id, connection);
        if(!ultimaFinalizada)
            return res.status(400).send({error: "Erro ao acessar Banco de Dados"});
        return res.status(200).send(ultimaFinalizada);
    } catch (error) {
        return res.status(400).send(error);
    }
});

module.exports = app => app.use('/usuario', router);

/*
INSERT INTO public.usuario(
	 dados_produtor_id, tipo_user_id, nome, nascimento, 
	cpf, numero_telefone, numero_celular, email, 
	email_confirmado, sexo, criado, atualiado, ultimo_login)
	VALUES ( 1, 1, 'leonardo', now(), '2131231', 
			'32132131', '213132', 'leona@dan.com', true,
			'mascu', now(), now(), now());*/ 