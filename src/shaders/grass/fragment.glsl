varying float vHeight;

uniform vec3 uBottomColor;
uniform vec3 uTopColor;

void main() {
    float t = clamp(vHeight / 0.5, 0.0, 1.0);
    vec3 color = mix(uBottomColor, uTopColor, t);
    gl_FragColor = vec4(color, 1.0);   //0.475, 0.902, 0.208
}
