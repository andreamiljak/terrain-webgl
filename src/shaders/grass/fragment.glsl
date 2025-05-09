varying float vHeight;
varying float vAlpha;

uniform vec3 uBottomColor;
uniform vec3 uTopColor;

void main() {
    float t = clamp(vHeight / 0.5, 0.0, 1.0);
    float fade = smoothstep(0.0, 0.15, vHeight);
    float finalAlpha = vAlpha * fade;
    vec3 color = mix(uBottomColor, uTopColor, t);
    gl_FragColor = vec4(color, finalAlpha);   //0.475, 0.902, 0.208
}
