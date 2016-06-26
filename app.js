var path = require("path");
var express = require('express');
var bodyParser = require("body-parser");
var toX3D = require("./progFace2X3D.js");
var diffable = require("./vcdiff.js");

var fs = require("fs");

var app = express();
var vcdiff = new diffable.Vcdiff();
var readyModelName = "Suzzane"; // Initilized for fallback
var lods;
var progMesh;
var coordIndexArr = [];
var lodDeltas = [];

vcdiff.blockSize = 10;

app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));

app.get("/", function(req, res){
	res.sendFile(path.join(__dirname, "views/index.html"));
});

app.get("/readyModel", function(req, res){
	readyModelName = req.query.model;
	res.sendFile(path.join(__dirname, "views/readyModel.html"));
});

app.get("/askModel", function(req, res){
	res.send(readyModelName);
});

app.post("/sendlods", bodyParser.json({limit: "100mb"}), function(req, res){
	console.log("req on /sendlods");
	progMesh = JSON.parse(req.body.progMesh);
	lods = progMesh.lods;
	//console.log(lods);
	//console.log(toX3D(progMesh.lods[1]));

	setCoordIndex();
	setLODDeltas();

	// saves the deltas and also saves the decoded coordIndex for some test
	testLODDeltas();

	//console.log(lodDeltas);

	res.contentType("json");
	res.send({"foo": "bar response"});
	//res.end();
});

app.listen(3000, function () {
  console.log('app listening on port 3000');
});


function setCoordIndex(){
	coordIndexArr = [];

	for(var lodIndex = 0; lodIndex < lods.length; lodIndex++){
		coordIndexArr.push(toX3D(lods[lodIndex]));
	}
}

function setLODDeltas(){
	var currentCoordIndex = "";

	if(coordIndexArr.length < 2){
		return;
	}

	lodDeltas = [];

	for(var i = 0; i < coordIndexArr.length; i++){
		var diff = vcdiff.encode(currentCoordIndex, coordIndexArr[i]);
		lodDeltas.push(diff);
		currentCoordIndex = coordIndexArr[i];
	}
}

function testLODDeltas(){
	console.log("testLODDeltas called");

	for(var deltaIndex = 0; deltaIndex < lodDeltas.length; deltaIndex++){
		fs.writeFileSync("" + deltaIndex, lodDeltas[deltaIndex], "utf-8");
	}
}
