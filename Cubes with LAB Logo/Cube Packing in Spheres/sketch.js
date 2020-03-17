/// <reference path="global.d.ts" />
/// <reference path="index.d.ts" />

class Sphere
{
    constructor(pos, radius = 10)
    {
        this.pos = pos;
        this.radius = radius;
        this.growing = true;
    }

    grow()
    {
        if (this.growing)
        {
            this.radius += 3;
        }
    }

    collision(otherCirc)
    {
        return this.radius + otherCirc.radius > this.pos.dist(otherCirc.pos);
    }

    display()
    {
        push();
        // if (this.textured)
        // {
        texture(labLogo);
        // }
        translate(this.pos);
        box(this.radius);
        // sphere(this.radius);
        pop();
    }
}

let spheres = [];
let debug = false;
let labLogo;

let cage;


function setup()
{
    createCanvas(windowWidth, windowHeight, WEBGL);
    // debugMode();
    p5.disableFriendlyErrors = true;

    cage = createVector(1400, 1400, 1400);
    labLogo = createGraphics(50, 50);
    labLogo.background(0);
    // draw the lab logo outline
    labLogo.scale(0.05, 0.05)
    labLogo.colorMode(RGB);
    labLogo.noStroke();
    labLogo.fill(255, 255, 255, 255);
    // top bar
    labLogo.rect(150, 250, 700, 50);
    // left bar
    labLogo.rect(100, 250, 50, 450);

    // right bar
    labLogo.rect(850, 250, 50, 450);

    // bottom bar
    labLogo.rect(150, 650, 700, 50);

    // draw the lab logo letters
    // the L
    // the vertical
    labLogo.rect(200, 350, 50, 250);
    // the horizontal
    labLogo.rect(250, 550, 100, 50);

    // the A
    // the left and right bars
    // left bar
    labLogo.rect(400, 350, 50, 250);
    // right bar
    labLogo.rect(530, 350, 50, 250);
    // the top bar
    labLogo.rect(450, 350, 80, 50);
    // the bottom/in the middle bar
    labLogo.rect(450, 450, 80, 50);

    // the B
    // left bar
    labLogo.rect(630, 350, 50, 200);
    // right bar
    labLogo.rect(750, 350, 50, 200);

    // top bar
    labLogo.rect(680, 350, 70, 50);
    // middle bar
    labLogo.rect(680, 450, 70, 50);
    // bottom bar
    labLogo.rect(630, 550, 170, 50);

    frameRate(60);
}


function draw()
{
    background(0);
    orbitControl();
    if (frameCount % 7 == 0 && keyIsDown(32))
    {
        debug = !debug;
    }
    if (debug) debugMode();
    else noDebugMode();


    rotateX(frameCount / 100);
    rotateZ(frameCount / 100);

    if (spheres.length < 1000)
    {
        // seed the new spheres
        let numNew = 3;
        let attempts = 0;
        let maxAttempts = 800;
        let newSpheres = [];
        while (newSpheres.length < numNew && attempts < maxAttempts)
        {
            attempts++;
            let newSPos = createVector(
                random(0, cage.x),
                random(0, cage.y),
                random(0, cage.z)
            );
            let newS = new Sphere(newSPos, 3);
            for (let c of spheres)
            {
                if (newS.collision(c))
                {
                    continue;
                }
            }
            newSpheres.push(newS);
        }
        for (let s of newSpheres)
        {
            s.textured = random(0, 1) < 0.3;
            spheres.push(s);
        }
    }

    // call all the spheres to grow and then display
    translate(p5.Vector.div(cage, -2));
    for (let s of spheres)
    {
        fill(0);
        stroke(255);
        strokeWeight(1.3);
        // texture(labLogo);
        s.grow();
        s.display();
    }

    // check all the spheres for collisions
    for (let i = 0; i < spheres.length; i++)
    {
        let s1 = spheres[i];
        for (let j = i + 1; j < spheres.length; j++)
        {
            let s2 = spheres[j];
            if (s1.collision(s2))
            {
                s1.growing = false;
                s2.growing = false;
            }
        }
    }

}
