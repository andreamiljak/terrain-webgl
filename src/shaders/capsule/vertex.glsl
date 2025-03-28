#include ../includes/getElevation.glsl

void main()
{
   
    vec4 bottomCenter = modelMatrix * vec4(0.0, -0.15, 0.0, 1.0); // Reference point

    float elevation = getElevation(bottomCenter.xz);

    float heightOffset = elevation - bottomCenter.y;
   
    vec4 worldPosition = modelMatrix * vec4(position, 1.0); // Preserve shape

    worldPosition.y += heightOffset;

    // Final transformation
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
}