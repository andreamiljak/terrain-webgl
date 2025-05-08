#include ../includes/getElevation.glsl

attribute vec3 aInstanceOffset;
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

    float elevation = getElevation(aInstanceOffset.xz);
    vec3 bladeWorldPos = vec3(aInstanceOffset.x, elevation, aInstanceOffset.z);

    vec3 toCamera = normalize(uCameraPosition -bladeWorldPos);
    toCamera.y = 0.0;
    toCamera = normalize(toCamera);

    mat2 faceCamRotation = mat2(toCamera.z, -toCamera.x, toCamera.x, toCamera.z);
    pos.xz = faceCamRotation * pos.xz;

    //scale
    float dist = length(bladeWorldPos.xz - uCapsulePosition.xz);
    float scaleFactor = mix(0.3, 1.0, smoothstep(uGrassRadius, 0.0, dist));
    pos *= aScale * scaleFactor;

    //transparency
    float t = smoothstep(uGrassRadius, 0.0, dist);
    vAlpha = mix(0.0, 1.0, t);  
    
    pos.xz += aInstanceOffset.xz;
    
    pos.y += elevation;

    // Apply transforms
    vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
