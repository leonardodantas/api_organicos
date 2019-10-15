const jwt = require('jsonwebtoken');
const authConfig = require('../../config/auth.json');


module.exports = (req,res,next)=>{

    const authHeader = req.headers.authorization;

    if(!authHeader)
        return res.status(401).send({error: 'Sem Token'});

    const parts = authHeader.split(' ');
    
    if(!parts.length === 2 )
        return res.status(401).send({error: 'Formato de Token Invalido'});

    const  scheme = parts[0];
    
    if(!/^Bearer$/i.test(scheme))
          return res.status(401).send({error: 'Token mal formatado'});

    const token = parts[1];

    jwt.verify(token, authConfig.secret, (err,decoded)=>{
        if(err) return res.status(402).send({error: 'Token invalido'})

        return next();
    })
}