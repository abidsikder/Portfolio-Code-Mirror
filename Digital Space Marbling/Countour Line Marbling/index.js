"use strict";

class Controller
{
    constructor()
    {
        this.debug = false;

        // time slices through the 3D noise, "animating" the 2D image we see
        this["time"] = 0.001;

        // the literal movement through time we are doing, outside of any of the code
        this["timeStep"] = 0.0005;

        this.textureLoader = new THREE.TextureLoader();
        this.tex1 = this.textureLoader.load( "LAB.png");
        this.tex1.wrapS = this.tex1.wrapT = THREE.RepeatWrapping;

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

        void main()
        {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4( position , 1.0);
        }
        `;
    }

    /*
    * makes 2D, 3D, and 4D noise functions available 
    * snoise(vec2 v)
    * snoise(vec3 v)
    * snoise(vec4 v)
    */
    fragmentShaderNoiseFunctionGenerator()
    {
        return `

// All Simplex Noise Functions

float permute(float x){return floor(mod(((x*34.0)+1.0)*x, 289.0));}
vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}

float taylorInvSqrt(float r){return 1.79284291400159 - 0.85373472095314 * r;}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

// Simplex 2D noise
//	by Ian McEwan, Ashima Arts
float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
           -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
  + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
    dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

//	Simplex 3D Noise 
//	by Ian McEwan, Ashima Arts
//
float snoise(vec3 v){ 
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

// First corner
  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 =   v - i + dot(i, C.xxx) ;

// Other corners
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  //  x0 = x0 - 0. + 0.0 * C 
  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1. + 3.0 * C.xxx;

// Permutations
  i = mod(i, 289.0 ); 
  vec4 p = permute( permute( permute( 
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

// Gradients
// ( N*N points uniformly over a square, mapped onto an octahedron.)
  float n_ = 1.0/7.0; // N=7
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z *ns.z);  //  mod(p,N*N)

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);

//Normalise gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

// Mix final noise value
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                dot(p2,x2), dot(p3,x3) ) );
}

//	Simplex 4D Noise 
//	by Ian McEwan, Ashima Arts
//
vec4 grad4(float j, vec4 ip){
  const vec4 ones = vec4(1.0, 1.0, 1.0, -1.0);
  vec4 p,s;

  p.xyz = floor( fract (vec3(j) * ip.xyz) * 7.0) * ip.z - 1.0;
  p.w = 1.5 - dot(abs(p.xyz), ones.xyz);
  s = vec4(lessThan(p, vec4(0.0)));
  p.xyz = p.xyz + (s.xyz*2.0 - 1.0) * s.www; 

  return p;
}

float snoise(vec4 v){
  const vec2  C = vec2( 0.138196601125010504,  // (5 - sqrt(5))/20  G4
                        0.309016994374947451); // (sqrt(5) - 1)/4   F4
// First corner
  vec4 i  = floor(v + dot(v, C.yyyy) );
  vec4 x0 = v -   i + dot(i, C.xxxx);

// Other corners

// Rank sorting originally contributed by Bill Licea-Kane, AMD (formerly ATI)
  vec4 i0;

  vec3 isX = step( x0.yzw, x0.xxx );
  vec3 isYZ = step( x0.zww, x0.yyz );
//  i0.x = dot( isX, vec3( 1.0 ) );
  i0.x = isX.x + isX.y + isX.z;
  i0.yzw = 1.0 - isX;

//  i0.y += dot( isYZ.xy, vec2( 1.0 ) );
  i0.y += isYZ.x + isYZ.y;
  i0.zw += 1.0 - isYZ.xy;

  i0.z += isYZ.z;
  i0.w += 1.0 - isYZ.z;

  // i0 now contains the unique values 0,1,2,3 in each channel
  vec4 i3 = clamp( i0, 0.0, 1.0 );
  vec4 i2 = clamp( i0-1.0, 0.0, 1.0 );
  vec4 i1 = clamp( i0-2.0, 0.0, 1.0 );

  //  x0 = x0 - 0.0 + 0.0 * C 
  vec4 x1 = x0 - i1 + 1.0 * C.xxxx;
  vec4 x2 = x0 - i2 + 2.0 * C.xxxx;
  vec4 x3 = x0 - i3 + 3.0 * C.xxxx;
  vec4 x4 = x0 - 1.0 + 4.0 * C.xxxx;

// Permutations
  i = mod(i, 289.0); 
  float j0 = permute( permute( permute( permute(i.w) + i.z) + i.y) + i.x);
  vec4 j1 = permute( permute( permute( permute (
             i.w + vec4(i1.w, i2.w, i3.w, 1.0 ))
           + i.z + vec4(i1.z, i2.z, i3.z, 1.0 ))
           + i.y + vec4(i1.y, i2.y, i3.y, 1.0 ))
           + i.x + vec4(i1.x, i2.x, i3.x, 1.0 ));
// Gradients
// ( 7*7*6 points uniformly over a cube, mapped onto a 4-octahedron.)
// 7*7*6 = 294, which is close to the ring size 17*17 = 289.

  vec4 ip = vec4(1.0/294.0, 1.0/49.0, 1.0/7.0, 0.0) ;

  vec4 p0 = grad4(j0,   ip);
  vec4 p1 = grad4(j1.x, ip);
  vec4 p2 = grad4(j1.y, ip);
  vec4 p3 = grad4(j1.z, ip);
  vec4 p4 = grad4(j1.w, ip);

// Normalise gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;
  p4 *= taylorInvSqrt(dot(p4,p4));

// Mix contributions from the five corners
  vec3 m0 = max(0.6 - vec3(dot(x0,x0), dot(x1,x1), dot(x2,x2)), 0.0);
  vec2 m1 = max(0.6 - vec2(dot(x3,x3), dot(x4,x4)            ), 0.0);
  m0 = m0 * m0;
  m1 = m1 * m1;
  return 49.0 * ( dot(m0*m0, vec3( dot( p0, x0 ), dot( p1, x1 ), dot( p2, x2 )))
               + dot(m1*m1, vec2( dot( p3, x3 ), dot( p4, x4 ) ) ) ) ;

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
        uniform sampler2D tex1;

        uniform bool debug;
        uniform float time;

        #define PI		3.14159265359
        #define TWO_PI	6.28318530718

        ${this.fragmentShaderNoiseFunctionGenerator()}

        float map(float value, float min1, float max1, float min2, float max2) 
        {
            return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
        }

        /* BEGIN Contour Line Marbling Code Things*/

        mat2 m2 = mat2(0.8,-0.6,0.6,0.8);

        void regenM2(in float time, inout mat2 m2)
        {
            m2[1][0] = map(snoise(vec2(m2[1][0], time)), -1.0, 1.0, 0.5, 0.8);
        }
        
        float fbm( vec2 p , float time){
            float f = 0.0;
            regenM2(time, m2);
            f += 0.5000*snoise( p ); p = m2*p*2.02;
            f += 0.2500*snoise( p + time); p = m2*p*2.03;
            f += 0.1250*snoise( p ); p = m2*p*2.01;
            f += 0.0625*snoise( p  ); 

            return f/0.9375;
        }

        float fbm( vec2 p ){
            float f = 0.0;
            regenM2(time, m2);
            f += 0.5000*snoise( p ); p = m2*p*2.02;
            f += 0.2500*snoise( p ); p = m2*p*2.03;
            f += 0.1250*snoise( p ); p = m2*p*2.01;
            f += 0.0625*snoise( p  ); 

            return f/0.9375;
        }

        float pattern(in vec2 p, in float t, in vec2 uv, out vec2 q, out vec2 r, out vec2 g)
        {
            q = vec2(fbm(p), fbm(p + vec2(10, 1.3)));
            
            float s = dot(uv.x + 0.5, uv.y + 0.5);
            r = vec2(fbm(p + 4.0 * q + vec2(t) + vec2(1.7, 9.2)), fbm(p + 4.0 * q + vec2(t) + vec2(8.3, 2.8)));
            g = vec2(fbm(p + 2.0 * r + vec2(t * 20.0) + vec2(2, 6)), fbm(p + 2.0 * r + vec2(t * 10.0) + vec2(5, 3)));
            return fbm(p + 5.5 * g + vec2(-t * 7.0));
        }

        /* END Contour Line Marbling Code Things */

        void main() 
        {
            vec3 col = vec3(0.0);

            float t = time;
            
            vec2 uv = vUv;
            uv *= 2.0;

            vec3 labCol = texture(tex1, vUv).rgb;
            if (
                length(labCol) < 0.001 
            )
            {
                float f = fbm(uv, t);
                for (int i = 0; i < 4-1; i++)
                {
                    // just put PI as the time just to have a random constant
                    f = fbm( vec2( f ), PI);
                }
                // col = mix( vec3(1.0), vec3(1.0, 0.752, 0.796), f);
                col = mix( vec3(0.0), vec3(1.0, 0.4, 0.0)*1.7, (f + 1.0)/2.0 );
            }

            if (debug)
            {
                vec2 gv = fract(vUv*10.0);

                col.r = gv.x;
                col.g = gv.y;
                col.b = smoothstep(-1.0, 1.0, sin(time));
            }
        
            out_FragColor = vec4(col, 1.0);
        }
        `;

    }

    uniformsGenerator()
    {
        let unis = 
        {
            // all the noise parameters
            "tex1" :
            {
                value: this.tex1
            },
            "time" :
            {
                value: this["time"]
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

        this.marbleDistortionMaterial = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: this.vertexShaderSource,
            fragmentShader: this.fragmentShaderSource
        });

    }

    recompileShaders()
    {
        this.uniforms = this.uniformsGenerator();

        this.vertexShaderSource = this.vertexShaderGenerator();
        this.fragmentShaderSource = this.fragmentShaderGenerator();
       
        this.marbleDistortionMaterial = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: this.vertexShaderSource,
            fragmentShader:  this.fragmentShaderSource
        });

        this.scene.remove(this.plane);
        this.plane = new THREE.Mesh(
            this.planeGeo, this.marbleDistortionMaterial
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

        // lights

        // orbit controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);

        // initialize the plane geometry that will be used for displaying
        // trying to approximate the original width and height 
        let origImageWidth = 562; // pixels
        let origImageHeight = 291; // pixels
        this.planeHeight = 10;
        this.planeWidth = origImageWidth / origImageHeight * this.planeHeight;
        this.planeGeo = new THREE.PlaneBufferGeometry(this.planeWidth, this.planeHeight);

        // start shaders here because the size of the plane is being passed in as a uniform
        this.initShaders();
        // this.planeMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide });
        this.plane = new THREE.Mesh(this.planeGeo, this.marbleDistortionMaterial);

        this.debugCube = new THREE.Mesh(
            new THREE.BoxBufferGeometry(10, 10, 10),
            new THREE.MeshPhysicalMaterial()
        );

        this.scene.add(this.plane);

        this.camera.position.z = 7.5;

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
let guiControls = new dat.GUI({name: "LAB Contour Line Marbling Parameters"});

// adding a ".listen" to "time" makes sure it is constantly being updated when it is added to
guiControls.add(controller, "time", -10, 10).listen();
// guiControls.add(controller, "time", -10, 10);

guiControls.add(controller, "timeStep");

// functions
guiControls.add(controller, "pauseButton");
guiControls.add(controller, "resetTime");
guiControls.add(controller, "debugSwitch");

// reset all the datgui forced floats back to real 0
controller["time"] = 0.0;

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
