// Gets an array of faces and returns a string representing the X3D's coorIndex.
module.exports = function(facesArr){
	var coordIndex = "";

	for(var i = 0; i < facesArr.length; i++){
		coordIndex += facesArr[i].a + " ";
		coordIndex += facesArr[i].b + " ";
		coordIndex += facesArr[i].c + " ";
		coordIndex += "-1 ";
	}

	return coordIndex;
}
