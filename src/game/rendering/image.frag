#version 300 es
precision highp float;

in vec2 vTexCoord;
in float vOpacity;

uniform sampler2D uSampler;

out vec4 fragColor;

void main() {
  vec4 color = texture(uSampler, vTexCoord);
  color.a *= vOpacity;
  fragColor = color;
}