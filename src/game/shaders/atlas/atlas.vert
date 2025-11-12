#version 300 es
precision highp float;

// Static
in vec2 aPosition;
in vec2 aTexCoord;

// Instance
in vec2 aTranslate;
in vec2 aScale;
in vec2 aOffset;
in vec2 aSize;
in float aRotation;
in float aOpacity;


uniform vec2 uResolution;
uniform vec2 uAtlasSize;
uniform sampler2D uSampler;

out vec2 vTexCoord;
out float vOpacity;

void main() {
  vec2 local = aPosition * aSize * aScale;

  // rotate
  float s = sin(aRotation);
  float c = cos(aRotation);
  vec2 rotated = vec2(
    local.x * c - local.y * s,
    local.x * s + local.y * c
  );

  // move to clip space
  vec2 clip = ((aTranslate + rotated) / uResolution) * 2.0 - 1.0;
  clip.y = -clip.y;

  vTexCoord = (aTexCoord * aSize + aOffset) / uAtlasSize;
  vOpacity = aOpacity;
  gl_Position = vec4(clip, 0.0, 1.0);
}
