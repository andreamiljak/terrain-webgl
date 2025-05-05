#include ../includes/getElevation.glsl

attribute vec3 aInstanceOffset;
attribute float aRotation;
attribute float aScale;

mat2 get2DRotationMatrix(float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return mat2(c, -s, s, c);
}
void main() 
{
    vec3 pos = position;

    //rotate
    pos.xz = get2DRotationMatrix(aRotation) * pos.xz;
    //scale
    pos *= aScale;

    pos.xz += aInstanceOffset.xz;
    
    float elevation = getElevation(aInstanceOffset.xz);
    
    pos.y += elevation;

    // Apply transforms
    vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
