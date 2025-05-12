#include ../includes/getElevation.glsl

attribute vec3 aInstanceOffset;
attribute vec3 aLocalOffset;
attribute float aScale;
varying float vHeight;
varying float vAlpha;
uniform vec3 uCameraPosition;
uniform float uGrassRadius;
uniform vec3 uCapsulePosition;
uniform float uWindTime;
uniform sampler2D uTrailHistory;
uniform int uSubdivisions;

float sampleTrailFalloff(vec3 bladePos) {
    float minDist = 1000.0;

    for (int i = 0; i < uSubdivisions; i++) {
        float fi = float(i) / float(uSubdivisions - 1);
        vec4 trail = texture2D(uTrailHistory, vec2(fi, 0.5));

        if (trail.a < 0.5) continue; 

        float dist = distance(bladePos.xz, trail.xz);
        minDist = min(minDist, dist);
    }

    return smoothstep(0.0, 0.3, minDist);
}
void main() 
{
    vHeight = position.y;
    vec3 pos = position;

    vec3 worldOffset = aInstanceOffset + aLocalOffset;
    float elevation = getElevation(worldOffset.xz);
    vec3 bladeWorldPos = vec3(worldOffset.x, elevation, worldOffset.z);

    vec3 toCamera = uCameraPosition - bladeWorldPos;
    toCamera.y = 0.0;
    toCamera = normalize(toCamera);

    mat2 faceCamRotation = mat2(toCamera.z, -toCamera.x, toCamera.x, toCamera.z);
    pos.xz = faceCamRotation * pos.xz;

    //scale
    float dist = length(bladeWorldPos.xz - uCapsulePosition.xz);
    float t = smoothstep(uGrassRadius, 0.0, dist);
    float scaleFactor = mix(0.3, 1.0, t);
    pos *= aScale * scaleFactor;

    //transparency
    
    vAlpha = mix(0.0, 1.0, t);  
    
    float falloff = sampleTrailFalloff(bladeWorldPos);
    pos.y *= falloff;
    pos.y += elevation;
    pos.xz += worldOffset.xz;

    float windStrength = 0.1;
    float windSpeed = 1.0;

    float sway = sin(uWindTime * windSpeed + aLocalOffset.x * 10.0 + aLocalOffset.z * 10.0);
    pos.x += sway * windStrength * ( position.y);
    
    
    // Apply transforms
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(pos, 1.0);
}
