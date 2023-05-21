#version 300 es

/*
*
* CAMERA MATRIX VERTEX SHADER
*
* This shader calculates camera space position for the vertices and a normal 
* matrix which is used for transforming normals from model space to camera space.
*/


in vec3 position;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;

out vec3 vPos;
out vec3 vCameraPos;
out mat3 vNMatrix;

void main() {
    vec4 mvPosition = viewMatrix * modelMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    vPos = position;
    vCameraPos = vec4(inverse(viewMatrix * modelMatrix) * vec4(vec3(0.0), 1.0)).xyz;
    mat4 matrix = transpose(inverse(viewMatrix * modelMatrix));
    vNMatrix = mat3(matrix);
}
