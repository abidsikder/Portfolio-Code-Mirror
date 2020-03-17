/// <reference path="global.d.ts" />
/// <reference path="index.d.ts" />

let labLogo;
function setup()
{
    createCanvas(windowWidth, windowHeight, WEBGL);

    // debugMode();
    p5.disableFriendlyErrors = true;

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

let pulseLon = 0;

function draw()
{
    scale(2);

    background(0);
    orbitControl();

    rotateX(frameCount / 100);
    rotateZ(frameCount / 100);

    texture(labLogo);
    colorMode(HSB);
    let r = 200;
    let detail = 20;
    for (let i = 0; i < detail; i++)
    {
        let lon = map(i, 0, detail, 0, PI);
        for (let j = 0; j < detail; j++)
        {
            // let r = map(200*noise(i, j), 0, 200, 180, 200);
            if (i == pulseLon)
            {
                labLogo.colorMode(HSB);
                labLogo.background(map(pulseLon+noise(frameCount/100), 0, detail+1, 0, 360), 360, 360);
            }
            else
            {
                labLogo.background(0);
            }
            labLogo.colorMode(RGB);
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

            let lat = map(j, 0, detail, 0, TWO_PI);
            let x = r * sin(lon) * cos(lat);
            let y = r * sin(lon) * sin(lat);
            let z = r * cos(lon);

            push();
            translate(x, y, z);
            box(15);
            pop();
        }
    }

    pulseLon+=1;
    pulseLon = pulseLon % detail;
}
