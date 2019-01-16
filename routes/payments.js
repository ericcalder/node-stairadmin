var express = require('express');
var router = express.Router();
var path = require('path');
var CsvReadableStream = require('csv-reader');
var fs = require('fs');
const mysql=require('mysql');
const connection = mysql.createConnection({
        host     : 'localhost',
        user     : 'stairadmin',
      password: 'ericpass',
      database: 'stairadmin',
      timezone: 'utc'
    });


router.get('/', function(req,res){
	 var qry2='select c.id, c.name, p.prop,'+
	 ' DATE_FORMAT(t.tdate,"%d-%b-%Y") AS new_date, t.amt,'+
	 ' t.trans from customers'+
      ' as c inner join properties as p on c.property_id=p.id'+
      ' inner join payments as t on t.custID = c.id'+
      ' order by t.tdate DESC'+
      ' limit 25 ;'; //' && t.tdate>"2018-01-01");';
      var qry3='select id, custID, DATE_FORMAT(tdate,"%d-%b-%Y") as new_date, amt, trans from payments'+
      ' order by tdate DESC'+
      ' limit 50 ;';
      console.log('val....   qry2 ..... '+ qry3);
      
      connection.query(qry3, function(err,rows){
          if(err) throw err;
      //      console.log('Data received from Db:\n');
        //    console.log('the variable rows====',rows);
                rows.forEach( (row) => { 
                 //console.log(`${row.id} is in ${row.tdate} and ${row.trans}`); 
                });//for each
                //res.send('custID='+custID+'   '+JSON.stringify(rows)+
                //	'       '+rows[0].name);
                console.log('rows=='+rows[0].id)
//                res.send(rows)
				res.render('payments',{title: 'payments', pdata: rows})
            });//connection
	//res.end('end db_custID')
//res.render('payments');
})

router.get('/details', function(req,res){
console.log('in details')
var custID=req.query.custID;
console.log('custID=='+req.query.custID)
var qry='select c.id, c.name, p.prop'+
	 	 ' from customers'+
      ' as c inner join properties as p on c.property_id=p.id'+
      ' WHERE c.id='+custID+
      ';';

       connection.query(qry, function(err,rows){
          if(err) throw err;
           rows.forEach( (row) => { 
                 //console.log(`${row.id} is in ${row.tdate} and ${row.trans}`); 
                });
           res.send(rows)
      });
//res.send(rows);
});

router.get('/getCustID', function(req,res){
console.log('in getCustID'+'req.query.name=='+req.query.name);
var qry='select custID, tdate, trans from payments '+
		' where trans LIKE("%'+req.query.name+'%")'+
		' order by id DESC'+
		' limit 5;';
		console.log(qry)
		connection.query(qry, function(err,rows){
          if(err) throw err;
           rows.forEach( (row) => { 
                 console.log(`${row.custID} is in ${row.tdate} and ${row.trans}`); 
                });
           res.send(rows)
      });
//res.end();
});

router.get('/download',function(req,res){
	console.log('in /download');
	console.log('req.query=='+req.query.fileName)
	var inputStream = fs.createReadStream('C:/Users/Rhoda/Downloads/'+req.query.fileName, 'utf8');
  var data=[];
  //var data='';
  inputStream
    .pipe(CsvReadableStream({ parseNumbers: true, parseBooleans: true, trim: true }))
    .on('data', function (row) {
        //console.log('A row arrived: ', row[0]+'  '+row[1]+'  '+row[4]);
        //console.log('parseFloat(row[1])'+parseFloat(row[1]))
        if(parseFloat(row[1])>0 && row[4]!='Branch CREDIT'){
          //console.log('greater than zero')
        data.push(row);
        //data +=row;
        }
        //console.log('data+++++'+data)
    })
    .on('end', function () {
      //  console.log('No more rows!');
        console.log('data===='+csvToMySqlDate(data[1][0])+
        	' '+data[1][1]+' '+data[1][4]);
        
        
        var qry=[];
        var custID=0;
        for(var i=40; i<data.length; i++){
        	if(data[i][4].match(/\d{8}/)){
        		var custID=data[i][4].match(/\d{8}/)[0].slice(0,4);		
        	}
        	else {custID=0}
        var insert_qry="INSERT INTO payments (custID, tdate, amt, trans)"+
        				" SELECT "+custID+", STR_TO_DATE('"+data[i][0]+"','%d-%b-%y'), "
        				+data[i][1]+", '"+data[i][4]+"'"+
        				" WHERE NOT EXISTS"+
        				" (SELECT * FROM payments"+
        				" WHERE (tdate = STR_TO_DATE('"+data[i][0]+"','%d-%b-%y') "+
        				" AND amt="+data[i][1]+
        				" AND trans LIKE '%"+data[i][4]+"%'));";
       //console.log('insert_qry='+insert_qry);
       qry.push(insert_qry);
       
		}
		console.log('array qry=='+qry)	
	/*
     	var mult_qry="INSERT INTO payments (tdate, custID, amt, trans) VALUES";
        val='';
        var custID=0;

        for(i=80;i<data.length;i++){
        	if(data[i][4].match(/\d{8}/)){
        		custID=data[i][4].match(/\d{8}/)[0].slice(0,4);
        	}
        	else {custID=0}
        		console.log('custID++++'+custID)
        	if(i===data.length-1){
        			val= val+"(STR_TO_DATE('"+data[i][0]+"','%d-%b-%y'),"
        				+custID+","
        				+data[i][1]+", '"+data[i][4]+"');";		
        	}
        	else{
        			val= val+"(STR_TO_DATE('"+data[i][0]+"','%d-%b-%y'),"
        				+custID+","
        				+data[i][1]+", '"+data[i][4]+"'),\n";
        		}
        	}

        	var multi_insert = mult_qry+val;			
     	console.log('multi=='+multi_insert);
	*/
	/*
	for(var i=0; i<qry.length; i++){
       connection.query(qry[i], function(err,result,fields){
          if(err) throw err;
      //      console.log('Data received from Db:\n');
            console.log('result====',result);
                
            });//connection
           }
     */
        res.send(data);
    	//res.redirect('payments',{data: data})
    });
  
	//res.end();
})

module.exports = router;

function csvToMySqlDate(date){
  var month=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var DD=date.slice(0,2);
  var MM=date.slice(3,6);
  var mm = month.indexOf(MM)+1;
  mm=("0" + mm).slice(-2);
  var YYYY='20'+date.slice(7,9);
  //console.log('DD+MM+YYYY='+DD+'  '+mm+'  '+YYYY);
  //console.log('date='+YYYY+'-'+mm+'-'+DD)
  return YYYY+'-'+mm+'-'+DD;
}
