var ProgModelEditor = (function () {
    var instance = {};

    var domContainer;
    var stats;
    var loader, camera, controls, scene, renderer, geometry, subdividedGeometry, meshMaterials, light;

    var info;
    var range = 1;
    var rangeInput;
    var subdivisions = 0;
		var step = 0.01;
		//var step = 0.2;
    var subdivisionMod;
    var simplifyMod;
    var sortedGeometry;

    var simplifiedVertices = 0;
    var simplifiedFaces = 0;

		var numFaces = 0;

		var btnAddRange;
		var btnSendRanges;
		var btnShowModel;
		var tableRankings;

    instance.loadModel = function (modelName) {
        var modelPath = "";
        loader = new THREE.JSONLoader();

        switch (modelName) {
            case "Walthead":
                modelPath = "scripts/progressive/models/WaltHeadLo.js";
                break;
            case "Suzanne":
                modelPath = "scripts/progressive/models/Suzanne.js";
                break;
						case "Cow":
								modelPath = "scripts/progressive/models/cow.js";
								break;
						case "Torus Decimated":
								modelPath = "scripts/progressive/models/TorusDecimated.js";
								break;
						case "suzanne2":
								modelPath = "scripts/progressive/models/suzanne2.js";
								break;
						case "suzanne3":
								modelPath = "scripts/progressive/models/suzanne3.js";
								break;
						case "Torus Full":
							modelPath = "scripts/progressive/models/torusFull.js";
							break;

        }

        loader.load(modelPath, function (g, m) {
            init(g);
            animate();
        });
    };

    instance.getDom = function () {
        return domContainer;
    };

    function init(g) {
        domContainer = document.createElement("div");

        camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 1000);
        camera.position.z = 20;

        scene = new THREE.Scene();

        light = new THREE.PointLight(0xffffff, 1.5);
        light.position.set(1000, 1000, 2000);
        scene.add(light);

        light = new THREE.PointLight(0xffffff, 0.5);
        light.position.set(-2000, 1000, -2000);
        scene.add(light);

        scene.add(new THREE.AmbientLight(0x777777));

        subdivisionMod = new THREE.SubdivisionModifier(subdivisions);
        simplifyMod = new THREE.SimplifyModifier(400);

        geometry = g;
        subdividedGeometry = geometry.clone();
        subdividedGeometry.mergeVertices();
        subdivisionMod.modify(subdividedGeometry);
        sortedGeometry = simplifyMod.modify(subdividedGeometry);

        meshMaterials = [
            new THREE.MeshLambertMaterial({color: 0xffffff, shading: THREE.FlatShading}),
            new THREE.MeshBasicMaterial({color: 0x405040, wireframe: true, opacity: 0.8, transparent: true})
        ];
        
        updateSceneModel(changeLOD(range));

        renderer = new THREE.WebGLRenderer({antialias: true});
        renderer.setClearColor(0x2B3E50);
        renderer.setSize(window.innerWidth, window.innerHeight);
        domContainer.appendChild(renderer.domElement);

        stats = new Stats();
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.top = '0px';
        domContainer.appendChild(stats.domElement);

        controls = new THREE.OrbitControls(camera, renderer.domElement);

				createAddRangeBtn();
				domContainer.appendChild(btnAddRange);

				createTableRankings();
				domContainer.appendChild(tableRankings.getDom());

				createSendRangesBtn();
				domContainer.appendChild(btnSendRanges);

				createShowModelBtn();

        createRangeInput();
        domContainer.appendChild(rangeInput);
				
        $("#mainDiv").append(domContainer);

        window.addEventListener('resize', onWindowResize, false);
    }

    function changeLOD(r) {
        var map = sortedGeometry.map;
        var sortedVertices = sortedGeometry.vertices;
        var t = sortedVertices.length - 1;
        //var numFaces = 0;
        var face;
        var oldFace;
        
        var model;
        var modelFaces = [];
        var modelGeometry = new THREE.Geometry();

				var result = {};

        t = t * r | 0;
				numFaces = 0;

				console.log(range);

        for (var i = 0; i < subdividedGeometry.faces.length; i++) {
            oldFace = sortedGeometry.faces[ i ];

            face = subdividedGeometry.faces[ i ];
            face.a = oldFace.a;
            face.b = oldFace.b;
            face.c = oldFace.c;

            while (face.a > t) {
                face.a = map[face.a];
            }

            while (face.b > t) {
                face.b = map[face.b];
            }

            while (face.c > t) {
                face.c = map[face.c];
            }
            
            modelFaces.push(face);

            if (face.a !== face.b && face.b !== face.c && face.c !== face.a) {
                numFaces++;
            }
        }

				console.log("numFaces: " + numFaces);

        simplifiedFaces = numFaces;
        simplifiedVertices = t;        

			
        subdividedGeometry.computeFaceNormals();
        subdividedGeometry.verticesNeedUpdate = true;
        subdividedGeometry.normalsNeedUpdate = true;
        
        modelGeometry.vertices = subdividedGeometry.vertices;
        modelGeometry.faces = modelFaces;
        
        model = THREE.SceneUtils.createMultiMaterialObject(modelGeometry, meshMaterials);
        model.name = "model";        

				//console.log(model);

				//result.geometry = modelGeometry.clone();
				//TODO: propably the name 'model' should be changed to 'modelToRender' or something
				//result.model = model;
				//return model;

				//console.log(result.geometry);

				//return result;
				return model;
    }

		function updateSceneModel(model){
			scene.remove(scene.getObjectByName("model"));
			scene.add(model);		
		}

    function updateInfo() {
        console.log("updateInfo not implemented yet");
    }

    function onWindowResize() {
        console.log("onWindowResize not implemented yet");
    }

    function createRangeInput() {
        rangeInput = document.createElement("input");

        rangeInput.setAttribute("type", "range");
        rangeInput.setAttribute("min", 0);
        rangeInput.setAttribute("max", 1);
        //rangeInput.setAttribute("step", 0.0001);
				rangeInput.setAttribute("step", step);
        rangeInput.style.position = 'absolute';
        rangeInput.style.textAlign = 'center';
        rangeInput.style.width = '50%';
        rangeInput.style.left = '25%';
        rangeInput.style.bottom = '50px';

        $(rangeInput).on("input change", function () {
            range = rangeInput.value;
            //console.log(range);
            updateSceneModel(changeLOD(range));
        });
    }

		function createAddRangeBtn(){
			btnAddRange = document.createElement("button");
			btnAddRange.type = "button";
			btnAddRange.className = "btn btn-success btn-md";
			btnAddRange.innerHTML = "Add range";
			btnAddRange.style.position = "absolute";
			btnAddRange.style.bottom = "100px";
			btnAddRange.style.left = '0%';

			$(btnAddRange).click(function(){
				tableRankings.appendRowData([range, numFaces]);
			});
		}

		function createTableRankings(){
			tableRankings = new TableDom();
			tableRankings.setTableId("rankingsTable");
			tableRankings.setTableClass(["tableRankings"]);
			tableRankings.setHead(["Range", "Face count"]);
			tableRankings.appendRowData(["0.1", "100"]);
		}

		function addSomeMockData(){
			var thead = document.createElement("thead");
			var tbody = document.createElement("tbody");
			
		}

		function createSendRangesBtn(){
			btnSendRanges = document.createElement("button");
			btnSendRanges.type = "button";
			btnSendRanges.id = "btnSendRanges";
			btnSendRanges.className = "btn btn-success btn-md";
			btnSendRanges.innerHTML = "Send ranges";
			btnSendRanges.style.position = "absolute";
			btnSendRanges.style.bottom = "50px";
			btnSendRanges.style.left = "0%";
			
			$(btnSendRanges).click(function(){
				sendLODs();
			});
		}

		function createShowModelBtn(){
			btnShowModel = document.createElement("button");
			btnShowModel.type = "button";
			btnShowModel.className = "btn btn-primary btn-md";
			btnShowModel.innerHTML = "Show model";
			btnShowModel.style.position = "absolute";
			btnShowModel.style.bottom = "50px";
			btnShowModel.style.left = "0%";

			/*
			$(btnShowModel).click(function(){
				window.location.replace("http://localhost:3000/modelViewer");
			});
			*/

			console.log("btnShowModel not fully implemented yet");
		}

		function sendLODs(){
			var rankings = getRankings();
			var dataToSend = {};

			dataToSend.rankings = rankings;
			dataToSend.vertices = geometry.vertices;
			dataToSend.faces = geometry.faces;
			console.log("Not fully implemented yet");
			//console.log(dataToSend);
			$(btnAddRange).remove();
			$(btnSendRanges).remove();
			$(btnShowModel).text("Please wait");

			$.ajax({
				"url": "/sendRankings",
				"method": "post",
				"dataType": "json",
				/*"data":  {"rankings": JSON.stringify(rankings)},*/
				"data": {"data": JSON.stringify(dataToSend)},
				"success": function(data, textStatus){
					console.log("ajax successful");
					console.log(data),
					console.log(textStatus);
				}
			});

			domContainer.appendChild(btnShowModel);
		}

		function getRankings(){
			var domTableRows = document.getElementById("rankingsTable").rows;
			var rankings = [];
			//console.log(domTable.rows[0].cells[0].innerHTML);
			//console.log(domTable.rows[0].cells[1].innerHTML);
			for(var i = 1; i < domTableRows.length; i++){
				var currentRanking = [];

				currentRanking[0] = domTableRows[i].cells[0].innerHTML;
				currentRanking[1] = domTableRows[i].cells[1].innerHTML;

				rankings.push(currentRanking);
			}

			return rankings;
		}

    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
        stats.update();
    }

    return instance;
});
