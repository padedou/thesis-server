/*
	Gets an array of int ranges and iterates a "Melax" progressive mesh.
	TODO: -needs better descriptio- Returns an array of faces representing the model's LOD for the given range.
	Returns a JSON model
*/

var LodIterator = function(){
	var instance = {};

	var THREE = require("./three.js");
	var subdivisions;
	var subdivisionMod;
	var simplifyMod;
	var geometry;
	var subdividedGeometry;
	var sortedGeometry;

	require("./SubdivisionModifier.js");
	require("./SimplifyModifier.js");
	
	instance.test = function(){
		console.log("Hello from LodIterator");
		console.log(geometry);
	}

	// Sets the configuraion for subdividions, and geometry

	instance.setConfiguration = function(_subdivisions, _geometry){
		subdivisions = _subdivisions;
		geometry = _geometry;

		/*
		console.log("========== LodIterator ===========");
		console.log(geometry.vertices);
		console.log("==================================");
		*/

		//subdivisionMod = new THREE.SubdivisionModifier(subdivisions);
		subdivisionMod = new THREE.SubdivisionModifier();
		simplifyMod = new THREE.SimplifyModifier(400);

		subdividedGeometry = geometry.clone();
		subdividedGeometry.mergeVertices();
		subdivisionMod.modify(subdividedGeometry);
		sortedGeometry = simplifyMod.modify(subdividedGeometry);
	};

	// Gets an array of ranges and returns an array of "decimated" meshes.
	// "Decimated" meshes are added in the same order of the input ranges.

	instance.getProgMesh = function(_rangesArr){
		var progMesh = {};
		var facesArr = [];

		progMesh.vertices = sortedGeometry.vertices;
		//progMesh.vertices = subdividedGeometry.vertices;

		for(var i = 0; i < _rangesArr.length; i++){
			facesArr.push(changeLOD(_rangesArr[i]));
		}

		progMesh.faces = facesArr;

		return JSON.parse(JSON.stringify(progMesh));
	};

	function changeLOD(_range){
		var map = sortedGeometry.map;
		//var sortedVertices = sortedGeometry.vertices;
		//var t = sortedVertices.length - 1;
		var t = sortedGeometry.vertices.length - 1;
		var oldFace;
		var face;
		var currentLodFaces = [];
		var uniqueFaces = [];

		t = t * _range | 0;

		for(var i = 0; i < subdividedGeometry.faces.length; i++){
			oldFace = sortedGeometry.faces[i].clone();
			
			face = subdividedGeometry.faces[i].clone();
			//face = sortedGeometry.faces[i];
			face.a = oldFace.a;
			face.b = oldFace.b;
			face.c = oldFace.c;

			while(face.a > t){
				face.a = map[face.a];
			}
			while(face.b > t){
				face.b = map[face.b];
			}
			while(face.c > t){
				face.c = map[face.c];
			}

			currentLodFaces.push(face.clone());
		}

		for(var faceIndex = 0; faceIndex < currentLodFaces.length; faceIndex++){
			if(uniqueFace(currentLodFaces, faceIndex)){
				uniqueFaces.push(currentLodFaces[faceIndex].clone());
			}
		}

		//return currentLodFaces;
		//return uniqueFaces;
		//return JSON.parse(JSON.stringify(uniqueFaces));
		return JSON.parse(JSON.stringify(currentLodFaces));
	}


	// Returns true if the face is unique in an array of faces.
	function uniqueFace(facesArr, faceIndex){
		var a = facesArr[faceIndex].a;
		var b = facesArr[faceIndex].b;
		var c = facesArr[faceIndex].c;

		//TODO: remove when done
		//console.log(a + " " + b + " " + c);

		for(var i = 0; i < faceIndex; i++){
			if(a === facesArr[i].a && b === facesArr[i].b && c === facesArr[i].c){
				return false;
			}
		}

		return true;
	}


	return instance;
};

module.exports = LodIterator;
