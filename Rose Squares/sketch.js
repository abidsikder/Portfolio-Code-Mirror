class HollowSquare
{
    constructor(x, y, squareWidth, borderColorFunc, innerColorFunc, angleFunc)
    {
        this.x = x;
        this.y = y;
        this.squareWidth = squareWidth;
        this.borderColorFunc = borderColorFunc;
        this.innerColorFunc = innerColorFunc;
        this.angleFunc = angleFunc;
    }

    display()
    {
        push();
        translate(width / 2, height / 2);
        rotate(this.angleFunc(frameCount));
        translate(-width / 2, -height / 2);

        this.borderColorFunc();

        rectMode(CORNERS);
        rect(this.x, this.y, width - this.x, height - this.y);

        this.innerColorFunc();
        rect(this.x + this.squareWidth, this.y + this.squareWidth, width - this.x - this.squareWidth, height - this.y - this.squareWidth);

        pop();
    }
}

let squares = [];
let spaceBetween = 20;
let squareWidth = 10;

function setup()
{
    createCanvas(1000, 1000);
    noStroke();

    for (let i = 0; i < width / 2; i += spaceBetween)
    {
        let customAngle = i / 10000;
        let customInnerColor = () =>
        {
            colorMode(HSB);
            fill(360*noise(i/3000), 360, 360, 1);
        }

        squares.push(new HollowSquare(
            i,
            i,
            squareWidth,
            () =>
            {
                colorMode(RGB);
                fill(0, 0, 0, 20);
            },
            customInnerColor,
            (x) =>
            {
                return x * customAngle;
            }
        ))
    }
}

let angle = 0;

function draw()
{
    for (let square of squares)
    {
        square.display();
    }
}
