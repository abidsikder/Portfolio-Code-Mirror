"use strict";
// basics
let scene, camera, renderer, controls;
let stats, gui;
let showGUI = true;

// debug
let debug = false;
let debugCubeLeft = -10;
let debugCubeRight = 10;
let numDebugCubes = 10;
let debugCubes = new THREE.Group();
let debugCubeMaterial;

// post processing
let effectComposer;
let renderPass;
let unrealBloomPass;
let bloomParams =
{
    exposure: 1.1,
    bloomStrength: 0.7,
    bloomThreshold: 0,
    bloomRadius: 1
};
let rainPass;
let rainPassGenerator;

// lab logo mesh
let objLoader = new THREE.OBJLoader();
let labMeshes = [];
let origLabLogo = new THREE.Group();
let labLogoMaterial;

let animateLabLogoColor = false;
let noise = new THREE.SimplexNoise();

loadLabLogo();

class RainPassGenerator
{
    constructor()
    {
        // set the default uniforms
        this["time"] = 0.001;
        this["timeStep"] = 0.005;

        // size of the initial grid in the rain shader
        this["rainShaderGridSize"] = 5.0;
        this["rainDropDistortion"] = 3.0;
        this["rainShaderBlur"] = 6.1;

        this["windowFog"] = false;

    }

    generateVertexShader()
    {
        return `#version 300 es

        varying vec2 vUv;

        void main()
        {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4( position , 1.0);
        }
        `;
    }

    generateFragmentShader()
    {
        return `#version 300 es

        precision highp float;
        precision highp int;
        out vec4 out_FragColor;

        varying vec2 vUv;
        uniform sampler2D tDiffuse;

        uniform float time;
        uniform vec2 size;
        uniform bool windowFog;

        // rain shader uniforms
        uniform float rainShaderGridSize;
        uniform float rainDropDistortion;
        uniform float rainShaderBlur;


        // alias for smoothstep
        #define S(a, b, t) smoothstep(a, b, t)

        #define pow2(x) (x * x)


        float gaussian(vec2 i) {
            const float pi = atan(1.0) * 4.0;
            const int samples = 35;
            const float sigma = float(samples) * 0.25;

            return 1.0 / (2.0 * pi * pow2(sigma)) * exp(-((pow2(i.x) + pow2(i.y)) / (2.0 * pow2(sigma))));
        }

        vec3 gblur(sampler2D sp, vec2 uv, vec2 scale) {
            const float pi = atan(1.0) * 4.0;
            const int samples = 35;
            const float sigma = float(samples) * 0.25;

            vec3 col = vec3(0.0);
            float accum = 0.0;
            float weight;
            vec2 offset;

            for (int x = -samples / 2; x < samples / 2; ++x) {
                for (int y = -samples / 2; y < samples / 2; ++y) {
                    offset = vec2(x, y);
                    weight = gaussian(offset);
                    col += texture(sp, uv + scale * offset).rgb * weight;
                    accum += weight;
                }
            }

            return col / accum;
        }

        // random function
        float N21(vec2 p)
        {
            // mathematical transformation so complex that we can't see the pattern so it'll work
            p = fract(p * vec2(123.34, 345.45));
            p += dot(p, p + 34.345);

            return fract(p.x * p.y);
        }

        // returns a new "layer" of raindrops
        vec3 layer(vec2 UV, float T)
        {
            // the inverse aspect ratio of each grid cell
            vec2 invAspectRatio = vec2(4004.0/750.0, 1.0);
            // both corrects the super wide aspect of the wood image, as well as then make the boxes further taller
            //      than they are wider since the raindrops are supposed to be dropping vertically
            invAspectRatio.x = invAspectRatio.x * 2.0;

            vec2 uv = UV * rainShaderGridSize * invAspectRatio;
            // move the grid down, at the same pace as the drops to not make it seem like the drops are moving back upwards
            uv.y += T * 1.6;
            // gv = grid uv
            vec2 gv = fract(uv) - 0.5;

            // id for each box
            vec2 id = floor(uv);

            // n for noise
            // noise per each box's 'unique' id to uniquely offset the drop as it swerves
            float n = N21(id);
            float t = T + n;
            // since the y offset function's period is t, we have to multiply t by 2\pi to make sure that it's getting that full range of randomness
            t *= 6.2831;

            // w is just a value being used for calculations in x offset
            float w = UV.y * 10.0;
            // x offset that creates the swerving
            float x = (n - 0.5)*0.8;
            // the 0.4 - abs(x) modulates the wiggle given how far the drop is from the center
            x += abs(0.4 - abs(x)) * sin(3.0 * w) * pow(sin(w), 6.0)*0.45;

            // y offset
            float y = -sin(t + sin(t + sin(t) * 0.5)) * 0.45;

            // skew the drop because it's 'drooping' since it's on a window
            y -= (gv.x-x) * (gv.x-x);

            vec2 dropPos = gv - vec2(x, y);
            dropPos = vec2(dropPos.x / 2.0, dropPos.y);

            // divide gv by the invAspectRatio so that the drops are perfectly circular
            float drop = S(0.05, 0.03, length( dropPos ) );

            vec2 trailPos = gv - vec2(x, t * 0.25);
            trailPos = vec2(trailPos.x / 2.0, trailPos.y);
            trailPos.y = (fract(trailPos.y * 8.0) - 0.5)/8.0;

            // divide gv by the invAspectRatio so that the drops are perfectly circular
            float trail = S(0.03, 0.01, length( trailPos ) );
            // remove trails left under the drop
            float fogTrail = S(-0.05, 0.05, dropPos.y);
            // create drop fade
            fogTrail *= S(0.5, y, gv.y);
            trail *= fogTrail;
            // cut through the fog in the trail of drops
            fogTrail *= S(0.05, 0.04, abs(dropPos.x));

            // add the drop onto the screen
            // col.xyz += fogTrail * 0.5;
            // col.xyz += trail;
            // col.xyz += drop;


            // offs does the image dropsetting
            vec2 offs = drop*dropPos + trail*trailPos;

            // draw red outlines to show the grid, show grid id information
            // if (gv.x > .48 || gv.y > .49)
            // {
            //     col = vec4(1.0, 0.0, 0.0, 1.0);
            // }
            // col += N21(id);
            // col.rg = id * 0.1;

            return vec3(offs, fogTrail);
        }

        void main()
        {
            vec4 col = vec4(vec3(0.0), 1.0);

            vec3 drops = layer(vUv, time);
            drops += layer(vUv*1.23+7.54, time);
            drops += layer(vUv*1.35 + 1.54, time);
            drops += layer(vUv*1.57 - 1.57, time);

            float blur = rainShaderBlur * (1.0 - drops.z);
            col = texture(tDiffuse, vUv + drops.xy*rainDropDistortion, blur);

            if (windowFog)
            {
                if (blur > 0.1)
                {
                    col = vec4(gblur(tDiffuse, vUv, vec2(1.0)/size), 1.0);
                }
            }

            out_FragColor = col;
        }
        `
    }

    generateUniformObject()
    {
        return {
            // tDiffuse is the original scene image being that is being layered with raindrops now
            tDiffuse: {
                value: null
            },
            "time":
            {
                value: this["time"]
            },
            "size" :
            {
                value: new THREE.Vector2(window.innerWidth, window.innerHeight)
            },
            "windowFog" :
            {
                value: this["windowFog"]
            },
            "rainShaderGridSize":
            {
                value: this["rainShaderGridSize"]
            },
            "rainDropDistortion":
            {
                value: this["rainDropDistortion"]
            },
            "rainShaderBlur":
            {
                value: this["rainShaderBlur"]
            }
        };
    }

    stepTime()
    {
        this["time"] = this["time"] + this["timeStep"];
    }

    generateShaderPass()
    {
        return new THREE.ShaderPass({
            uniforms: this.generateUniformObject(),
            vertexShader: this.generateVertexShader(),
            fragmentShader: this.generateFragmentShader()
        }
        );
    }

}

function init()
{
    // initialize the general scene setup
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

    origLabLogo.rotation.x += Math.PI / 2;
    centerToWorld(origLabLogo);

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 2.6;

    let canvas = document.createElement("canvas");
    let context = canvas.getContext("webgl2");
    renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        context: context
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    // set the backrgound color to be gray
    renderer.setClearColor(0x000000, 1);
    renderer.toneMapping = THREE.ReinhardToneMapping;
    document.body.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);

    //

    scene.add(origLabLogo);

    //

    // initialize the debug materials
    debugCubeMaterial = new THREE.MeshNormalMaterial();
    for (let i = 0; i < numDebugCubes; i++)
    {
        let debugCubeGeo = new THREE.BoxGeometry(1, 1, 1);
        let cube = new THREE.Mesh(debugCubeGeo, debugCubeMaterial);
        cube.position.x = debugCubeLeft + (debugCubeRight - debugCubeLeft) / numDebugCubes * i;
        debugCubes.add(cube);
    }

    //

    // initialize the effects
    rainPassGenerator = new RainPassGenerator();

    effectComposer = new THREE.EffectComposer(renderer);
    renderPass = new THREE.RenderPass(scene, camera);
    rainPass = rainPassGenerator.generateShaderPass();

    unrealBloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
    unrealBloomPass.threshold = bloomParams.bloomThreshold;
    unrealBloomPass.strength = bloomParams.bloomStrength;
    unrealBloomPass.radius = bloomParams.bloomRadius;

    effectComposer.addPass(renderPass);
    effectComposer.addPass(unrealBloomPass);
    effectComposer.addPass(rainPass);
    rainPass.renderToScreen = true;

    //

    window.addEventListener('resize', onWindowResize, false);
    document.body.appendChild(renderer.domElement);

    // initialize the GUI
    if (showGUI)
    {
        // initialize the stats display
        stats = new Stats();
        stats.showPanel(0);//fps
        document.body.appendChild(stats.dom);

        // initialize the dat.GUI controller
        let guiMapper = {};
        guiMapper["debugSwitch"] = debugSwitch;
        guiMapper["animateLabLogoColor"] = animateLabColorSwitch;

        gui = new dat.GUI();
        gui.add(guiMapper, "debugSwitch");
        gui.add(guiMapper, "animateLabLogoColor");
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

        let rainPassParameters = gui.addFolder("Rain Filter Parameters");
        rainPassParameters.add(rainPassGenerator, "time").listen();
        rainPassParameters.add(rainPassGenerator, "timeStep");
        rainPassParameters.add(rainPassGenerator, "rainShaderGridSize", -10, 10);
        rainPassParameters.add(rainPassGenerator, "rainDropDistortion", -10, 10);
        rainPassParameters.add(rainPassGenerator, "rainShaderBlur", -7, 7);
        rainPassParameters.add(rainPassGenerator, "windowFog");
        rainPassParameters.open();
    }

    render();
}

function loadLabLogo()
{
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

function animate()
{
    rainPassGenerator.stepTime();

    // have to regenerate the rain shader, but since effects can't be removed from the EffectCompoesr, regenerate that as well
    effectComposer = new THREE.EffectComposer(renderer);
    rainPass = rainPassGenerator.generateShaderPass();

    effectComposer.addPass(renderPass);
    effectComposer.addPass(unrealBloomPass);
    // unrealBloomPass.renderToScreen = true;
    effectComposer.addPass(rainPass);
    rainPass.renderToScreen = true;

    // animate the lab color using simplex noise
    if (animateLabLogoColor)
    {
        let timeSlower = 5000;
        let r = noise.noise(Date.now()/timeSlower, 1) + 0.5;
        let g = noise.noise(Date.now()/timeSlower, 2) + 0.5;
        let b = noise.noise(Date.now()/timeSlower, 3) + 0.5;
        labLogoMaterial.color = new THREE.Color(r, g, b);
    }

}

function map_range(value, low1, high1, low2, high2)
{
    return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
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

function animateLabColorSwitch()
{
    animateLabLogoColor = !animateLabLogoColor;
}
