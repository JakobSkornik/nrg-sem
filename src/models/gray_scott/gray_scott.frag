#version 300 es

precision highp float;
precision highp sampler3D;

in vec2 vUv2;

out vec4 outColor[gl_MaxDrawBuffers];

uniform sampler3D map;
uniform float startZ;
uniform vec3 resolution;

uniform vec2 D;
uniform float f;
uniform float k;
uniform float w;
uniform vec3 windDirection;
uniform float G;
uniform vec3 gravityPosition;
uniform int isWrapMode;
uniform int pause;

vec2 calculateLaplacian(vec3 p) {
    vec3 pix = 1.0 / resolution;

    vec2 s0 = texture(map, isWrapMode == 1 ? fract(p) : p).xy;
    vec2 s1 = texture(map, isWrapMode == 1 ? fract(p + vec3(pix.x, 0.0, 0.0)) : p + vec3(pix.x, 0.0, 0.0)).xy;
    vec2 s2 = texture(map, isWrapMode == 1 ? fract(p - vec3(pix.x, 0.0, 0.0)) : p - vec3(pix.x, 0.0, 0.0)).xy;
    vec2 s3 = texture(map, isWrapMode == 1 ? fract(p + vec3(0.0, pix.y, 0.0)) : p + vec3(0.0, pix.y, 0.0)).xy;
    vec2 s4 = texture(map, isWrapMode == 1 ? fract(p - vec3(0.0, pix.y, 0.0)) : p - vec3(0.0, pix.y, 0.0)).xy;
    vec2 s5 = texture(map, isWrapMode == 1 ? fract(p + vec3(0.0, 0.0, pix.z)) : p + vec3(0.0, 0.0, pix.z)).xy;
    vec2 s6 = texture(map, isWrapMode == 1 ? fract(p - vec3(0.0, 0.0, pix.z)) : p - vec3(0.0, 0.0, pix.z)).xy;

    return s1 + s2 + s3 + s4 + s5 + s6 - 6.0 * s0;
}

vec3 externalForces(vec3 p) {
    if (pause == 1) {
        return p;
    }

    vec3 displacement = windDirection * w / 1000.0;
    vec3 gravityForce = (gravityPosition - p) * G; // vector from current position to gravity center scaled by gravity strength
    vec3 advectedPosition = isWrapMode == 1 ? fract(p - displacement + gravityForce) : p - displacement + gravityForce;
    return advectedPosition;
}

vec4 grayScott3D(vec3 p) {
    if (pause == 1) {
        return texture(map, p);
    }

    vec2 s0 = texture(map, p).xy;
    vec2 lap = calculateLaplacian(p);
    vec2 s;
    s.x = max(0.0, min(1.0, s0.x + D.x * lap.x - s0.x * s0.y * s0.y + f * (1.0 - s0.x)));
    s.y = max(0.0, min(1.0, s0.y + D.y * lap.y + s0.x * s0.y * s0.y - (f + k) * s0.y));
    return vec4(s, 0.0, 1.0);
}

void main() {
    vec4 color[gl_MaxDrawBuffers];
    for (int i = 0; i < gl_MaxDrawBuffers; i++) {
        vec3 p = vec3(vUv2, (startZ + float(i) + 0.5) / resolution.z);
        p = externalForces(p);
        color[i] = grayScott3D(p);
    }
    outColor = color;
}
