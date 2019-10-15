const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', (req,res)=>{
    return res.send('leonardo');
})

module.exports = app => app.use('/user',router);