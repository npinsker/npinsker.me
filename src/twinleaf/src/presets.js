import { DEFAULT_SHADER_TEXT } from "./constants";

const THREE_CHANNEL_TEXT = `precision mediump float;
              
uniform sampler2D u_tex0;

varying vec2 v_texcoord;

uniform vec3 redColor;
uniform vec3 greenColor;
uniform vec3 blueColor;

void main() {
    vec4 px = texture2D(u_tex0, v_texcoord);
    vec3 blended = (
        px.r * redColor
      + px.g * greenColor
      + px.b * blueColor
    );
    gl_FragColor = vec4(blended, px.a);
}`;

const PALETTE_SHADER_TEXT = `precision mediump float;

uniform sampler2D u_tex0;
uniform sampler2D u_tex1;

varying vec2 v_texcoord;

float paletteStrength = 1.0;

vec3 rgb2hsl( in vec3 c ) {
  // Credit to https://www.shadertoy.com/view/MsKGRW;
  // based on work originally by Sam Hocevar and Emil Persson
  const float epsilon = 1e-8;
  float cmin = min( c.r, min( c.g, c.b ) );
  float cmax = max( c.r, max( c.g, c.b ) );
  float cd   = cmax - cmin;
  vec3 hsl = vec3(0.0);
  hsl.z = (cmax + cmin) / 2.0;
  hsl.y = mix(cd / (cmax + cmin + epsilon), cd / (epsilon + 2.0 - (cmax + cmin)), step(0.5, hsl.z));

  // Special handling for the case of 2 components being equal and max at the same time,
  // this can probably be improved but it is a nice proof of concept
  vec3 a = vec3(1.0 - step(epsilon, abs(cmax - c)));
  a = mix(vec3(a.x, 0.0, a.z), a, step(0.5, 2.0 - a.x - a.y));
  a = mix(vec3(a.x, a.y, 0.0), a, step(0.5, 2.0 - a.x - a.z));
  a = mix(vec3(a.x, a.y, 0.0), a, step(0.5, 2.0 - a.y - a.z));

  hsl.x = dot( vec3(0.0, 2.0, 4.0) + ((c.gbr - c.brg) / (epsilon + cd)), a );
  hsl.x = (hsl.x + (1.0 - step(0.0, hsl.x) ) * 6.0 ) / 6.0;
  return hsl;
}

void main() {
    vec4 pixel = texture2D(u_tex0, v_texcoord);
    
    vec4 result = texture2D(u_tex1, vec2( rgb2hsl(pixel.rgb).z, 0.5 ));
    vec4 pixelAsPaletteColor = vec4(result.rgb, 1.0) * pixel.a;
    gl_FragColor = mix(pixel, pixelAsPaletteColor, paletteStrength);
}`

const GOLDEN_GLOW_SHADER_TEXT = `precision mediump float;

uniform sampler2D u_tex0;

uniform float u_time;

varying vec2 v_texcoord;

float whiteThreshold = 1.4;
vec3 goldColor = vec3(0.945, 0.788, 0.090);

vec3 mod289(vec3 x) {
    return x - floor(x * (1. / 289.)) * 289.;
}

vec2 mod289(vec2 x) {
    return x - floor(x * (1. / 289.)) * 289.;
}

vec3 permute(vec3 x) {
    return mod289(((x * 34.) + 1.) * x);
}

float snoise(vec2 v) {
  const vec4 C = vec4(.211324865405187,.366025403784439,-.577350269189626,.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1., 0.) : vec2(0., 1.);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute( permute( i.y + vec3(0., i1.y, 1. )) + i.x + vec3(0., i1.x, 1. ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.);
  m = m*m;
  m = m*m;
  vec3 x = 2. * fract(p * C.www) - 1.;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - .85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130. * dot(m, g);
}

void main() {
  vec4 col = texture2D(u_tex0, v_texcoord);
  vec2 uv1 = vec2(v_texcoord.x + u_time * 0.1, v_texcoord.y + u_time * 0.08);
  vec2 uv2 = vec2(v_texcoord.x - u_time * 0.1 + 105.5, v_texcoord.y + u_time * 0.08 + 3.4);
  float boost1 = snoise(6.0 * uv1);
  float boost2 = snoise(6.0 * uv2);
  vec4 white = vec4(1, 1, 1, col.a);
  if (boost1 + boost2 > whiteThreshold) {
      gl_FragColor = white * col.a;
      return;
  }

  vec4 golden = vec4(goldColor, col.a);
  gl_FragColor = mix(col, golden, 0.2 + 0.24 * (1.0 + sin(u_time * 3.5)) / 2.0) * col.a;
}`;

const RAINBOW_NOISE_SHADER_TEXT = `precision mediump float;

#define      PI 3.14159265358979323846264338327950288419716939937511 // mm pie
#define     TAU 6.28318530717958647692528676655900576839433879875021 // pi * 2
#define HALF_PI 1.57079632679489661923132169163975144209858469968755 // pi / 2

uniform float u_time;
uniform vec2 u_resolution;
varying vec2 v_texcoord;

//
// Description : Array and textureless GLSL 2D simplex noise function.
//      Author : Ian McEwan, Ashima Arts.
//  Maintainer : stegu
//     Lastmod : 20110822 (ijm)
//     License : Copyright (C) 2011 Ashima Arts. All rights reserved.
//               Distributed under the MIT License. See LICENSE file.
//               https://github.com/ashima/webgl-noise
//               https://github.com/stegu/webgl-noise
//

vec3 mod289(vec3 x) {
    return x - floor(x * (1. / 289.)) * 289.;
}

vec2 mod289(vec2 x) {
    return x - floor(x * (1. / 289.)) * 289.;
}

vec3 permute(vec3 x) {
    return mod289(((x * 34.) + 1.) * x);
}

float snoise(vec2 v) {
  const vec4 C = vec4(.211324865405187,.366025403784439,-.577350269189626,.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1., 0.) : vec2(0., 1.);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute( permute( i.y + vec3(0., i1.y, 1. )) + i.x + vec3(0., i1.x, 1. ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.);
  m = m*m;
  m = m*m;
  vec3 x = 2. * fract(p * C.www) - 1.;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - .85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130. * dot(m, g);
}

vec3 hsv2rgb(vec3 c) {
  vec3 rgb = clamp(abs(mod(c.x*6.+vec3(0.,4.,2.),6.)-3.)-1.,0.,1.);
  rgb = rgb * rgb * (3. - 2. * rgb);
  return c.z * mix(vec3(1.), rgb, c.y);
}

vec2 pq(vec2 uv) {
  return vec2(atan(uv.x, uv.y) / TAU + .5, length(uv));;
}

vec4 glorb(vec2 uv, vec2 offset, float radius) {
  vec2 pq = pq(uv + offset);
  float r = radius * snoise(uv + u_time * .2);
  float s = 8. / u_resolution.y;
  float m = smoothstep(r + s, r - s, pq.y);
  vec3 c = hsv2rgb(vec3(pq.x, 1., 1.));
  return vec4(c, 1.) * m;
}

vec4 field(vec2 uv, vec2 offset, float radius) {
  vec4 c0 = glorb(uv, offset, radius);
  vec4 c1 = glorb(uv, offset, radius * .92);
  return c0 - c1;
}

void main() {
  vec2 uv = 2. * v_texcoord.xy - 1.0;
  vec4 r0 = field(uv, vec2( .0, .0), 1.66);
  vec4 r1 = field(uv, vec2( .33, .33), 1.66);
  vec4 r2 = field(uv, vec2( .33, -.33), 1.66);
  vec4 r3 = field(uv, vec2(-.33, -.33), 1.66);
  vec4 r4 = field(uv, vec2(-.33, .33), 1.66);
  vec4 f = r0+r1+r2+r3+r4;
  gl_FragColor = mix(vec4(vec3(0.), 1.), f, f.a);
}`;

export const PRESET_SHADER_MAP = {
  'default': DEFAULT_SHADER_TEXT,
  'threecolor': THREE_CHANNEL_TEXT,
  'paletteswap': PALETTE_SHADER_TEXT,
  'golden': GOLDEN_GLOW_SHADER_TEXT,
  'rainbow': RAINBOW_NOISE_SHADER_TEXT,
};