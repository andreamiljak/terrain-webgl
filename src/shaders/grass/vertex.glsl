#include ../includes/getElevation.glsl

attribute vec3 aInstanceOffset;
attribute vec3 aLocalOffset;
attribute float aScale;
varying float vHeight;
varying float vAlpha;
uniform vec3 uCameraPosition;
uniform float uGrassRadius;
uniform vec3 uCapsulePosition;


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
    
    
    pos.y += elevation;
    pos.xz += worldOffset.xz;

    // Apply transforms
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(pos, 1.0);
}
