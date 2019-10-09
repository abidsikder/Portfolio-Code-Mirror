/// <reference path="global.d.ts" />
/// <reference path="index.d.ts" />

class TerrainSquare
{
    // the coords are 3D, but Y values should be 0
    constructor(topLeftCoord, bottomRightCoord, resolution)
    {
        this.topLeftCoord = topLeftCoord;
        this.bottomRightCoord = bottomRightCoord;
        this.resolution = resolution;
        this.w = bottomRightCoord.x - topLeftCoord.x;
        this.h = bottomRightCoord.z - topLeftCoord.z;
        this.rows = this.w / resolution;
        this.cols = this.h / resolution;

        // 2D array of the mesh
        this.verts = [];

        for (let i = 0; i < this.rows; i++)
        {
            let row = [];
            this.verts.push(row);
            for (let j = 0; j < this.cols; j++)
            {
                let vecX = topLeftCoord.x + j * resolution;
                let vecZ = topLeftCoord.z + i * resolution;
                let randY = -150*noise(vecX/100, vecZ/100, frameCount/100);
                row.push(
                    createVector(
                        vecX,
                        randY,
                        vecZ
                    )
                );
            }
        }
    }

    display()
    {
        // iterate through all the vertices, and draw them in triangle strips properly accounting for the drawing order
        colorMode(RGB)
        strokeWeight(0.7);
        stroke(255);
        // colorMode(HSB);
        // fill(360*noise(frameCount/100), 360, 360, 60);
        fill(0);
        for (let i = 0; i < this.rows - 1; i++)
        {
            beginShape(TRIANGLE_STRIP);
            for (let j = 0; j < this.cols; j++)
            {
                let vert1 = this.verts[i][j];
                vertex(
                    vert1.x,
                    vert1.y,
                    vert1.z
                );
                let vert2 = this.verts[i + 1][j];
                vertex(
                    vert2.x,
                    vert2.y,
                    vert2.z
                );
            }
            endShape();
        }
    }

}

function preload()
{
    // preload() runs once
}

let mesh;
let meshSize = 1000;
let res = 10;

function setup()
{
    // setup() waits until preload() is done
    createCanvas(window.innerWidth, window.innerHeight, WEBGL);
}


function draw()
{
    background(255);
    rotateX(-PI/6);
    rotateY(frameCount/340*PI);
    scale(1.2);

    mesh = new TerrainSquare(
        createVector(0, 0, 0),
        createVector(meshSize, 0, meshSize),
        res
    );
    translate(-mesh.w/2, 0, -mesh.h/2);
    mesh.display();

}
