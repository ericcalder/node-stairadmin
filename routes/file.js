var express = require('express');
var router = express.Router();
var path = require('path');

router.get('/',function(req,res,next){
	
	//res.sendFile(path.resolve('views', 'file.ejs'));
	res.render('file');
	//res.end('end')
})
module.exports = router;