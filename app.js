var path = require("path");
var express = require('express');
var bodyParser = require("body-parser");
var progVertices2X3D = require("./progVertices2X3D.js");
var progFace2X3D = require("./progFace2X3D.js");
var createX3Dfile = require("./createX3Dfile.js");
var diffable = require("./vcdiff.js");
var LodIterator = require("./LodIterator.js");
var THREE = require("./three.js");
var node_uuid = require("node-uuid");
var xmlWrapper = require("./xml-wrapper");
var pug = require("pug");
var cors = require("cors");

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
var hostBaseURL = "localhost:3000";
var pugString;
var currentLOD = 0;

pugString = fs.readFileSync("./directions.pug", "utf8");

vcdiff.blockSize = 11;

app.use(bodyParser.urlencoded({ limit: "1024mb", extended: true }));
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

app.get("/", function(req, res){
	res.sendFile(path.join(__dirname, "views/index.html"));
});

app.get("/continuousStart", function(req, res){
	res.sendFile(path.join(__dirname, "views/continuousStart.html"));
});

app.get("/discreteStart", function(req, res){
	res.sendFile(path.join(__dirname, "views/discreteStart.html"));
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
	//console.log(toX3Dface(progMesh.lods[1]));

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

// This is only for the Melax's implementaion

app.post("/sendRankings", /*bodyParser.json({limit: "1024mb"}),*/ function(req, res){
	var data = JSON.parse(req.body.data);
	var rankings = data.rankings;
	var geometry;
	var lodIterator = new LodIterator();
	var progMesh;	
	var ranges = [];
	var progFaces = [];
	var progVertices;
	var uuid;
	var mpdModel = new MPDmodel();
	var mpdString;

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

	// sort ascending

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

	// i propably refers to the qualityRanking

	for(var i = progFaces.length - 1; i >= 0; i--){
		mpdModel.addLOD(i, progVertices2X3D(progVertices), progFace2X3D(progFaces[i]));
	}

	uuid = node_uuid.v1();
	mpdString = createMPD(uuid, mpdModel, ["http://" + hostBaseURL + "/getModel"]);

	// first save the MPD file and then save the mpdModel

	fs.writeFile("./public/mpd/" + uuid + ".mpd", mpdString, "utf8", (err) => {
		if(err){
			res.status(500).send("Could not create the MPD file");
		}

		fs.writeFile("./serve_models/" + uuid + ".json", JSON.stringify(mpdModel.getLODs()), "utf8", (err) => {
			if(err){
				res.status(500).send("Could not create the progressive model");
			}

			var pugOptions = {
				pretty: "\t",
				adaptiveModel: uuid,
				mpd: "http://" + hostBaseURL + "/mpd/" + uuid + ".mpd",
				modelID: uuid,
				baseURL: hostBaseURL
			};

			var htmlString = pug.render(pugString, pugOptions);

			console.log(uuid + " is ready.");
			res.send({htmlDirections: htmlString});
			res.end();
		});

	});

	//TODO: remove 'testing' code when done
	// start of 'testing' code

	/*
	for(var i = 0; i < progFaces.length; i++){
		fs.writeFileSync("test_" + i + ".html", createX3Dfile(progFaces[i], progVertices), "utf8");
	}
	*/
	
	// end of 'testing' code
});

app.get("/getModel/:uuid/:qualityRanking", function(req, res){
	var uuid = req.params.uuid;
	var requestingQR = parseInt(req.params.qualityRanking, 10);
	var cachedQualityRanking = parseInt(req.query.currentQR, 10);

	// read the model

	fs.readFile("./serve_models/" + uuid + ".json", "utf8", (err, data) => {
		if(err){
			throw err;
		}else{
			var adaptiveModel = JSON.parse(data);
			var diff;
	
			if(cachedQualityRanking > -1){
				diff = getLODdelta(getQualityRankingGeometry(adaptiveModel, cachedQualityRanking), getQualityRankingGeometry(adaptiveModel, requestingQR));
				res.send(JSON.stringify(diff));
			}else{
				res.send(JSON.stringify(getQualityRankingGeometry(adaptiveModel, requestingQR)));
			}
		}
	});
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
		coordIndexArr.push(toX3Dface(lods[lodIndex]));
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

		tempX3Dvertices += currentVertex.x;
		tempX3Dvertices += " ";
		tempX3Dvertices += currentVertex.y;
		tempX3Dvertices += " ";
		tempX3Dvertices += currentVertex.z;
		tempX3Dvertices += " ";
	}

	return tempX3Dvertices;
}

function createMPD(_uuid, _mpdModel, _baseURLs){
	var mpdLODs = _mpdModel.getLODs();
	var nodeMPD = new xmlWrapper.GreeNode();
	var nodePeriod = new xmlWrapper.GreeNode();
	var nodeAdaptationSet = new xmlWrapper.GreeNode();
	var mpdResult;
	var mpdResult_partOne;
	var mpdResult_partTwo;
	var hackAttributes = ' xmlns="urn:mpeg:dash:schema:mpd:2011" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" profiles="urn:mpeg:dash:profile:full:2011" minBufferTime="PT0S" mediaPresentationDuration="P0D" type="static" xsi:schemaLocation="urn:mpeg:DASH:schema:MPD:2011 DASH-MPD.xsd"'

	nodeMPD.setNodeName("MPD");
	nodePeriod.setNodeName("Period");
	nodePeriod.setAttributes({id: "3d_model"});
	nodeAdaptationSet.setNodeName("AdaptationSet");

	for(var i = 0; i < _baseURLs.length; i++){
		var nodeBaseURL = new xmlWrapper.GreeNode();

		nodeBaseURL.setNodeName("BaseURL");
		nodeBaseURL.setValue(_baseURLs[i] + "/" + _uuid);
		nodeMPD.addChildNode(nodeBaseURL);
	}

	for(var i = 0; i < mpdLODs.length; i++){
		var nodeRepresentation = new xmlWrapper.GreeNode();
		var nodeBaseURL = new xmlWrapper.GreeNode();

		nodeBaseURL.setNodeName("BaseURL");
		nodeBaseURL.setValue("/" + mpdLODs[i].ranking);

		nodeRepresentation.setNodeName("Representation");
		nodeRepresentation.setAttributes({
			id: i,
			qualityRanking: mpdLODs[i].ranking
		});
		nodeRepresentation.addChildNode(nodeBaseURL);
		nodeAdaptationSet.addChildNode(nodeRepresentation);
	}

	nodePeriod.addChildNode(nodeAdaptationSet);
	nodeMPD.addChildNode(nodePeriod);

	mpdResult = xmlWrapper.getXML(nodeMPD.getNode(), {indent: true});

	// this is a hack but 'it works' :P

	mpdResult_partOne = mpdResult.slice(0, 4);
	mpdResult_partTwo = mpdResult.slice(4);

	mpdResult = mpdResult_partOne;
	mpdResult += hackAttributes;
	mpdResult += mpdResult_partTwo
	
	return mpdResult;
}

// Based on draft/progFile.js

function MPDmodel(){
	var instance = {};
	var lods = [];

	instance.addLOD = function(_ranking, _vertices, _faces){
		lods.push({ranking: _ranking, vertices: _vertices, faces: _faces});
	};

	instance.getLODs = function(){
		return lods;
	};

	return instance;
}

/*
*	Gets two objects representing the previous and the next LOD.
*	LOD object is in the form {vertices: 'Coordinate point', faces: 'IndexedFaceSet coordIndex'}
*/

function getLODdelta(_prevLOD, _nextLOD){
	var diff = {};
	
	diff.vertices = vcdiff.encode(_prevLOD.vertices, _nextLOD.vertices);
	diff.faces = vcdiff.encode(_prevLOD.faces, _nextLOD.faces);

	return diff;
}

function getQualityRankingGeometry(_adaptiveModel, _qualityRanking){
	for(var i = 0; i < _adaptiveModel.length; i++){
		if(_adaptiveModel[i].ranking === _qualityRanking){
			return _adaptiveModel[i];
		}
	}
}
