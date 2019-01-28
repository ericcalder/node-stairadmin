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
  res.render('csv',
          {title: 'csv page'})
})


router.get('/download', function(req,res){
	console.log('in /download');
  console.log('req.query=='+req.query.fileName)
  var inputStream = fs.createReadStream('C:/Users/Rhoda/Downloads/'+req.query.fileName, 'utf8');
  var record=[];
  var data=[];
  //var data='';
  inputStream
    .pipe(CsvReadableStream({ parseNumbers: true, parseBooleans: true, trim: true }))
    .on('data', function (row) {
        //console.log('A row arrived: ', row[0]+'  '+row[1]+'  '+row[4]);
        //console.log('parseFloat(row[1])'+parseFloat(row[1]))
        if(parseFloat(row[1])>0 && row[4]!='Branch CREDIT'){
          //console.log('greater than zero')
        data.push([row[0],row[1],row[4]]);
        /*
          only push to data if row[1] (amount)>0 no debits
                                row[4] isn't Branch CREDIT (cheques paid in)
                                drop row[2] (balance) and row[3] (currency)
        */
        }
        //console.log('data+++++'+data[0])
    })
    .on('end', function () {
      //  console.log('No more rows!');
        console.log('data===='+csvToMySqlDate(data[1][0])+
          ' '+data[1][1]+' '+data[1][2]);
        
        res.send(data);
      //res.redirect('payments',{data: data})
    });
  
  //res.end();
})

/////////////////////////////////////////
router.post('/import', function(req,res){
console.log('in /import')
console.log('req.body'+req.body.paydata)
var pay=JSON.parse(req.body.paydata);
console.log('pay==='+pay[0][0]+' '+pay[0][1]+' '+pay[0][2]);
console.log('pay.length=='+pay.length)
var qry=[];
    
    var custID=0;
    for(var i=0; i<pay.length; i++){
        if(pay[i][0]){
        var set_qry="SET @date= STR_TO_DATE("+"'"+pay[i][1]+"','%d-%b-%y');";
        console.log('set_qry=='+set_qry)
        var insert_qry="INSERT INTO temp (custID, tdate, amt, trans)"+
                " SELECT "+pay[i][0]+", STR_TO_DATE('"+pay[i][1]+"','%d-%b-%y'), "
                +pay[i][2]+", '"+pay[i][3]+"'"+
                " WHERE NOT EXISTS"+
                " (SELECT * FROM payments"+
                " WHERE (to_days(tdate) BETWEEN to_days(@date)-3"+
                " AND to_days(@date)+1"+
                " AND amt="+pay[i][2]+
                " AND custID="+pay[i][0]+"));";
       //console.log('insert_qry='+insert_qry);
       qry.push([insert_qry,i,set_qry]);
       /*
       qry is an array of array
       qry[i][0]= the insert qry which inserts to temp if custID
       and amt matches AND csv payment date (@date) is between
       3 days after and 1 day before tdate (the db value)
       qry[i][1] is the row value of the csv download
       qry[i][2] is the set_qry which sets the value of @date to the 
       csv value.
       */
       }//if
    }//for
    console.log('array qry=='+qry+'   qry[0]='+qry[0])
    console.log('qry.length=='+qry.length)
    var rec_added=[];
    //var pccc= inOne()
insertRec(pay,qry,rec_added,res);

})
//////////////////////////////////////////// 

function insertRec(pay,arr,rec_added,res){
  //var rec=[]
  var row=[]
  for(var k=0;k<arr.length;k++){row.push(arr[k][1])}
  for(var j=0; j<arr.length; j++){
   
    var counter=0
//////////////////////////////////////////////////////////
        connection.query(arr[j][2],function(err,rows){
          if(err) throw err;
          //res.send(rows)
        });
///////////////////////////////////////////////////////////
       connection.query(arr[j][0], [row[counter]], function(err,result,fields){
          if(err) throw err;
             
              if(result.insertId!=0){
                  rec_added.push([result.insertId, 
                  pay[row[counter]][0],pay[row[counter]][1],pay[row[counter]][2],
                  pay[row[counter]][3]])
              }
                if(counter==arr.length-1){
                console.log('rec_added in conn=='+rec_added+
                  'numer of records added= '+rec_added.length)
                //return callback(rec_added)
                res.send(rec_added)
                }
            counter++;   
           });//connection
  }//for
}


router.get('/cust_id',function(req,res){
	console.log('in cust_id');
	console.log('name='+req.query.name);
	var name=req.query.name;
     var qry4='select c.name, c.id ,p.prop from customers'+
      ' as c '+
      ' inner join properties as p on c.property_id=p.id'+
      ' inner join payments as t on t.custID = c.id'+
      ' where (t.trans like "%'+name+'%" && t.tdate>"2018-01-01");';
      console.log('val....   qry4 ..... '+ qry4);
      connection.query(qry4, function(err,rows){
          if(err) throw err;
           // console.log('Data received from Db:\n');
           // console.log('the variable rows====',rows);
                rows.forEach( (row) => { 
             //     console.log(`${row.name} is in ${row.email} and ${row.prop}`); 
                });//for each
                //res.send('custID='+custID+'   '+JSON.stringify(rows)+
                //	'       '+rows[0].name);
                res.send(rows)
            });//connection
     // res.end('end res')
})

router.get('/autocomplete',function(req,res){
	console.log('in autocomplete');
	console.log('req.query='+req.query.term);
	var prop=req.query.term;
     var qry5='select c.name, c.id, p.prop from customers'+
      ' as c '+
      ' inner join properties as p on c.property_id=p.id'+
      ' where (p.prop like "'+prop+'%");';
      console.log('val....   qry5 ..... '+ qry5);
      connection.query(qry5, function(err,rows){
          if(err) throw err;
            //console.log('Data received from Db:\n');
            //console.log('the variable rows====',rows);
                rows.forEach( (row) => { 
               //   console.log(`${row.name} is in ${row.email} and ${row.prop}`); 
                });//for each
                //res.send('custID='+custID+'   '+JSON.stringify(rows)+
                //	'       '+rows[0].name);
                res.send(rows)
            });//connection
     
      //res.end('end res')

})



router.get('/payments',function(req,res){
  console.log('in get payments')
  console.log('req.query=='+req.query.limit)
  var qry="SELECT id, custID, tdate, amt, trans from payments "+
          "ORDER BY id DESC "+
          "LIMIT "+req.query.limit+";";
  console.log('qry=='+qry)
  connection.query(qry, function(err,rows){
          if(err) throw err;
          res.send(rows)
        });//conn
  //res.end();
})

router.get('/mouseover',function(req,res){
  console.log('in mouseover')
  console.log('req.query=='+req.query.custID)
  var qry='select c.name, c.id, p.prop from customers'+
      ' as c '+
      ' inner join properties as p on c.property_id=p.id'+
      ' where (c.id='+req.query.custID+');';
  console.log('qry=='+qry)
  connection.query(qry, function(err,rows){
          if(err) throw err;
          res.send(rows)
        });//conn

  //res.send('hello');
})
//////////////////////////////////
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
/////////////////////////////
module.exports = router;