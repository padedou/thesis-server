var path = require("path");
var express = require('express');
var bodyParser = require("body-parser");
var toX3D = require("./progFace2X3D.js");
var diffable = require("./vcdiff.js");
var LodIterator = require("./LodIterator.js");
var THREE = require("./three.js");

var fs = require("fs");

var app = express();
var vcdiff = new diffable.Vcdiff();
var readyModelName = "Suzzane"; // Initilized for fallback
var lods;
var vertices;
var progMesh;
var coordIndexArr = [];
var lodDeltas = [];
var result // will be saved as a *.dl file

var currentLOD = 0;

vcdiff.blockSize = 11;

app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ limit: "1024mb", extended: true }));

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

/*
app.post("/sendlods", bodyParser.json({limit: "1024mb"}), function(req, res){
	console.log("req on /sendlods");
	progMesh = JSON.parse(req.body.progMesh);
	lods = progMesh.lods;
	//console.log(lods);
	//console.log(toX3D(progMesh.lods[1]));

	vertices = getX3Dvertices(progMesh.vertices);
	// TODO: setCoordIndex and setLODDeltas SHOULD follow the getX3Dvertices paradigm
	setCoordIndex();
	setLODDeltas();
	saveDeltaLODfile();

	// saves the deltas and also saves the decoded coordIndex for some test
	testLODDeltas();


	//console.log(lodDeltas);

	res.contentType("json");
	res.send({"foo": "bar response"});
	//res.end();
});
*/

app.post("/sendRankings", /*bodyParser.json({limit: "1024mb"}),*/ function(req, res){
	//console.log(data.rankings);
	var data = JSON.parse(req.body.data);
	var rankings = data.rankings;
	//var geometry = data.geometry;
	var geometry;
	var lodIterator = new LodIterator();
	var progMesh;	
	var ranges = [];
	var progFaces = [];
	var progVertices;

	// This is needed because when serializing an objecting, only non function attributes are kept.
	geometry = new THREE.Geometry();
	
	for(var i = 0; i < data.vertices.length; i++){
		var currentVertex = data.vertices[i];
		geometry.vertices.push(new THREE.Vector3(currentVertex.x, currentVertex.y, currentVertex.z));
	}

	for(var i = 0; i < data.faces.length; i++){
		var currentFace = data.faces[i];
		geometry.faces.push(new THREE.Face3(currentFace.a, currentFace.b, currentFace.c));
	}

	for(var i = 0; i < rankings.length; i++){
		ranges.push(rankings[i][0]);
	}

	ranges.sort(function(a, b){
		return a - b;
	});

	for(var i = 0; i < ranges.length; i++){
		ranges[i] = parseFloat(ranges[i]);
	}

	lodIterator.setConfiguration(1, geometry);
	progMesh = lodIterator.getProgMesh(ranges);
	progVertices = progMesh.vertices;

	for(var i = 0; i < progMesh.faces.length; i++){
		var tempFaces = [];
		for(var j = 0; j < progMesh.faces[i].length; j++){
			var temp = {};
			temp.a = progMesh.faces[i][j].a;
			temp.b = progMesh.faces[i][j].b;
			temp.c = progMesh.faces[i][j].c;
			tempFaces.push(temp);
		}
		progFaces.push(tempFaces);
	}

	console.log("done");

	res.send({"foo": "bar response"});
	res.end();
});

//TODO: this is for exhibition purposes
app.get("/modelViewer", function(req, res){
	res.sendFile(path.join(__dirname, "views/modelViewer.html"));
});

app.get("/getVertices", function(req, res){
	res.send(JSON.stringify(result.vertices));
});

app.get("/nextLOD", function(req, res){
	if(currentLOD < result.lodDeltas.length){
		res.send(JSON.stringify(result.lodDeltas[currentLOD]));
		currentLOD++;
	}else{
		res.send("restart");
		currentLOD = 0;
	}
});

app.listen(3000, '0.0.0.0', function () {
  console.log('app listening on port 3000');
});


function setCoordIndex(){
	coordIndexArr = [];

	for(var lodIndex = 0; lodIndex < lods.length; lodIndex++){
		coordIndexArr.push(toX3D(lods[lodIndex]));
	}
}

function setLODDeltas(){
	var currentCoordIndex = " ";

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
		fs.writeFileSync("lod_" + deltaIndex, JSON.stringify(lodDeltas[deltaIndex]), "utf8");
	}

	fs.writeFileSync("vertices", JSON.stringify(vertices), "utf8");

	//fs.writeFileSync("lods", JSON.stringify(lodDeltas), "utf8");
}

function saveDeltaLODfile(){
	result = {};
	result.vertices = vertices;
	result.lodDeltas = lodDeltas;

	//fs.writeFileSync("./tmp/foo.dl", JSON.stringify(result), "utf8");
}

function getX3Dvertices(melaxVertices){
	var tempX3Dvertices = "";
	var currentVertex;
	
	for(var i = 0; i < melaxVertices.length; i++){
		currentVertex = melaxVertices[i];

		//console.log(currentVertex);

		tempX3Dvertices += currentVertex.x;
		tempX3Dvertices += " ";
		tempX3Dvertices += currentVertex.y;
		tempX3Dvertices += " ";
		tempX3Dvertices += currentVertex.z;
		tempX3Dvertices += " ";
	}

	return tempX3Dvertices;
}
