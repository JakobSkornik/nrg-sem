export const vertexGlsl = /* glsl */ `
in vec3 position;

uniform mat4 modelMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform vec3 cameraPos;

out vec3 vOrigin;
out vec3 vDirection;

void main() {
    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );

    vOrigin = vec3( inverse( modelMatrix ) * vec4( cameraPos, 1.0 ) ).xyz;
    vDirection = position - vOrigin;

    gl_Position = projectionMatrix * mvPosition;
}`

export const fragmentGlsl = /* glsl */ `
precision highp float;
precision highp sampler3D;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

in vec3 vOrigin;
in vec3 vDirection;

out vec4 color;

uniform sampler3D map;

uniform float threshold;
uniform float steps;

vec2 hitBox( vec3 orig, vec3 dir ) {
    const vec3 box_min = vec3( - 0.5 );
    const vec3 box_max = vec3( 0.5 );
    vec3 inv_dir = 1.0 / dir;
    vec3 tmin_tmp = ( box_min - orig ) * inv_dir;
    vec3 tmax_tmp = ( box_max - orig ) * inv_dir;
    vec3 tmin = min( tmin_tmp, tmax_tmp );
    vec3 tmax = max( tmin_tmp, tmax_tmp );
    float t0 = max( tmin.x, max( tmin.y, tmin.z ) );
    float t1 = min( tmax.x, min( tmax.y, tmax.z ) );
    return vec2( t0, t1 );
}

float sample1( vec3 p ) {
    return texture( map, p ).r;
}

vec4 sampleRGBA( vec3 p ) {
    return texture( map, p );
}

#define epsilon .0001

vec3 normal( vec3 coord ) {
    if ( coord.x < epsilon ) return vec3( 1.0, 0.0, 0.0 );
    if ( coord.y < epsilon ) return vec3( 0.0, 1.0, 0.0 );
    if ( coord.z < epsilon ) return vec3( 0.0, 0.0, 1.0 );
    if ( coord.x > 1.0 - epsilon ) return vec3( - 1.0, 0.0, 0.0 );
    if ( coord.y > 1.0 - epsilon ) return vec3( 0.0, - 1.0, 0.0 );
    if ( coord.z > 1.0 - epsilon ) return vec3( 0.0, 0.0, - 1.0 );

    float step = 0.01;
    float x = sample1( coord + vec3( - step, 0.0, 0.0 ) ) - sample1( coord + vec3( step, 0.0, 0.0 ) );
    float y = sample1( coord + vec3( 0.0, - step, 0.0 ) ) - sample1( coord + vec3( 0.0, step, 0.0 ) );
    float z = sample1( coord + vec3( 0.0, 0.0, - step ) ) - sample1( coord + vec3( 0.0, 0.0, step ) );

    return normalize( vec3( x, y, z ) );
}

void main() {
    vec3 rayDir = normalize( vDirection );
    vec2 bounds = hitBox( vOrigin, rayDir );

    if ( bounds.x > bounds.y ) discard;
    bounds.x = max( bounds.x, 0.0 );

    vec3 p = vOrigin + bounds.x * rayDir;
    vec3 inc = 1.0 / abs( rayDir );
    float delta = min( inc.x, min( inc.y, inc.z ) );
    delta /= steps;

    for ( float t = bounds.x; t < bounds.y; t += delta ) {
        vec4 colorSampled = sampleRGBA( p + 0.5 );

        // Only render red channel and set alpha to match red
        color = vec4(colorSampled.g, colorSampled.g, colorSampled.g, colorSampled.g);

        if ( color.r > threshold ) {
            break;
        }
        p += rayDir * delta;
    }
    if ( color.g == 0.0 ) discard;
}`

export const addDiffusionSource = `
precision highp float;
precision highp sampler3D;

in vec2 vUv2;

out vec4 outColor[gl_MaxDrawBuffers];

uniform sampler3D map;
uniform float startZ;
uniform vec3 resolution;

uniform vec3 center;
uniform float sourceSize;

vec4 addSource(vec3 p) {
    vec3 d = p - center;
    float intencity = 0.5 * exp(-dot(d, d) / sourceSize);

    vec2 s = texture(map, p).xy;
    s.x = max(0.0, s.x - intencity);
    s.y = min(1.0, s.y + intencity);

    return vec4(s, 0.0, 1.0);
}

void main() {
    vec4 color[gl_MaxDrawBuffers];

    for (int i = 0; i < gl_MaxDrawBuffers; i++) {
        color[i] = addSource(vec3(vUv2, (startZ + float(i) + 0.5) / resolution.z));
    }

    outColor = color;
}`

export const RDFragment = `
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

vec4 calcSource(vec3 p) {
    vec3 pix = 1.0 / resolution;

    vec2 s0 = texture(map, p).xy;
    vec2 s1 = texture(map, p + vec3(pix.x, 0.0, 0.0)).xy;
    vec2 s2 = texture(map, p - vec3(pix.x, 0.0, 0.0)).xy;
    vec2 s3 = texture(map, p + vec3(0.0, pix.y, 0.0)).xy;
    vec2 s4 = texture(map, p - vec3(0.0, pix.y, 0.0)).xy;
    vec2 s5 = texture(map, p + vec3(0.0, 0.0, pix.z)).xy;
    vec2 s6 = texture(map, p - vec3(0.0, 0.0, pix.z)).xy;
    
    vec2 lap = (s1 + s2 + s3 + s4 + s5 + s6 - 6.0 * s0) / 2.0 * 2.0;

    vec2 s;
    s.x = max(0.0, min(1.0, s0.x + D.x * lap.x - s0.x * s0.y * s0.y + f * (1.0 - s0.x)));
    s.y = max(0.0, min(1.0, s0.y + D.y * lap.y + s0.x * s0.y * s0.y - (f + k) * s0.y));

    return vec4(s, 0.0, 1.0);
}

void main() {
    vec4 color[gl_MaxDrawBuffers];

    for (int i = 0; i < gl_MaxDrawBuffers; i++) {
        color[i] = calcSource(vec3(vUv2, (startZ + float(i) + 0.5) / resolution.z));
    }

    outColor = color;
}`

export const RDVertex = `
in vec3 position;
in vec2 uv2;

out vec2 vUv2;

void main() {
    gl_Position = vec4(position, 1.0);

    vUv2 = uv2;
}`

export const ColorVertex = `
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
}`

export const ColorFragment = `
precision highp float;
precision highp sampler3D;

in vec3 vPos;
in vec3 vCameraPos;
in mat3 vNMatrix;

uniform sampler3D map;
uniform vec3 size;
uniform float raySteps;

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
                outColor = vec4(getNormal(texCoord), 1.0);
                break;
            }
        }
    }
}`
