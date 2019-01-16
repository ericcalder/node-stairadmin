var express = require('express');
var router = express.Router();


router.get('/', function(req, res){

   res.send('GET route on index.');
});
router.post('/', function(req, res){
   res.send('POST route on index.');
});

router.get('/:id/:name/:fruit', function(req, res){
	res.setHeader('Content-Type', 'text/plain');
	console.log('req.params', req.params);
	console.log('req.headers====', req.headers);
	console.log('req.method===', req.method);
	console.log('req.originalURL===', req.originaurl);
	console.log('req.url===', req.url);
	console.log('req.path===', req.path);
	console.log('req.body==', req.body);
		
   res.send('The id is ' + req.params.id +'The name is ' + req.params.name +'The fruit is  '+ req.params.fruit);
});

//export this router to use in our index.js
module.exports = router;