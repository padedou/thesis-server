// Takes an array of vertex objects.
// Returns a string for the Coordindex's "point" attribute with these vertex objects.

/*
	[
		{"x": 1, "y": 2, "z": 3},
		{"x": 4, "y": 5, "z": 5}
	]
*/

module.exports = function(verticesArr){
	var point = "";

	for(var i = 0; i < verticesArr.length; i++){
		var currentVertex = verticesArr[i];

		point += currentVertex.x;
		point += " ";
		point += currentVertex.y;
		point += " ";
		point += currentVertex.z;
		point += " ";
	}

	return point;
};
