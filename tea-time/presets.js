const THREE_CHANNEL_TEXT = `precision mediump float;
              
uniform sampler2D u_tex0;

varying vec2 v_texcoord;

vec3 redColor   = vec3(1., 0., 0.);
vec3 greenColor = vec3(0., 1., 0.);
vec3 blueColor  = vec3(0., 0., 1.);

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
uniform sampler2D u_tex1;

uniform float u_time;

varying vec2 v_texcoord;

float whiteThreshold = 1.35;
vec3 goldColor = vec3(0.945, 0.788, 0.090);

void main() {
  vec4 col = texture2D(u_tex0, v_texcoord);
  vec2 uv1 = vec2(mod(v_texcoord.x + u_time * 0.1, 1.0), mod(v_texcoord.y + u_time * 0.08, 1.0));
  vec2 uv2 = vec2(mod(v_texcoord.x - u_time * 0.1 + 105.5, 1.0), mod(v_texcoord.y + u_time * 0.08 + 3.4, 1.0));
  float boost1 = texture2D(u_tex1, uv1).r;
  float boost2 = texture2D(u_tex1, uv2).r;
  vec4 white = vec4(1, 1, 1, col.a);
  if (boost1 + boost2 > whiteThreshold) {
      gl_FragColor = white * col.a;
      return;
  }

  vec4 golden = vec4(goldColor, col.a);
  gl_FragColor = mix(col, golden, 0.2 + 0.24 * (1.0 + sin(u_time * 3.5)) / 2.0) * col.a;
}`;

const RAINBOW_NOISE_SHADER_TEXT = `precision mediump float;

float Epsilon = 1e-10;

uniform sampler2D u_tex0;

uniform float u_time;

varying vec2 v_texcoord;

float saturation = 1.0;
float value = 0.9;

float map(float value, float old_lo, float old_hi, float new_lo, float new_hi) {
    return mix(new_lo, new_hi, (value - old_lo) / (old_hi - old_lo));
}

float hash(float x) {
    return fract(sin(x) * 43758.5453123);
}

vec3 gradient(vec3 cell) {
	float h_i = hash(cell.x);
    float h_j = hash(cell.y + pow(h_i, 3.0));
    float h_k = hash(cell.z + pow(h_j, 5.0));
    float ii = map(fract(h_i + h_j + h_k), 0.0, 1.0, -1.0, 1.0);
    float jj = map(fract(h_j + h_k), 0.0, 1.0, -1.0, 1.0);
    float kk = map(h_k, 0.0, 1.0, -1.0, 1.0);
    return normalize(vec3(ii, jj, kk));
}

float fade(float t) {
    float t3 = t * t * t;
    float t4 = t3 * t;
    float t5 = t4 * t;
    return (6.0 * t5) - (15.0 * t4) + (10.0 * t3);
}


float noise(in vec3 coord) {
    vec3 cell = floor(coord);
    vec3 unit = fract(coord);

    vec3 unit_000 = unit;
    vec3 unit_100 = unit - vec3(1.0, 0.0, 0.0);
    vec3 unit_001 = unit - vec3(0.0, 0.0, 1.0);
    vec3 unit_010 = unit - vec3(0.0, 1.0, 0.0);
    vec3 unit_101 = unit - vec3(1.0, 0.0, 1.0);
    vec3 unit_110 = unit - vec3(1.0, 1.0, 0.0);
    vec3 unit_011 = unit - vec3(0.0, 1.0, 1.0);
    vec3 unit_111 = unit - 1.0;
    vec3 c_000 = cell;
    vec3 c_100 = cell + vec3(1.0, 0.0, 0.0);
    vec3 c_001 = cell + vec3(0.0, 0.0, 1.0);
    vec3 c_101 = cell + vec3(1.0, 0.0, 1.0);
    vec3 c_010 = cell + vec3(0.0, 1.0, 0.0);
    vec3 c_110 = cell + vec3(1.0, 1.0, 0.0);
    vec3 c_011 = cell + vec3(0.0, 1.0, 1.0);
    vec3 c_111 = cell + 1.0;
    float wx = fade(unit.x);
    float wy = fade(unit.y);
    float wz = fade(unit.z);

    float x000 = dot(gradient(c_000), unit_000);
    float x100 = dot(gradient(c_100), unit_100);
    float x001 = dot(gradient(c_001), unit_001);
    float x101 = dot(gradient(c_101), unit_101);
    float x010 = dot(gradient(c_010), unit_010);
    float x110 = dot(gradient(c_110), unit_110);
    float x011 = dot(gradient(c_011), unit_011);
    float x111 = dot(gradient(c_111), unit_111);

    float y0 = mix(x000, x100, wx);
    float y1 = mix(x001, x101, wx);
    float y2 = mix(x010, x110, wx);
    float y3 = mix(x011, x111, wx);
    
    float z0 = mix(y0, y2, wy);
    float z1 = mix(y1, y3, wy);
    
    return mix(z0, z1, wz);
}

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
    vec4 c = texture2D(u_tex0, v_texcoord);
    float ca = c.a;
    c.a = 1.0;

    float h = noise(vec3(
        5.0 * fract(v_texcoord.x),
        5.0 * fract(v_texcoord.y),
        u_time * 0.6
	));
    gl_FragColor = vec4(hsv2rgb(vec3(h, saturation, value)), 1);
}`;

const PRESET_SHADER_MAP = {
  'threecolor': THREE_CHANNEL_TEXT,
  'paletteswap': PALETTE_SHADER_TEXT,
  'golden': GOLDEN_GLOW_SHADER_TEXT,
  'rainbow': RAINBOW_NOISE_SHADER_TEXT,
};