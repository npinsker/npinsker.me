export const CURRENT_VERSION = "0.1";

export const DEFAULT_SHADER_TEXT = `precision mediump float;

uniform vec3 color;

void main() {
    gl_FragColor = vec4(color, 1.0);
}`