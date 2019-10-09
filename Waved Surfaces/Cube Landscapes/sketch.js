/// <reference path="global.d.ts" />
/// <reference path="index.d.ts" />


function preload()
{
    // preload() runs once
}

function setup()
{
    // setup() waits until preload() is done
    createCanvas(window.innerWidth, window.innerHeight, WEBGL);

}

let resolution = 20;
let penSize = 800;
let maxWaveHeight = 150;

function draw()
{
    background(0);
    translate(0, 100, 0);
    rotateX(-PI/6);

    colorMode(HSB);
    pointLight(360*noise(frameCount*0.005), 360, 360, 0, -800, 0);
    pointLight(360*noise(frameCount*0.005), 360, 360, 0, -800, 0);
    pointLight(360*noise(frameCount*0.005), 360, 360, 0, -800, 0);
    // pointLight(360*noise(frameCount*0.005), 360, 360, 0, -800, 0);
    // pointLight(360*noise(frameCount*0.005), 360, 360, 0, -800, 0);
    colorMode(RGB);
    // pointLight(255, 255, 255, 0, -800, 0);
    // pointLight(255, 255, 255, 0, -800, 0);
    // pointLight(255, 255, 255, 0, -800, 0);
    ortho();

    scale(1.5);

    rotateY(frameCount*0.01);

    translate(-penSize/2, 0, -penSize/2);

    // normalMaterial();
    translate(resolution/2, 0, resolution/2);
    for (let i = 0; i < penSize; i+=  resolution)
    {
        push();
        for (let j = 0; j < penSize; j+= resolution)
        {
            translate(resolution, 0, 0);
            translate(0, -maxWaveHeight*noise(i/100, j/100, frameCount*0.01), 0);
            box(resolution);
            translate(0, maxWaveHeight*noise(i/100, j/100, frameCount*0.01), 0);
        }
        pop();
        
        translate(0, 0, resolution);
    }

}
