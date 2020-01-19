// a vehicle that follows a flow field for movement //<>//
class VehicleFlowField
{
  PVector location;
  PVector velocity;
  PVector acceleration;

  float mass;
  float maxSpeed;
  float maxForce;

  VehicleFlowField()
  {
    this.location = new PVector(0, 0);
    this.velocity = new PVector(0, 0);
    this.acceleration = new PVector(0, 0);

    this.maxSpeed = 4;
    this.maxForce = 0.05;
  }

  // update the motion components of the vehicle
  void update()
  {
    velocity.add(acceleration);
    velocity.limit(maxSpeed);
    location.add(velocity);

    // if it went off screen, make it transition over to the other side of the screen
    if (location.x < 0)
    {
      location.x = width;
    } else if (location.x > width)
    {
      location.x = 0;
    }

    if (location.y < 0)
    {
      location.y = height;
    } else if (location.y > height)
    {
      location.y = 0;
    }

    // zero out the acceleration
    acceleration.mult(0);
  }


  void seek(FlowFieldPerlinUnique field)
  {
    int fieldRowMaxIndex = field.field.length-1;
    int fieldColumnMaxIndex = field.field[0].length-1;
    int res = field.resolution;
    PVector desired = 
      field.field[constrain(int(location.x/res), 0, fieldRowMaxIndex)][constrain(int(location.y/res), 0, fieldColumnMaxIndex)];

    float d = desired.mag();

    desired.normalize();
    desired.mult(maxSpeed);

    PVector steer = PVector.sub(desired, velocity);
    steer.limit(maxForce);

    applyForce(steer);
  }

  void applyForce(PVector force)
  {
    acceleration.add(force);
  }

  void display()
  {
    ellipse(location.x, location.y, 10, 10);
  }
}

/**
 * Generates a unique Perlin Based Flow Field that is unique every time.
 */
class FlowFieldPerlinUnique
{
  PVector[][] field;
  int rows, cols;
  int resolution;
  float strength;

  int startMillis;

  FlowFieldPerlinUnique(int res, float strength)
  {
    this.resolution = res;

    this.rows = width/resolution;
    this.cols = height/resolution;

    this.startMillis = millis();

    field = new PVector[rows][cols];

    // x offset for perlin noise
    float xoff = 0;
    for (int i = 0; i < rows; i++)
    {
      // y offset for perlin noise
      float yoff = 0;
      for (int j = 0; j < cols; j++)
      {
        float angle = map(noise(xoff+startMillis, yoff+startMillis), 0, 1, 0, TWO_PI);
        // create a new unit vector pointing in that angle, and then multiply it by the strength
        field[i][j] = (new PVector( cos(angle), sin(angle) )).mult(strength);
        yoff += 0.1;
      }
      xoff += 0.1;
    }
  }
}

VehicleFlowField[][] vs;
FlowFieldPerlinUnique f;
int resolution;
int fieldRegenerateTimer;
float strength;
float perlinCounter;

void setup()
{
  size(1000, 1000);

  resolution = 20;
  strength = 40;
  f = new FlowFieldPerlinUnique(resolution, strength);
  vs = new VehicleFlowField[width/resolution][height/resolution];

  // initialize the array of vehicles
  for (int i = 0; i < vs.length; i++)
  {
    for (int j = 0; j < vs[0].length; j++)
    {
      vs[i][j] = new VehicleFlowField();
      vs[i][j].location.x = i*resolution;
      vs[i][j].location.y = j*resolution;
    }
  }

  // initialize the field regeneration timer
  fieldRegenerateTimer = 0;

  // initialize the perlinCounter for stepping along the perlin noise function
  perlinCounter = 0;
}

void draw()
{

  // draw all the vehicles
  colorMode(HSB);
  stroke(0);
  strokeWeight(2);
  for (int i = 0; i < vs.length; i++)
  {
    for (int j = 0; j < vs[0].length; j++)
    {

      fill(360*noise(perlinCounter+i), 255, 255, 255);
      vs[i][j].seek(f);
      vs[i][j].update();
      vs[i][j].display();
    }
  }

  if (fieldRegenerateTimer > 29)
  {
    f = new FlowFieldPerlinUnique(resolution, strength);
    fieldRegenerateTimer = 0;
  }
  fieldRegenerateTimer++;

  perlinCounter += 0.01;

  // draw the lab logo outline
  colorMode(RGB);
  stroke(0);
  strokeWeight(0);
  stroke(255);
  noStroke();
  fill(255, 255, 255, 30);
  // top bar
  rect(150, 250, 700, 50);
  // left bar
  rect(100, 250, 50, 450);
  
  // right bar
  rect(850, 250, 50, 450);
  
  // bottom bar
  rect(150, 650, 700, 50);

  // draw the lab logo letters
  colorMode(RGB);
  stroke(0);
  strokeWeight(0);

  stroke(255);
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
  
}
