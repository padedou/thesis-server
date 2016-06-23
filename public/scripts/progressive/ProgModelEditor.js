var ProgModelEditor = (function () {
    var instance = {};

    var domContainer;
    var stats;
    var loader, camera, controls, scene, renderer, geometry, subdividedGeometry, meshMaterials, model, light;

    var info;
    var range = 1;
    var rangeInput;
    var subdivisions = 0;
    var subdivisionMod;
    var simplifyMod;
    var sortedGeometry;

    var simplifiedVertices = 0;
    var simplifiedFaces = 0;

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
        camera.position.z = 500;

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
        
        changeLOD(range);

        renderer = new THREE.WebGLRenderer({antialias: true}); // WebGLRenderer CanvasRenderer
        renderer.setClearColor(0x2B3E50);
        renderer.setSize(window.innerWidth, window.innerHeight);
        domContainer.appendChild(renderer.domElement);

        stats = new Stats();
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.top = '0px';
        domContainer.appendChild(stats.domElement);

        controls = new THREE.OrbitControls(camera, renderer.domElement);

        createRangeInput();
        domContainer.appendChild(rangeInput);

        $("#mainDiv").append(domContainer);

        window.addEventListener('resize', onWindowResize, false);
    }

    function changeLOD(r) {
        var map = sortedGeometry.map;
        var sortedVertices = sortedGeometry.vertices;
        var t = sortedVertices.length - 1;
        var numFaces = 0;
        var face;
        var oldFace;
        
        var model;
        var modelFaces = [];
        var modelGeometry = new THREE.Geometry();

        t = t * r | 0;

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

        simplifiedFaces = numFaces;
        simplifiedVertices = t;        

        subdividedGeometry.computeFaceNormals();
        subdividedGeometry.verticesNeedUpdate = true;
        subdividedGeometry.normalsNeedUpdate = true;
        
        modelGeometry.vertices = subdividedGeometry.vertices;
        modelGeometry.faces = modelFaces;
        
        scene.remove(scene.getObjectByName("model"));
        
        model = THREE.SceneUtils.createMultiMaterialObject(modelGeometry, meshMaterials);
        model.name = "model";        
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
        rangeInput.setAttribute("step", 0.0001);
        rangeInput.style.position = 'absolute';
        rangeInput.style.textAlign = 'center';
        rangeInput.style.width = '50%';
        rangeInput.style.left = '25%';
        rangeInput.style.bottom = '50px';

        $(rangeInput).on("input change", function () {
            range = rangeInput.value;
            //console.log(range);
            changeLOD(range);
        });
    }

    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
        stats.update();
    }

    return instance;
});
