var express = require('express');
var router = express.Router();
var NodeGeocoder = require('node-geocoder');
var options = {
  			provider: 'google',
  			zoom: 13
				}
var geocoder = NodeGeocoder(options);


router.get('/', async function(req, res, next) {
	var latlng=[];
  await geocoder.geocode('26 chesser ave edinburgh', function(err, res) {
  console.log(res[0].formattedAddress);
  console.log(res[0].latitude);
  latlng.push(res[0].latitude);
  latlng.push(res[0].longitude);
  latlng.push(res[0].formattedAddress);
	});
  console.log('func=='+latlng)
  //res.end('end');
  res.render('index', 
  {title: 'index page', 
  lat:  latlng[0],
  lng:  latlng[1],
  address: latlng[2]
  }
  );
});





module.exports = router;