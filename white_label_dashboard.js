var express = require('express');
var app = express();

const path = require('path')

app.use( express.static( `${__dirname}/build` ));

app.set('port', process.env.PORT || 3003);

app.get('*', (req, res)=>{
  res.sendFile(path.join(__dirname, '/build/index.html'));
})

app.listen(app.get('port'), function (req, res) {
	console.log('Dashboard listening on port ' + app.get('port'));
});