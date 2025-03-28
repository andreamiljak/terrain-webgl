#include "../includes/simplexNoise2d.glsl"

uniform float uTime;
uniform float uFrequency;

float getElevation(vec2 position)
{
    position.x += uTime * 0.2;
    float elevation = 0.0;
    elevation += simplexNoise2d(position * uFrequency      ) / 2.0;
    elevation += simplexNoise2d(position * uFrequency * 2.0) / 4.0;
    elevation += simplexNoise2d(position * uFrequency * 4.0) / 8.0;

    return elevation;
}
