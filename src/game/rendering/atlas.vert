#version 300 es
precision highp float;

// Static
in vec2 aPosition;

// Instance
in vec2 aTexCoord;
in vec2 aTranslate;
in vec2 aScale;
in float aRotation;
in float aOpacity;


uniform vec2 uResolution;
uniform sampler2D uSampler;

out vec2 vTexCoord;
out float vOpacity;

void main() {
  float s = sin(aRotation);
  float c = cos(aRotation);
  vec2 rotated = vec2(
    aPosition.x * c - aPosition.y * s + aTranslate.x,
    aPosition.x * s + aPosition.y * c + aTranslate.y
  );

  // move to clip space
  vec2 clip = (rotated / uResolution) * 2.0 - 1.0;
  clip.y = -clip.y;

  vTexCoord = aTexCoord;
  vOpacity = aOpacity;
  gl_Position = vec4(clip, 0.0, 1.0);
}
