class Hub
{
  constructor(radius)
  {
    // instantiate motion variables
    // instantiate position to be in the middle of the sketch
    this.position = createVector(width/2-7,height/2);
    this.velocity = createVector(0, 0);
    this.netForce = createVector(0,0);

    this.radius = radius;
    let radiusToMass = 0.1;
    this.mass = radius*radiusToMass;
  }

  display()
  {
    // just a simple black outlined circle
    colorMode(RGB);
    stroke(0);
    strokeWeight(1);
    fill(255, 255, 255, 255);
    ellipse(this.position.x, this.position.y, this.radius, this.radius);
  }
}


class SpringConnection
{
  constructor(initPos1, initPos2, springConstant, restingLength, endpoint)
  {
    // tracks the location
    this.pos1 = initPos1;
    this.pos2 = initPos2;

    // track which endpoint this spring is connected to
    this.endpoint = endpoint;

    this.springConstant = springConstant  === undefined ? random(0, 10) : springConstant;
    this.restingLength  = restingLength   === undefined ? random(0, 10) : restingLength;
  }


  calcForceMag()
  {
    // calculate magnitude of deltaX
    let deltaX = this.pos1.dist(this.pos2);
    let forceMag = deltaX * this.springConstant;

    return forceMag;
  }

  calcForcePos1()
  {
    // true means compressed, false means stretched
    let compressed = this.pos1.dist(this.pos2) < 0 ? true : false;

    let forceMag = this.calcForceMag();
    let pos2Abs = this.pos2.copy();
    let angle = this.pos1.angleBetween(this.pos2);

    let subCoord1 = p5.Vector.sub(this.pos1,this.pos2);
    if (subCoord1.x < 0)
    {
      // if in quadrant 2
      if (subCoord1.y > 0)
      {
        angle += PI/2;
      }
      // if in quadrant 3
      else
      {
        angle += PI;
      }
    }
    else
    {
      // if in quadrant 1
      if (subCoord1.y > 0)
      {
        ;
      }
      // quadrant 4
      else
      {
        angle += 3 * PI / 2;
      }
    }

    if (compressed)
    {
      ;
    }
    else
    {
      angle += PI;
    }

    let forceVectorOnPos1 = p5.Vector.fromAngle(angle, forceMag);


    return forceVectorOnPos1;
  }

  calcForcePos2()
  {
    // can just rotate the vector because it's a line
    let forceVectorOnPos2 = this.calcForcePos1().rotate(PI);

    return forceVectorOnPos2;
  }

  display()
  {
    // calculate a red color proportional to the Force
    let forceMag = this.calcForceMag();
    let forceToColorConstant = 8000;

    // draw a line between pos1 and pos2 with the color of the red
    colorMode(HSB);
    strokeWeight(4);
    stroke(noise(perlinCounter)*360, 360, 360, 255);
    line(this.pos1.x, this.pos1.y, this.pos2.x, this.pos2.y);
  }
}

class Endpoint
{
  constructor(initPos, radius)
  {
    // initialize the motion variables
    this.position = initPos;
    this.velocity = createVector(0, 0);
    this.netForce = createVector(0,0);

    this.radius = radius;
    let radiusToMass = 0.1;
    this.mass = radius*radiusToMass;
  }

  display()
  {
    // just a simple black outlined circle
    colorMode(RGB);
    stroke(0);
    strokeWeight(20);
    fill(255);
    ellipse(this.position.x, this.position.y, this.radius, this.radius);
  }
}

function updateMotion(particle)
{
  // calculate acceleration
  let netAcceleration = p5.Vector.div(particle.netForce, particle.mass);
  // trickle down to the other motion variables of the particle
  particle.velocity.add(netAcceleration);
  particle.position.add(particle.velocity);
  particle.velocity.limit(5);

  // for now, zero out the forces when done
  particle.netForce.x = 0;
  particle.netForce.y = 0;
}

var repulsionDistance = 40;
var repulsionCoefficient = 0.001;
var hubRepulsionCoefficient = 1;

// calculates the repulsion on particle1
function calcRepulsion(particle1, particle2)
{
  let distance = particle1.position.dist(particle2.position);
  let repulsed = distance < repulsionDistance;
  if (!repulsed)
  {
    return;
  }

  let forceMag = (repulsionDistance - distance) * repulsionCoefficient;

  let pos1 = particle1.position.copy();
  let pos2 = particle2.position.copy();

  let pos2Abs = pos2.copy();
  let angle = pos1.angleBetween(pos2);

  let subCoord1 = p5.Vector.sub(pos1,pos2);
  if (subCoord1.x < 0)
  {
    // if in quadrant 2
    if (subCoord1.y > 0)
    {
      angle += PI/2;
    }
    // if in quadrant 3
    else
    {
      angle += PI;
    }
  }
  else
  {
    // if in quadrant 1
    if (subCoord1.y > 0)
    {
      ;
    }
    // quadrant 4
    else
    {
      angle += 3 * PI / 2;
    }
  }

  let forceVectorOnPos1 = p5.Vector.fromAngle(angle, forceMag);


  return forceVectorOnPos1;
}

function calcRepulsionHub(particle1)
{
  let particle2 = hub;
  let distance = particle1.position.dist(particle2.position);
  let repulsed = distance < repulsionDistance;
  if (!repulsed)
  {
    return;
  }

  let forceMag = (repulsionDistance - distance) * hubRepulsionCoefficient;

  let pos1 = particle1.position.copy();
  let pos2 = particle2.position.copy();

  let pos2Abs = pos2.copy();
  let angle = pos1.angleBetween(pos2);

  let subCoord1 = p5.Vector.sub(pos1,pos2);
  if (subCoord1.x < 0)
  {
    // if in quadrant 2
    if (subCoord1.y > 0)
    {
      angle += PI/2;
    }
    // if in quadrant 3
    else
    {
      angle += PI;
    }
  }
  else
  {
    // if in quadrant 1
    if (subCoord1.y > 0)
    {
      ;
    }
    // cordinate 4
    else
    {
      angle += 3 * PI / 2;
    }
  }

  let forceVectorOnPos1 = p5.Vector.fromAngle(angle, forceMag);


  return forceVectorOnPos1;

}

var hub;
var endpoints = [];
var springs = [];
var numEndpoints = 200;
var perlinCounter = 0;
var randomOutlineDisplayTimer = 0;


function setup() {
  createCanvas(1000, 1000);

  // when instantiating, springs should have the same object reference for their pos2 as the endpoint's pos
  // instantiate hub
  hub = new Hub(80);

  for (let i = 0; i < numEndpoints; i++)
  {
  // instantiate endpoints at random places
    let endpoint = new Endpoint(
      createVector(
        random(0, width),
        random(0, height)
      ),
      random(1, 10)
    );
    endpoints.push(endpoint);

    // instantiate springs between the hub and those random places
    let spring = new SpringConnection(
      hub.position,
      endpoint.position,
      random(0, 0.00001),
      hub.position.dist(endpoint.position) + random(0, 0.0001),
      endpoint
    );
    springs.push(spring);

    // add springs to endpoint
    endpoint.spring = spring;
  }

  // frameRate(1);
  randomOutlineDisplayTimer = Math.floor(springs.length/2);
}


function draw() {
  // go through and update the motion of the hub + all the endpoints based on repulsion
  // hub is always pos1
  for (let spring of springs)
  {
    hub.netForce.add(spring.calcForcePos1());
  }
  // updateMotion(hub);

  for (let endpoint of endpoints)
  {
    // add up force from the springs on all the endpoints
    endpoint.netForce.add(endpoint.spring.calcForcePos2());
    // add up force from the repulsion forces on all the endpoints
    for (let endpoint2 of endpoints)
    {
      if (endpoint != endpoint2)
      {
        let repulsionForce = calcRepulsion(endpoint, endpoint2);
        if (repulsionForce !== undefined)
        {
          endpoint.netForce.add(repulsionForce);
        }
      }
    }

    // do the repulsion between the object and the central hub
    let repulsionForce = calcRepulsionHub(endpoint);
    if (repulsionForce !== undefined)
    {
      endpoint.netForce.add(repulsionForce);
    }

    updateMotion(endpoint);
  }

  // draw the background after the calculations are all done
  // background(0);

  color (RGB);
  fill(0, 0, 0, 10);
  rect(0, 0, width, height);

  // draw the lab logo outline
  colorMode(HSB);
  noStroke();
  fill(0, 0, 1, 0.3);
  // top bar
  rect(150, 250, 700, 50);
  // left bar
  rect(100, 250, 50, 450);

  // right bar
  rect(850, 250, 50, 450);

  // bottom bar
  rect(150, 650, 700, 50);

  // update the display of everything
  for (let i = 0; i < springs.length; i++)
  {
    springs[i].display();
    if (i === randomOutlineDisplayTimer)
    {
      // draw the logo outline
    }
  }

  for (let endpoint of endpoints)
  {
    // endpoint.display();
  }
  // hub.display();

  perlinCounter += 0.001;


  // draw the lab logo letters

  colorMode(RGB);
  noStroke();
  fill(0, 0, 0, 255);
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
}
