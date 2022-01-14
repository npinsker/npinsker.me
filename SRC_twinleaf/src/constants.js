const MAX_TEXTURES = 8;

export const DEFAULT_SHADER_TEXT = `precision mediump float;

uniform vec3 color;

void main() {
    gl_FragColor = vec4(color, 1.0);
}`