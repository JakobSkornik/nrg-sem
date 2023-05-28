#version 300 es

/* 
* 
* RAYCAST FRAGMENT SHADER
*
* This shader raycasts 3D texture, extracts a color if the ray hits a part of the texture where
* the green channel value is above a certain threshold, and calculates a surface normal at the 
* hit position. Now this shader produces either colored or black and white output, depending on
* the value of 'pause'.
* 
*/

precision highp float;
precision highp sampler3D;

in vec3 vPos;
in vec3 vCameraPos;
in mat3 vNMatrix;

uniform sampler3D map;
uniform vec3 size;
uniform float raySteps;
uniform int hasColor;

out vec4 outColor;

vec3 getNormal(vec3 p) {
    float f0 = texture(map, p).g;
    vec2 e = vec2(0.01, 0.0);
    vec3 n = f0 - vec3(texture(map, p+e.xyy).g, texture(map, p+e.yxy).g, texture(map, p+e.yyx).g);

    float epsilon = 0.01;
    if ( p.x < epsilon ) n = vec3( -1.0, 0.0, 0.0 );
    if ( p.y < epsilon ) n = vec3( 0.0, -1.0, 0.0 );
    if ( p.z < epsilon ) n = vec3( 0.0, 0.0, -1.0 );
    if ( p.x > 1.0 - epsilon ) n = vec3( 1.0, 0.0, 0.0 );
    if ( p.y > 1.0 - epsilon ) n = vec3( 0.0, 1.0, 0.0 );
    if ( p.z > 1.0 - epsilon ) n = vec3( 0.0, 0.0, 1.0 );

    return normalize(vNMatrix * n);
}

void main() {
    vec3 ray = normalize(vPos - vCameraPos) * length(size);

    outColor = vec4(0.0);
    for (float i = 1.0; i <= raySteps; i++) {
        vec3 texCoord = vec3(0.5) + vec3(vPos + ray * i / raySteps) / size;

        if (texCoord.x >= 0.0 && texCoord.x <= 1.0
         && texCoord.y >= 0.0 && texCoord.y <= 1.0
         && texCoord.z >= 0.0 && texCoord.z <= 1.0) {
            vec4 color = texture(map, texCoord);
            if (color.g > 0.25) {
                if (hasColor == 0) {
                    vec3 grayscale = vec3(0.299*color.r + 0.587*color.g + 0.114*color.b);
                    outColor = vec4(grayscale, 0.8);
                } else {
                    outColor = vec4(getNormal(texCoord), 0.8);
                }
                break;
            }
        }
    }
}
