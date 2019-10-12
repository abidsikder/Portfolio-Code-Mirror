"use strict";
/**
 * author: Md Abid Sikder
 * abidsikder.com
 * Released under the GPLv3 License
 */

class Controller
{
    constructor()
    {
        this.debug = false;

        // simplex noise constants
        this["F3"] = 0.3333333;
        this["G3"] = 0.1666667;

        this["dotSeed1"] = 17.0;
        this["dotSeed2"] = 59.4;
        this["dotSeed3"] = 15.0;

        this["random3Multiplier1"] = 4096.0;
        this["random3Multiplier2"] = 512.0;

        // time slices through the 3D noise, "animating" the 2D image we see
        this["time"] = 0.001;

        // controls the division used on "time" in the square root function that animates y-direction movement of the time
        this["verticalMovementTimeDivisionConstant"] = 4000.0;

        // the bigger, the slower the 'animation'
        this["timeSlowerConstant1"] = 40.0;
        // the literal movement through time we are doing, outside of any of the code
        this["timeStep"] = 0.02;
        // smaller liquid flow constant means more "liquid flow" type action
        this["liquidFlowConstant1"] = 4000.0;

        // changes the position variable so that you can "move" left or right during the simplex noise sampling stage
        this["simplexSampleShiftConstant"] = 0.0;

        // 'rotates' the simpelx noise angle around to a max of 2*pi so that you get the 'circles'
        // the bigger it is the more warping and distortion you will se
        this["angleMapConstant"] = Math.PI*2.0;

        // low - more circles
        /// high - less circles
        this["circleDensityConstant"] = 2.6;

        // Post-Processing on the Resulting Image
        this["brightness"] = 0.0001;
        this["contrast"] = 0.0001;

        this["hue"] = 0.0001;
        this["saturation"] = 0.0001;
        
        this.textureLoader = new THREE.TextureLoader();
        this.marbleTexture = this.textureLoader.load( "water_marble.jpg");
        this.marbleTexture.wrapS = this.marbleTexture.wrapT = THREE.RepeatWrapping;
        this.pause = false;
    }

    debugSwitch()
    {
        this.debug = !this.debug;
        if (this.debug)
        {
            this.scene.add(this.debugCube);
        }
        else
        {
            this.scene.remove(this.debugCube);
        }
    }

    pauseButton()
    {
        this.pause = !this.pause;
    }

    vertexShaderGenerator()
    {
        return `#version 300 es

        varying vec2 vUv;
        uniform vec2 size;

        void main()
        {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4( position , 1.0);
        }
        `;
    }

    fragmentShaderGenerator()
    {
        return `#version 300 es

        precision highp float;
        precision highp int;
        out vec4 out_FragColor;

        varying vec2 vUv;
        uniform sampler2D marbleTexture;
        
        uniform vec2 size;
        uniform bool debug;

        // BEGIN user controlled uniforms
        // Simplex Noise Constants
        // {
            // skew constants for 3d simplex functions
            uniform float F3;
            uniform float G3;

            // random3 function constants
            uniform float dotSeed1;
            uniform float dotSeed2;
            uniform float dotSeed3;
            uniform float random3Multiplier1;
            uniform float random3Multiplier2;
        // }

        uniform float time;
        uniform float timeSlowerConstant1;
        uniform float verticalMovementTimeDivisionConstant;
        uniform float liquidFlowConstant1;
        uniform float simplexSampleShiftConstant;
        uniform float circleDensityConstant;
        uniform float angleMapConstant;
        uniform float brightness;
        uniform float contrast;
        uniform float hue;
        uniform float saturation;

        // END user controlled uniforms


        // BEGIN SIMPLEX 3D
        /* https://www.shadertoy.com/view/XsX3zB
        *
        * The MIT License
        * Copyright © 2013 Nikita Miropolskiy
        * 
        * ( license has been changed from CCA-NC-SA 3.0 to MIT
        *
        *   but thanks for attributing your source code when deriving from this sample 
        *   with a following link: https://www.shadertoy.com/view/XsX3zB )
        *
        * ~
        * ~ if you're looking for procedural noise implementation examples you might 
        * ~ also want to look at the following shaders:
        * ~ 
        * ~ Noise Lab shader by candycat: https://www.shadertoy.com/view/4sc3z2
        * ~
        * ~ Noise shaders by iq:
        * ~     Value    Noise 2D, Derivatives: https://www.shadertoy.com/view/4dXBRH
        * ~     Gradient Noise 2D, Derivatives: https://www.shadertoy.com/view/XdXBRH
        * ~     Value    Noise 3D, Derivatives: https://www.shadertoy.com/view/XsXfRH
        * ~     Gradient Noise 3D, Derivatives: https://www.shadertoy.com/view/4dffRH
        * ~     Value    Noise 2D             : https://www.shadertoy.com/view/lsf3WH
        * ~     Value    Noise 3D             : https://www.shadertoy.com/view/4sfGzS
        * ~     Gradient Noise 2D             : https://www.shadertoy.com/view/XdXGW8
        * ~     Gradient Noise 3D             : https://www.shadertoy.com/view/Xsl3Dl
        * ~     Simplex  Noise 2D             : https://www.shadertoy.com/view/Msf3WH
        * ~     Voronoise: https://www.shadertoy.com/view/Xd23Dh
        * ~ 
        *
        */

        /* discontinuous pseudorandom uniformly distributed in [-0.5, +0.5]^3 */
        vec3 random3(vec3 c) {
            float j = random3Multiplier1*sin(dot(c,vec3(dotSeed1, dotSeed2, dotSeed3)));
            vec3 r;
            r.z = fract(random3Multiplier2*j);
            j *= .125;
            r.x = fract(random3Multiplier2*j);
            j *= .125;
            r.y = fract(random3Multiplier2*j);
            return r-0.5;
        }

        /* 3d simplex noise */
        float simplex3d(vec3 p) {
            /* 1. find current tetrahedron T and it's four vertices */
            /* s, s+i1, s+i2, s+1.0 - absolute skewed (integer) coordinates of T vertices */
            /* x, x1, x2, x3 - unskewed coordinates of p relative to each of T vertices*/
            
            /* calculate s and x */
            vec3 s = floor(p + dot(p, vec3(F3)));
            vec3 x = p - s + dot(s, vec3(G3));
            
            /* calculate i1 and i2 */
            vec3 e = step(vec3(0.0), x - x.yzx);
            vec3 i1 = e*(1.0 - e.zxy);
            vec3 i2 = 1.0 - e.zxy*(1.0 - e);
                
            /* x1, x2, x3 */
            vec3 x1 = x - i1 + G3;
            vec3 x2 = x - i2 + 2.0*G3;
            vec3 x3 = x - 1.0 + 3.0*G3;
            
            /* 2. find four surflets and store them in d */
            vec4 w, d;
            
            /* calculate surflet weights */
            w.x = dot(x, x);
            w.y = dot(x1, x1);
            w.z = dot(x2, x2);
            w.w = dot(x3, x3);
            
            /* w fades from 0.6 at the center of the surflet to 0.0 at the margin */
            w = max(0.6 - w, 0.0);
            
            /* calculate surflet components */
            d.x = dot(random3(s), x);
            d.y = dot(random3(s + i1), x1);
            d.z = dot(random3(s + i2), x2);
            d.w = dot(random3(s + 1.0), x3);
            
            /* multiply d by w^4 */
            w *= w;
            w *= w;
            d *= w;
            
            /* 3. return the sum of the four surflets */
            return dot(d, vec4(52.0));
        }

        // END SIMPLEX 3D

        mat2 rotate2d(float angle) 
        {
            return mat2( cos(angle), -sin(angle/2.), sin(angle*2.), cos(angle));
        }

        /* BEGIN Color Correction Functions */
        vec3 brightnessContrast(vec3 value, float brightness, float contrast)
        {
            return (value - 0.5) * contrast + 0.5 + brightness;
        }

        vec3 rgb2hsb( vec3 c ){
            vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
            vec4 p = mix(vec4(c.bg, K.wz),
                         vec4(c.gb, K.xy),
                         step(c.b, c.g));
            vec4 q = mix(vec4(p.xyw, c.r),
                         vec4(c.r, p.yzx),
                         step(p.x, c.r));
            float d = q.x - min(q.w, q.y);
            float e = 1.0e-10;
            return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)),
                        d / (q.x + e),
                        q.x);
        }
        
        //  Function from Iñigo Quiles
        //  https://www.shadertoy.com/view/MsS3Wc
        vec3 hsb2rgb( vec3 c ){
            vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),
                                     6.0)-3.0)-1.0,
                             0.0,
                             1.0 );
            rgb = rgb*rgb*(3.0-2.0*rgb);
            return c.z * mix(vec3(1.0), rgb, c.y);
        }

        // https://github.com/evanw/glfx.js/blob/master/src/filters/adjust/brightnesscontrast.js
        vec3 adjBrightnessContrast(vec3 color, float brightness, float contrast)
        {
            color.rgb += brightness;
            if (contrast > 0.0)
            {
                color.rgb = (color.rgb - 0.5) / (1.0 - contrast) + 0.5;
            }
            else
            {
                color.rgb = (color.rgb - 0.5) * (1.0 + contrast) + 0.5;
            }

            return color;
        }

        // https://github.com/evanw/glfx.js/blob/master/src/filters/adjust/huesaturation.js
        vec3 adjHueSaturation(vec3 color, float hue, float saturation)
        {
            /* hue adjustment, wolfram alpha: RotationTransform[angle, {1, 1, 1}][{x, y, z}] */
            float angle = hue * 3.14159265;
            float s = sin(angle), c = cos(angle);
            vec3 weights = (vec3(2.0 * c, -sqrt(3.0) * s - c, sqrt(3.0) * s - c) + 1.0) / 3.0;
            float len = length(color);
            color = vec3(
                dot(color, weights.xyz),
                dot(color, weights.zxy),
                dot(color, weights.yzx)
            );

            /* saturation adjustment */
            float average = (color.r + color.g + color.b) / 3.0;
            if (saturation > 0.0)
            {
                color += (average - color) * (1.0 - 1.0 / (1.001 - saturation));
            }
            else
            {
                color += (average - color) * (-saturation);
            }

            return color;
        }

        /* END Color Correction Functions */

        float map(float value, float min1, float max1, float min2, float max2) {
            return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
        }

        vec2 map(vec2 value, vec2 min1, vec2 max1, vec2 min2, vec2 max2) {
            return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
        }


        void main() 
        {
            
            vec2 st = vUv;
            st.y *= size.y/size.x/2.0;
            // st.y += sqrt(time/verticalMovementTimeDivisionConstant);
            
            vec2 pos = st.yx*vec2(15., 4.);
        
            vec2 textureCoord = rotate2d((simplex3d(vec3(pos/circleDensityConstant, time/timeSlowerConstant1))+simplexSampleShiftConstant)*angleMapConstant)*st.xy+time/liquidFlowConstant1;
            pos = textureCoord;
            textureCoord = rotate2d((simplex3d(vec3(pos/circleDensityConstant, time/timeSlowerConstant1))+simplexSampleShiftConstant)*angleMapConstant)*st.xy+time/liquidFlowConstant1;

            // textureCoord = vUv;
            vec4 marbleImg = texture(marbleTexture, textureCoord);

            out_FragColor = marbleImg;

            // final brightness/contrast pass
            out_FragColor = vec4(adjHueSaturation(out_FragColor.rgb, hue, saturation), 1.0);
            out_FragColor = vec4(adjBrightnessContrast(out_FragColor.rgb, brightness, contrast), 1.0);

            if (debug)
            {
                out_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
                if (vUv.x - 0.01 < 0.0)
                {
                    out_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
                }
                else if (vUv.x + 0.01 > 1.0)
                {
                    out_FragColor = vec4(0.0, 1.0, 0.0, 1.0);
                }
                if (vUv.y - 0.02 < 0.0)
                {
                    out_FragColor = vec4(0.0, 0.0, 1.0, 1.0);
                }
                else if (vUv.y + 0.02 > 1.0)
                {
                    out_FragColor = vec4(0.0, 1.0, 1.0, 1.0);
                }
            }
        }
        `;

    }

    uniformsGenerator()
    {
        let unis = 
        {
            // all the noise parameters
            "marbleTexture" :
            {
                value: this.marbleTexture
            },
            "F3" :
            {
                value: this["F3"]
            },
            "G3" :
            {
                value: this["G3"]
            },
            "random3Multiplier1" :
            {
                value: this["random3Multiplier1"]
            },
            "random3Multiplier2" :
            {
                value: this["random3Multiplier2"]
            },
            "time" :
            {
                value: this["time"]
            },
            "timeSlowerConstant1" :
            {
                value : this["timeSlowerConstant1"]
            },
            "verticalMovementTimeDivisionConstant" :
            {
                value: this["verticalMovementTimeDivisionConstant"]
            },
            "liquidFlowConstant1" : 
            {
                value: this["liquidFlowConstant1"]
            },
            "circleDensityConstant" : 
            {
                value: this["circleDensityConstant"]
            },
            "angleMapConstant" :
            {
                value: this["angleMapConstant"]
            },
            "brightness" : 
            {
                value: this["brightness"]
            },
            "contrast" : 
            {
                value: this["contrast"]
            },
            "hue" : 
            {
                value: this["hue"]
            },
            "saturation" : 
            {
                value: this["saturation"]
            },
            "size" :
            {
                value: new THREE.Vector2(this.planeWidth, this.planeHeight)
            },
            "debug" :
            {
                value: this.debug
            }
        };

        return unis;
    }

    initShaders()
    {
        this.uniforms = this.uniformsGenerator();

        this.vertexShaderSource = this.vertexShaderGenerator();
        this.fragmentShaderSource = this.fragmentShaderGenerator();

        this.distortionMaterial = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: this.vertexShaderSource,
            fragmentShader: this.fragmentShaderSource,
        });

    }

    recompileShaders()
    {
        this.uniforms = this.uniformsGenerator();

        this.vertexShaderSource = this.vertexShaderGenerator();
        this.fragmentShaderSource = this.fragmentShaderGenerator();
       
        this.distortionMaterial = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: this.vertexShaderSource,
            fragmentShader:  this.fragmentShaderSource
        });

        this.scene.remove(this.plane);
        this.plane = new THREE.Mesh(
            this.planeGeo, this.distortionMaterial
        );
        this.plane.material.side = THREE.DoubleSide;
        this.scene.add(this.plane);
    }
    

    resetTime()
    {
      this.time = 0;
    }

    init()
    {
        // initialize and append the RENDERER in WebGL2 mode
        let canvas = document.createElement("canvas");
        let context = canvas.getContext("webgl2");
        this.renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            context: context
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        // set the backrgound color to be gray
        this.renderer.setClearColor(0x000000, 1);
        document.body.appendChild(this.renderer.domElement);

        // initialize the scene and camera
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

        // orbit controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);

        // initialize the plane geometry that will be used for displaying
        // trying to approximate the original width and height 
        let origImageWidth = 4004; // pixels
        let origImageHeight = 750; // pixels
        this.planeHeight = 20;
        this.planeWidth = origImageWidth / origImageHeight * this.planeHeight;
        this.planeGeo = new THREE.PlaneBufferGeometry(this.planeWidth, this.planeHeight);

        // start shaders here because the size of the plane is being passed in as a uniform
        this.initShaders();
        // this.planeMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide });
        this.plane = new THREE.Mesh(this.planeGeo, this.distortionMaterial);
        this.plane.material.side = THREE.DoubleSide;

        this.debugCube = new THREE.Mesh(
            new THREE.BoxBufferGeometry(10, 10, 10),
            new THREE.MeshPhysicalMaterial()
        );

        this.scene.add(this.plane);

        this.camera.position.z = 40;

        // set all the dat.gui floats that had to be forced back to real zero
    }

    animate()
    {
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
        if (!this.pause)
        {
            this["time"] = this["time"] + this["timeStep"];
        }
    }

}

let controller = new Controller();
controller.init();

// initialize dat.GUI controls here
let guiControls = new dat.GUI({name: "Distortion Parameters"});

// leave the random function parameter GUI control off by default
let randomFunctionParams = guiControls.addFolder("Random Function Parameters");
randomFunctionParams.add(controller, "dotSeed1");
randomFunctionParams.add(controller, "dotSeed2");
randomFunctionParams.add(controller, "dotSeed3");

randomFunctionParams.add(controller, "random3Multiplier1");
randomFunctionParams.add(controller, "random3Multiplier2");

let simplexNoiseConstants = guiControls.addFolder("Simplex Noise Constants");
simplexNoiseConstants.add(controller, "F3");
simplexNoiseConstants.add(controller, "G3");

// adding a ".listen" to "time" makes sure the value of time is being updated live
guiControls.add(controller, "time").listen();

guiControls.add(controller, "timeStep");
guiControls.add(controller, "timeSlowerConstant1");
guiControls.add(controller, "verticalMovementTimeDivisionConstant");
guiControls.add(controller, "simplexSampleShiftConstant");
guiControls.add(controller, "liquidFlowConstant1");
guiControls.add(controller, "circleDensityConstant");
guiControls.add(controller, "angleMapConstant");
guiControls.add(controller, "brightness", -1.0, 1.0);
guiControls.add(controller, "contrast", -1.0, 1.0);
guiControls.add(controller, "hue", -1.0, 1.0);
guiControls.add(controller, "saturation", -1.0, 1.0);

// functions
guiControls.add(controller, "pauseButton");
guiControls.add(controller, "resetTime");
guiControls.add(controller, "debugSwitch");

// reset all the datgui forced floats back to real 0
controller["time"] = 0.0;
controller["brightness"] = 0.0;
controller["contrast"] = 0.0;
controller["hue"] = 0.0;
controller["saturation"] = 0.0;

const animate = function ()
{
    requestAnimationFrame(animate);

    controller.recompileShaders();
    controller.animate();
}

const canvasResize = function()
{
    controller.camera.aspect = window.innerWidth/window.innerHeight;
    controller.camera.updateProjectionMatrix();

    controller.renderer.setSize(window.innerWidth, window.innerHeight);
    controller.renderer.setPixelRatio(window.devicePixelRatio);
}

window.addEventListener("resize", canvasResize, false);
animate();
