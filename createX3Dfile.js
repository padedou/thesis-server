// Gets an array of "progressive" faces.
// Returns a text describing an HTML file with an X3D scene including the corresponding model.

module.exports = function(facesArr, verticesArr){
	var progFaces2x3d = require("./progFace2X3D.js");
	var progVertices2x3d = require("./progVertices2X3D.js");
	var htmlText = "";

	var coordIndex = progFaces2x3d(facesArr);
	var point = progVertices2x3d(verticesArr);

	htmlText += '<html><head><title> x3dCube </title><script type="text/javascript" src="http://www.x3dom.org/download/x3dom.js"></script><link rel="stylesheet" type="text/css" href="http://www.x3dom.org/download/x3dom.css"></head><body><x3d width="800px" height="600px"><scene><shape><appearance><material diffuseColor="0.800 0.640 0.480"specularColor="0.130 0.126 0.401"emissiveColor="0.000 0.000 0.000"ambientIntensity="0.333"shininess="0.098"transparency="0.0"/></appearance><IndexedFaceSet solid="true" coordIndex="';

	htmlText += coordIndex;
	htmlText += '">';
	
	htmlText += '<Coordinate point="';
	htmlText += point;
	htmlText += '"/>';

	htmlText += '</IndexedFaceSet></shape></scene></x3d></body></html>';

	return htmlText;
};

