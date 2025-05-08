#include ../includes/getElevation.glsl

attribute vec3 aInstanceOffset;
attribute float aScale;
varying float vHeight;
uniform vec3 uCameraPosition;


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
    pos *= aScale;

    pos.xz += aInstanceOffset.xz;
    
    pos.y += elevation;

    // Apply transforms
    vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
