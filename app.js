var path = require("path");
var express = require('express');
var bodyParser = require("body-parser");
//var jsonParser = bodyParser.json({extended: false, limit: 99999999999});
//var jsonParser = bodyParser.json();
//var urlencoded = bodyParser.urlencoded({extended: true});
var app = express();

var readyModelName = "Suzzane";
var lods;

/*
app.get('/', function (req, res) {
  res.render('./public/index.html', {});
});
*/

app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));
//app.use(bodyParser.json({limit: "100mb"}));

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

app.post("/sendlods", bodyParser.json({limit: "100mb"}), function(req, res){
	console.log("req on /sendlods");
	//console.log(req.data);
	lods = req.body;
	res.end();

	console.log(lods);
});

app.listen(3000, function () {
  console.log('app listening on port 3000');
});
