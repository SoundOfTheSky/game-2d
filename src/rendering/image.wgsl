struct Globals {
  camera: vec2f;        // ##-- camera
  time: u32;            // __#- milliseconds
  zoom: f32;            // ___# zoom (1 is normal)
  // pad 0
};

struct Instance {
  position: vec2f;              // ##-- world position, scale
  scale: vec2f;                 // __## pixel scale
  uvOffset: vec4f;              // ##-- atlas UV top-left
  uvSize: vec4f;                // __## atlas UV size
  color: vec4f;                 // #### tint + opacity
  pivot: vec2f;                 // ## -- pivot in local quad space (0–1)
  rotation: f32;                // __#- radians
  z: f32;                       // ___# depth ordering
  // pad 0
};

@group(0) @binding(0) var<uniform> globals: Globals;

@group(1) @binding(0) var texture: texture_2d<f32>;
@group(1) @binding(1) var sampler: sampler;

@group(2) @binding(0) var<storage, read> instances: array<Instance>;


struct VSIn {
  @location(0) pos: vec2f;
  @builtin(instance_index) instance: u32;
};

struct VSOut {
  @builtin(position) position: vec4f;
  @location(0) uv: vec2f;
  @location(1) color: vec4f;
};

@vertex
fn vs(input: VSIn) -> VSOut {
  let instance = instances[input.instance];

  // Convert pivot to local space
  let pivotLocal = instance.pivot * instance.scale;

  // Pivot-relative local space position
  let p = input.pos * instance.scale - pivotLocal;

  // Rotation
  let s = sin(instance.rotation);
  let c = cos(instance.rotation);

  let rotated = vec2f(
    p.x * c - p.y * s,
    p.x * s + p.y * c
  );

  var out: VSOut;

  // Back from pivot + world translation
  out.position = globals.viewProj * vec4f(rotated + pivotLocal + instance.position, instance.z, 1.0);

  // Atlas UV
  out.uv = instance.uvOffset + input.pos * instance.uvSize;
  out.color = instance.color;

  return out;
}

@fragment
fn fs(input: VSOut) -> @location(0) vec4f {
  return textureSample(uTexture, uSampler, input.uv) * input.color;
}

