var express = require('express');
var app = express();
var index = require('./routes/index.js');
var locate = require('./routes/locate');
var file = require('./routes/file');
var csv = require('./routes/csv');
var payments = require('./routes/payments');
var bodyParser = require('body-parser');
var path = require('path');
var mw = require("./myMiddleware/myMiddleware.js");
const mysql=require('mysql');
var fs = require('fs');
var pdf = require('html-pdf');


/////// db connection ////
const connection = mysql.createConnection({
        host     : 'localhost',
        user     : 'stairadmin',
      password: 'ericpass',
      database: 'stairadmin'
    });

connection.connect((err) => {
        if (err) throw err;
        console.log('Connected!');
});
/////////////////////////////////////////////

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//app.use(express.static(path.join(__dirname, 'public')));

app.use('/locate',locate);
app.use('/file',file);
app.use('/csv',csv);
app.use('/payments',payments);



app.listen(3000);


