const MAX_TEXTURES = 8;

const DEFAULT_SHADER_TEXT = `precision mediump float;

uniform sampler2D u_tex0;

varying vec2 v_texcoord;

void main() {
    vec4 pixel = texture2D(u_tex0, v_texcoord);
    gl_FragColor = pixel;
}`