uniform vec3 uPlane;

void main()
{
    vec3 terrainColor = uPlane;
    csm_DiffuseColor = vec4(terrainColor, 1.0);
}