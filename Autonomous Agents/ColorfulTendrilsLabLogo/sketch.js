class FlowFieldPerlin
{
    constructor(resolution, perlinSeed, strength = 40)
    {
        this.resolution = resolution;
        this.perlinSeed = perlinSeed;
        this.strength = strength;
        this.rows = width / resolution;
        this.cols = height / resolution;

        this.field = [];

        let randomTurn = random(0, 1) < 0.5;
        noiseSeed(perlinSeed);
        let xOff = 0;
        for (let i = 0; i < this.rows; i++)
        {
            let yOff = 0;

            let row = [];
            this.field.push(row);
            for (let j = 0; j < this.cols; j++)
            {
                let angle = map(noise(xOff, yOff), 0, 1, 0, TWO_PI);
                if (randomTurn)
                {
                    angle += PI;
                }

                let forceVector = p5.Vector.fromAngle(angle);
                forceVector.normalize();
                forceVector.mult(this.strength);
                row.push(forceVector);

                yOff += 0.1;
            }

            xOff += 0.1;
        }
    }

    getForce(positionVector)
    {
        let maxRowIndex = this.rows - 1;
        let maxColIndex = this.cols - 1;

        let res = this.resolution;

        let row = constrain(Math.floor(positionVector.x / res), 0, maxRowIndex);
        let col = constrain(Math.floor(positionVector.y / res), 0, maxColIndex);

        let force = this.field[row][col];

        return force;
    }
}

class Particle
{
    constructor(x, y, radius, radiusFunc, colorFunc, maxSpeed = 10, maxForce = 0.1)
    {
        this.position = createVector(x, y);
        this.velocity = createVector(0, 0);
        this.acceleration = createVector(0, 0);

        this.radius = radius;
        this.radiusFunc = radiusFunc;
        this.colorFunc = colorFunc;

        this.maxSpeed = maxSpeed;
        this.maxForce = maxForce;
    }


    seek(flowField)
    {
        let desired = flowField.getForce(this.position);

        desired.normalize();
        desired.mult(this.maxSpeed);
        let steer = p5.Vector.sub(desired, this.velocity);
        steer.limit(this.maxForce);

        this.applyForce(steer);
    }

    applyForce(force)
    {
        this.acceleration.add(force);
    }

    update()
    {
        this.velocity.add(this.acceleration);
        this.velocity.limit(this.maxSpeed);
        this.position.add(this.velocity);

        this.radius = this.radiusFunc(this.radius);

        this.acceleration.mult(0);
    }

    display()
    {
        this.colorFunc();
        ellipse(this.position.x, this.position.y, this.radius, this.radius);
    }
}

class Cluster
{
    constructor(numParticles, emitX, emitY)
    {
        this.field = new FlowFieldPerlin(10, frameCount);

        this.particles = [];
        for (let i = 0; i < numParticles; i++)
        {
            let particleX = emitX + random(-10, 10);
            let particleY = emitY + random(-10, 10);
            this.particles.push(
                new Particle(
                    particleX,
                    particleY,
                    60,
                    (x) => { return x - 0.25 },
                    () =>
                    {
                        colorMode(RGB);
                        stroke(0);
                        strokeWeight(0.4);
                        colorMode(HSB);
                        noiseSeed(emitX);
                        fill(360 * noise(random(0, 20000) + frameCount / 100), 360, 360, 0.3);
                    }
                )
            );
        }
    }

    update()
    {
        let nextGen = [];

        for (let particle of this.particles)
        {
            particle.seek(this.field);
            particle.update();

            if (particle.radius > 0)
            {
                nextGen.push(particle);
            }
        }

        this.particles = nextGen;
    }

    display()
    {
        for (let particle of this.particles)
        {
            particle.display();
        }
    }
}

let clusters = [];

function setup()
{
    createCanvas(1000, 1000);
}

function mouseClicked()
{
    clusters.push(new Cluster(
        Math.floor(random(40, 50)),
        mouseX,
        mouseY
    )
    );
}

function draw()
{
    // draw the lab logo outline
    colorMode(RGB);
    noStroke();
    fill(255, 255, 255, 7);
    // top bar
    rect(150, 250, 700, 50);
    // left bar
    rect(100, 250, 50, 450);

    // right bar
    rect(850, 250, 50, 450);

    // bottom bar
    rect(150, 650, 700, 50);
    for (let cluster of clusters)
    {
        cluster.update();
        cluster.display();
    }

    // draw the lab logo letters
    colorMode(RGB);

    fill(255, 255, 255, 255);
    noStroke();
    // the L
    // the vertical
    rect(200, 350, 50, 250);
    // the horizontal
    rect(250, 550, 100, 50);

    // the A
    // the left and right bars
    // left bar
    rect(400, 350, 50, 250);
    // right bar
    rect(530, 350, 50, 250);
    // the top bar
    rect(450, 350, 80, 50);
    // the bottom/in the middle bar
    rect(450, 450, 80, 50);

    // the B
    // left bar
    rect(630, 350, 50, 200);
    // right bar
    rect(750, 350, 50, 200);

    // top bar
    rect(680, 350, 70, 50);
    // middle bar
    rect(680, 450, 70, 50);
    // bottom bar
    rect(630, 550, 170, 50);

    let nextClusterGen = [];
    for (let cluster of clusters)
    {
        if (cluster.particles.length != 0)
        {
            nextClusterGen.push(cluster);
        }
    }
    clusters = nextClusterGen;
}
