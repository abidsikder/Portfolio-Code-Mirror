"use strict";

class LabLogoParticle
{
    constructor(_mesh)
    {
        this.mesh = _mesh;

        // set up the motion variables
        this.position = this.mesh.position;
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.acceleration = new THREE.Vector3(0, 0, 0);

        // alias the rotation THREE.Vector3 for convenience
        this.rotation = this.mesh.rotation;

        this.maxSpeed = 0.1;
        this.maxAcc = 0.01;
    }

    updateMotion()
    {
        // make sure to limit acceleration
        if (this.acceleration.length() > this.maxAcc)
        {
            this.acceleration.clampLength(0, this.maxAcc);
        }

        this.velocity.add(this.acceleration);
        // limit the velocity
        if (this.velocity.length() > this.maxSpeed)
        {
            this.velocity.clampLength(0, this.maxSpeed);
        }

        this.position.add(this.velocity);

    }
}

let scene, camera, renderer, controls;
let stats, gui;
let showGUI = false;

// meshes
let objLoader = new THREE.OBJLoader();
let labMeshes = [];
let origLabLogo = new THREE.Group();
let labLogoMaterial;
let labLogoParticles = [];

let labLogosLeft = -19;
let labLogosRight = 17;
let numLabLogos = 100;

let noise = new THREE.SimplexNoise();

// post processing
let effectComposer;
let renderPass;
let unrealBloomPass;
let copyPass;
let afterimagePass;
let bloomParams =
{
    exposure: 1.1,
    bloomStrength: 0.7,
    bloomThreshold: 0,
    bloomRadius: 1
};

// debug
let debug = false;
let debugCubeLeft = -10;
let debugCubeRight = 10;
let numDebugCubes = 10;
let debugCubes = new THREE.Group();
let debugCubeMaterial;

let showWireFrames = false;

function onWindowResize()
{
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

    effectComposer.setSize(window.innerWidth, window.innerHeight);
}

function debugSwitch()
{
    debug = !debug;
    if (debug)
    {
        scene.add(debugCubes);
    }
    else
    {
        scene.remove(debugCubes);
    }
}

function wireframeSwitch()
{
    showWireFrames = !showWireFrames;
    if (showWireFrames)
    {
        for (let p of labLogoParticles)
        {
            p.mesh.children[0].material.wireframe = true;
        }
        debugCubeMaterial.wireframe = true;
    }
    else
    {
        for (let p of labLogoParticles)
        {
            p.mesh.children[0].material.wireframe = false;
        }
        debugCubeMaterial.wireframe = false;
    }
}

function getWorldCenterVec(mesh)
{
    let worldCenter = new THREE.Vector3();
    let box = new THREE.Box3();
    box.setFromObject(mesh);
    let boxSize = box.getSize();

    worldCenter.x = -boxSize.x / 2;
    worldCenter.y = boxSize.y / 2;
    worldCenter.z = -boxSize.z / 2;

    return worldCenter;
}

function centerToWorld(mesh)
{
    let worldCenter = getWorldCenterVec(mesh);
    // for whatever reason, reassigning the position binding entirely doesn't
    // work, you have to just set the vector's components individually, or use the "copy" function here
    mesh.position.copy(worldCenter);
}

// moves an object's center to a new position
function setPositionFromMeshCenter(mesh, newPosition)
{
    let worldCenter = getWorldCenterVec(mesh);
    worldCenter.add(newPosition);
    // for whatever reason, reassigning the position binding entirely doesn't
    // work, you have to just set the vector's components individually, or use the "copy" function here
    mesh.position.copy(worldCenter);
}

function init()
{
    // construct the lab logo THREE Group

    labLogoMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    for (let mesh of labMeshes)
    {
        mesh.material = labLogoMaterial;
        origLabLogo.add(mesh);
        // set the size here, don't want to have to deal with setting it individually over and over again
        origLabLogo.scale.x = 0.01;
        origLabLogo.scale.y = 0.01;
        origLabLogo.scale.z = 0.01;

    }

    for (let i = 0; i < numLabLogos; i++)
    {
        let lp = new LabLogoParticle(origLabLogo.clone());
        labLogoParticles.push(lp);
        // since cloning a group does not clone materials, we have to re-clone
        // the material to allow for proper independent material animation

        let clonedMaterial = lp.mesh.children[0].material.clone();
        for (let child of lp.mesh.children)
        {
            child.material = clonedMaterial;
        }
        lp.rotation.x = Math.PI / 2;
        centerToWorld(lp.mesh);
        lp.position.x = labLogosLeft + (labLogosRight-labLogosLeft)/ numLabLogos * i;
        lp.position.y += 15*Math.random();
        lp.position.y -= 7;
        lp.position.z = map_range(Math.random(), 0, 1, -3, 0);

        lp.mesh.scale.multiplyScalar(map_range(Math.random(), 0, 1, 0.5, 0.9));
        lp.rotation.y += map_range(Math.random(), 0, 1, 0, Math.PI/2);
    }

    //

    scene = new THREE.Scene();

    //

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 10;

    //

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ReinhardToneMapping;

    //

    controls = new THREE.OrbitControls(camera, renderer.domElement);

    //

    // debugCubeMaterial = new THREE.MeshBasicMaterial({color: 0x00ff00});
    debugCubeMaterial = new THREE.MeshNormalMaterial();
    for (let i = 0; i < numDebugCubes; i++)
    {
        let debugCubeGeo = new THREE.BoxGeometry(1, 1, 1);
        let cube = new THREE.Mesh(debugCubeGeo, debugCubeMaterial);
        cube.position.x = debugCubeLeft + (debugCubeRight - debugCubeLeft) / numDebugCubes * i;
        debugCubes.add(cube);
    }

    //

    // post processing

    effectComposer = new THREE.EffectComposer(renderer);
    renderPass = new THREE.RenderPass(scene, camera);
    afterimagePass = new THREE.AfterimagePass(.97);

    unrealBloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
    unrealBloomPass.threshold = bloomParams.bloomThreshold;
    unrealBloomPass.strength = bloomParams.bloomStrength;
    unrealBloomPass.radius = bloomParams.bloomRadius;

    effectComposer.addPass(renderPass);
    effectComposer.addPass(unrealBloomPass);

    unrealBloomPass.renderToScreen = true;
    // effectComposer.addPass(afterimagePass);
    // afterimagePass.renderToScreen = true;

    //

    // add all the objects to the scene
    for (let p of labLogoParticles)
    {
        scene.add(p.mesh);
    }

    window.addEventListener('resize', onWindowResize, false);
    document.body.appendChild(renderer.domElement);

    //

    if (showGUI)
    {
        // initialize the stats display
        stats = new Stats();
        stats.showPanel(0);//fps
        document.body.appendChild(stats.dom);

        // initialize the dat.GUI controller
        let guiMapper = {};
        guiMapper["debugSwitch"] = debugSwitch;
        guiMapper["wireframeSwitch"] = wireframeSwitch;

        gui = new dat.GUI();
        gui.add(guiMapper, "debugSwitch");
        gui.add(guiMapper, "wireframeSwitch");
        gui.add(bloomParams, 'exposure', 0.1, 2).onChange(
            function (value)
            {
                renderer.toneMappingExposure = Math.pow(value, 4.0);
            }
        );
        let bloomFilterParameters = gui.addFolder("Bloom Filter Parameters");
        bloomFilterParameters.add(unrealBloomPass, 'threshold', 0.0, 1.0);
        bloomFilterParameters.add(unrealBloomPass, 'strength', 0.0, 10.0);
        bloomFilterParameters.add(unrealBloomPass, 'radius', 0.0, 1.0);
        bloomFilterParameters.open();
    }

    render();
}

function animate()
{
    // move all the lab logo particles downwards
    for (let p of labLogoParticles)
    {
        p.updateMotion();

        // send them back up to the top if they fall past the viewheight
        if (p.position.y < -14)
        {
            p.position.y = 14;
            p.velocity.y = -p.maxSpeed/2*Math.random();
        }

        // use the unique ids of each object to index the noise uniquely
        let xin = map_range(noise.noise(Date.now() / 3000, p.mesh.children[0].id + p.mesh.children[1].id), -1, 1, 0.5, 1);
        let xin1 = map_range(noise.noise(Date.now() / 3000, p.mesh.children[1].id + p.mesh.children[2].id), -1, 1, 0.5, 1);
        let xin2 = map_range(noise.noise(Date.now() / 3000, p.mesh.children[2].id + p.mesh.children[3].id), -1, 1, 0.5, 1);
        p.mesh.children[0].material.color = new THREE.Color(xin, xin1, xin2);

        p.acceleration.y = -map_range(noise.noise(Date.now()/1000, p.position.x), -1, 1, 0, p.maxAcc/40);
        p.rotation.y += map_range(noise.noise(Date.now()/1000, p.mesh.children[0].id + p.mesh.children[1].id), 0, 1, -0.001, 0.001);

    }
}

function map_range(value, low1, high1, low2, high2)
{
    return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
}

function render()
{
    if (showGUI)
        stats.begin();

    animate();

    controls.update();
    effectComposer.render();
    // renderer.render(scene, camera);

    if (showGUI)
        stats.end();

    requestAnimationFrame(render);
}

// load the lab logo obj mesh in and then initialize and start the rest of everything
objLoader.load("./LabLogo3D.obj",
    // on load
    function (obj)
    {
        for (let i = 0; i < obj.children.length; i++)
        {
            labMeshes.push(obj.children[i]);
        }

        init();
    },
    // on progress
    function (xhr)
    {
        ;
    },
    // on error
    function (error)
    {
        console.log("There was an error in loading the Lab Logo OBJ File!");
        console.log(error);
    }
);
