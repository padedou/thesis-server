var path = require("path");
var express = require('express');
var app = express();

var readyModelName = "Suzzane";

/*
app.get('/', function (req, res) {
  res.render('./public/index.html', {});
});
*/

app.use(express.static(path.join(__dirname, "public")));

app.get("/", function(req, res){
	res.sendFile(path.join(__dirname, "views/index.html"));
});

app.get("/readyModel", function(req, res){
	//console.log("tralalala");
	//console.log(req.query.model);
	readyModelName = req.query.model;
	res.sendFile(path.join(__dirname, "views/readyModel.html"));
});

app.get("/askModel", function(req, res){
	res.send(readyModelName);
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
