import fragSource from './image.frag?raw'
import vertSource from './image.vert?raw'
import { gl, canvas, compileGLShader, GLRenderer } from './webgl' // adjust import paths

export const imageVert = compileGLShader(vertSource, gl.VERTEX_SHADER)
export const imageFrag = compileGLShader(fragSource, gl.FRAGMENT_SHADER)

export const imageRenderer = new GLRenderer(
  imageVert,
  imageFrag,
  {
    aPosition: 2,
    aTexCoord: 2,
  },
  {
    aTranslate: 2,
    aScale: 2,
    aRotation: 1,
    aOpacity: 1,
  } as const,
  ['uResolution', 'uSampler'],
  new Float32Array([
    // eslint-disable-next-line prettier/prettier
    -0.5, -0.5, 0, 1,// 1
    // eslint-disable-next-line prettier/prettier
    0.5, -0.5,  1, 1,// 2
    // eslint-disable-next-line prettier/prettier
    -0.5, 0.5, 0, 0, // 3
    // eslint-disable-next-line prettier/prettier
    -0.5, 0.5, 0, 0, // 4
    // eslint-disable-next-line prettier/prettier
    0.5, -0.5, 1, 1, // 5
    // eslint-disable-next-line prettier/prettier
    0.5, 0.5, 1, 0 // 6
  ]),
  (l) => {
    gl.uniform2f(l.get('uResolution')!, canvas.width, canvas.height)
  },
)
