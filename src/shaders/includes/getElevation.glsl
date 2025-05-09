#include "../includes/simplexNoise2d.glsl"

uniform float uTime;
uniform float uFrequency;
uniform float uMoveOffsetX;
uniform float uMoveOffsetZ;
uniform float uZoom;
uniform vec2 uChunkOffset;

float getElevation(vec2 position)
{
    float uStrength = 2.0;
    position += uChunkOffset;

    vec2 offset = vec2(2.0, 0.0); 
    position += offset;

    vec2 zoomedPosition = position * uZoom;

    float elevation = 0.0;
    elevation += simplexNoise2d(zoomedPosition * uFrequency      ) / 2.0;
    elevation += simplexNoise2d(zoomedPosition * uFrequency * 2.0) / 4.0;
    elevation += simplexNoise2d(zoomedPosition * uFrequency * 4.0) / 8.0;

    elevation *= uStrength;
    float elevationSign = sign(elevation);
    elevation = elevationSign * pow(elevation, 2.0);

    return elevation;
}
