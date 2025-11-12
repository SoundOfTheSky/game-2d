#version 300 es
precision highp float;

// Static
in vec2 aPosition;     // quad vertex in unit space centered at origin
in vec2 aTexCoord;     // vertex texcoord

// Instance
in vec2 aTranslate;    // position in pixels
in vec2 aScale;        // 0..1
in float aRotation;    // radians
in float aOpacity;     // 0..1

uniform vec2 uResolution; // canvas resolution in pixels
uniform sampler2D uSampler;

out vec2 vTexCoord;
out float vOpacity;

void main() {
  vec2 naturalSize = vec2(textureSize(uSampler, 0));
  vec2 local = aPosition * naturalSize * aScale;

  // rotate
  float s = sin(aRotation);
  float c = cos(aRotation);
  vec2 rotated = vec2(
    local.x * c - local.y * s,
    local.x * s + local.y * c
  );

  vec2 clip = ((aTranslate + rotated) / uResolution) * 2.0 - 1.0;
  clip.y = -clip.y;

  vTexCoord = aTexCoord;
  vOpacity = aOpacity;
  gl_Position = vec4(clip, 0.0, 1.0);
}