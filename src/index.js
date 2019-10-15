const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

require('./app/controller/index')(app);

app.listen(3000, ()=>{
    console.log("Servidor no Ar");
});
