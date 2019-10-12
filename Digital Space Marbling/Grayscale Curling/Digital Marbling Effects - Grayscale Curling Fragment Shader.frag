/**
Warping using some of the lessons from https://www.iquilezles.org/www/articles/warp/warp.htm
Copyright (c) Md Abid Sikder 2019-08-02. All rights reserved.

This code is released under the condition of the GPLv3 License, which can be found at https://www.gnu.org/licenses/gpl-3.0.en.html

Originally made in Shadertoy, so this still has some remnants of it like "iTIme" and "iResolutiuon", which should be replaceable enough.
*/

//	Simplex 2D Noise
//	by Ian McEwan, Ashima Arts
// https://gist.github.com/patriciogonzalezvivo/670c22f3966e662d2f83
// also check out: https://github.com/ashima/webgl-noise
vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

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
float noise(vec2 p)
{
    return (snoise(p)+1.0)/2.0;
}

mat2 rotate2d(float angle)
{
    return mat2( cos(angle), -sin(angle/2.), sin(angle*2.), cos(angle));
}

mat2 m2 = mat2(0.8,-0.6,0.6,0.8);
float fbm( vec2 p ){
    float f = 0.0;
    f += 0.5000*noise( p ); p = m2*p*2.02;
    m2 = rotate2d(f) + noise(p);
    f += 0.2500*noise( p ); p = m2*p*2.03;
    f += 0.1250*noise( p ); p = m2*p*2.01;
    f += 0.0625*noise( p );

    return f/0.9375;
}

float fbmN(vec2 p, int N)
{
    float f = fbm(p);
    for (int i = 0; i < N-1; i++)
    {
        f = fbm( vec2( f ) );
    }

    return f;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = fragCoord/iResolution.xy;

    float t = iTime;
    t /= 10.;

  	vec3 col = vec3(0.0);

    float f = fbm(uv);
    for (int i = 0; i < 2-1; i++)
    {
        f = fbm( vec2( f + t ) );
    }
    col += f;


    // Output to screen
    fragColor = vec4(col,1.0);
}
