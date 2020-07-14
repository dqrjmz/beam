import { SchemaTypes, GLTypes as GL } from '../consts.js'
import * as miscUtils from './misc-utils.js'

const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)

/**
 * 获取webgl渲染上下文实例
 * @param {*} canvas dom元素
 * @param {*} contextAttributes 上下文属性
 */
export const getWebGLInstance = (canvas, contextAttributes) => {
  return canvas.getContext('webgl', contextAttributes)
}

export const getExtensions = (gl, config) => {
  const extensions = {}
  config.extensions.forEach(name => {
    // 获取配置的扩展名的扩展对象，启用一个webgl拓展
    extensions[name] = gl.getExtension(name)
  })
  return extensions
}

/**
 * 编译着色器
 * @param {*} gl webgl渲染上下文
 * @param {*} type 着色器类型（顶点，片元
 * @param {*} source 着色器字符串程序
 */
const compileShader = (gl, type, source) => {
  // 创建着色器对象
  const shader = gl.createShader(type)
  // glsl字符串代码
  gl.shaderSource(shader, source)
  // 编译着色器程序，使其成为二进制数据，然后就可以被WebGLProgram对象使用
  gl.compileShader(shader)
  // 获取着色器程序被编译的状态
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    // 获取着色器编译失败的日志
    console.error('Error compiling shaders', gl.getShaderInfoLog(shader))
    // 删除着色器程序
    gl.deleteShader(shader)
    return null
  }
  return shader
}

/**
 * 初始化着色器程序
 * @param {*} gl webgl渲染上下文
 * @param {*} defines glsl es 语言中的宏命令
 * @param {*} vs 顶点着色器字符串程序
 * @param {*} fs 片元着色器字符串程序
 */
const initShaderProgram = (gl, defines, vs, fs) => {
  // 遍历宏命令，添加到着色器程序中
  const defineStr = Object.keys(defines).reduce((str, key) => (
    defines[key] ? str + `#define ${key} ${defines[key]}\n` : ''
  ), '')
  // 编译顶点着色器
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, defineStr + vs)
  // 编译片元着色器
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, defineStr + fs)
  // 创建着色器程序
  const shaderProgram = gl.createProgram()
  // 向着色器程序添加 【顶点/片元】着色器
  gl.attachShader(shaderProgram, vertexShader)
  gl.attachShader(shaderProgram, fragmentShader)
  // 连接给定的着色器程序，从而完成为 
  // 程序的片元和顶点着色器准备gpu代码的过程
  gl.linkProgram(shaderProgram)
  // 返回WebGLProgram的信息
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    console.error('Error initing program', gl.getProgramInfoLog(shaderProgram))
    return null
  }
  // 着色器程序
  return shaderProgram
}

/**
 * 初始化着色器引用
 * @param {*} gl webgl渲染上下文
 * @param {*} defines glsl es中的宏命令
 * @param {*} schema 
 * @param {*} vs 
 * @param {*} fs 
 */
export const initShaderRefs = (gl, defines, schema, vs, fs) => {
  // 着色器程序
  const program = initShaderProgram(gl, defines, vs, fs)
  // map to { pos: { type, location } }
  // 着色器中attribute属性变量
  const attributes = miscUtils.mapValue(schema.buffers, (attributes, key) => ({
    type: attributes[key].type,
    location: gl.getAttribLocation(program, key)
  }))
  // 着色器中的uniform变量集合
  const uniforms = miscUtils.mapValue({
    ...schema.uniforms, ...schema.textures
  }, (uniforms, key) => ({
    type: uniforms[key].type,
    location: gl.getUniformLocation(program, key)
  }))
  // 着色器程序 属性的存储地址
  return { program, attributes, uniforms }
}

/**
 * 清空
 * @param {*} gl 
 * @param {*} color 
 */
export const clear = (gl, color) => {
  const [r, g, b, a] = color
  // 设置webgl系统的视口大小
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
  // 设置canvas的背景色
  gl.clearColor(r, g, b, a)
  // 清除深度
  gl.clearDepth(1)
  // 清除颜色缓冲区，深入缓冲区
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
  // 开启隐藏面消除
  gl.enable(gl.DEPTH_TEST)
}

// 初始化顶点缓冲区
export const initVertexBuffers = (gl, state) => {
  // 缓冲区对象容器
  const buffers = {}
  // 获取状态对象的key
  const bufferKeys = Object.keys(state)
  bufferKeys.forEach(key => {
    // 创建一个缓冲区对象
    const buffer = gl.createBuffer()
    // 将缓冲区对象添加给对应的key
    buffers[key] = buffer
    updateVertexBuffer(gl, buffers[key], state[key])
  })
  return buffers
}

/**
 * 更新顶点缓冲区
 * @param {*} gl 
 * @param {*} buffer 缓冲对象
 * @param {*} array 新数据
 */
export const updateVertexBuffer = (gl, buffer, array) => {
  const data = array instanceof Float32Array
    ? array : new Float32Array(array)
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  // 新数据绑定到缓冲区对象上
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
}

// 销毁缓冲区对象
export const destroyVertexBuffer = (gl, buffer) => {
  gl.deleteBuffer(buffer)
}

export const initIndexBuffer = (gl, state) => {
  const { array } = state
  const buffer = gl.createBuffer()
  updateIndexBuffer(gl, buffer, array)
  return buffer
}

export const updateIndexBuffer = (gl, buffer, array) => {
  const data = array instanceof Uint32Array
    ? array : new Uint32Array(array)
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW)
}

export const destroyIndexBuffer = (gl, buffer) => {
  gl.deleteBuffer(buffer)
}

const compatSRGB = gl => {
  const { extensions } = gl
  return !isSafari && extensions.EXT_SRGB
    ? extensions.EXT_SRGB.SRGB_EXT
    : gl.RGBA
}

const compatSRGBA = gl => {
  const { extensions } = gl
  return !isSafari && extensions.EXT_SRGB
    ? extensions.EXT_SRGB.SRGB_ALPHA_EXT
    : gl.RGBA
}

// Hard coded for faster lookup
const nativeTypeHOF = gl => type => {
  const map = {
    [GL.Repeat]: gl.REPEAT,
    [GL.MirroredRepeat]: gl.MIRRORED_REPEAT,
    [GL.ClampToEdge]: gl.CLAMP_TO_EDGE,
    [GL.Linear]: gl.LINEAR,
    [GL.Nearest]: gl.NEAREST,
    [GL.NearestMipmapNearest]: gl.NEAREST_MIPMAP_NEAREST,
    [GL.LinearMipmapNearest]: gl.LINEAR_MIPMAP_NEAREST,
    [GL.NearestMipmapLinear]: gl.NEAREST_MIPMAP_LINEAR,
    [GL.LinearMipmapLinear]: gl.LINEAR_MIPMAP_LINEAR,
    [GL.RGB]: gl.RGB,
    [GL.RGBA]: gl.RGBA,
    [GL.SRGB]: compatSRGB(gl),
    [GL.SRGBA]: compatSRGBA(gl)
  }
  return map[type]
}

export const init2DTexture = (gl, val) => {
  const texture = gl.createTexture()
  update2DTexture(gl, texture, val)
  return texture
}

export const initCubeTexture = (gl, val) => {
  const texture = gl.createTexture()
  updateCubeTexture(gl, texture, val)
  return texture
}

export const initTextures = (gl, state) => {
  const textures = {}
  Object.keys(state).forEach(key => {
    const stateField = state[key]
    stateField.type = stateField.type || SchemaTypes.tex2D

    const texture = stateField.type === SchemaTypes.tex2D
      ? init2DTexture(gl, stateField)
      : initCubeTexture(gl, stateField)
    textures[key] = texture
  })

  return textures
}

const supportMipmap = image => (
  image &&
  miscUtils.isPowerOf2(image.width) &&
  miscUtils.isPowerOf2(image.height) &&
  image.nodeName !== 'VIDEO'
)

export const update2DTexture = (gl, texture, val) => {
  const native = nativeTypeHOF(gl)
  const { image, flip, space } = val
  let { wrapS, wrapT, minFilter, magFilter } = val

  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_2D, texture)

  // Image may not be provided when updating texture params
  if (image) {
    if (flip) gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
    const s = native(space || GL.RGBA)
    gl.texImage2D(gl.TEXTURE_2D, 0, s, s, gl.UNSIGNED_BYTE, image)
    if (supportMipmap(image)) gl.generateMipmap(gl.TEXTURE_2D)

    // Default workaround for non-mipmap 2D image
    if (!supportMipmap(image)) {
      if (!wrapS) wrapS = GL.ClampToEdge
      if (!wrapT) wrapT = GL.ClampToEdge
      if (!minFilter) minFilter = GL.Linear
    }
  }

  // Lazily set texture params
  if (wrapS) gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, native(wrapS))
  if (wrapT) gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, native(wrapT))
  if (minFilter) {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, native(minFilter))
  }
  if (magFilter) {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, native(magFilter))
  }
  return texture
}

export const updateCubeTexture = (gl, texture, val) => {
  const native = nativeTypeHOF(gl)
  const {
    images, level, flip, wrapS, wrapT, minFilter, magFilter, space
  } = val

  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture)

  if (wrapS) {
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, native(wrapS))
  }
  if (wrapT) {
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, native(wrapT))
  }
  if (minFilter) {
    gl.texParameteri(
      gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, native(minFilter)
    )
  }
  if (magFilter) {
    gl.texParameteri(
      gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, native(magFilter)
    )
  }

  // Image may not be provided when updating texture params
  if (images) {
    if (flip) gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
    const faces = [
      gl.TEXTURE_CUBE_MAP_POSITIVE_X,
      gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
      gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
      gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
      gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
      gl.TEXTURE_CUBE_MAP_NEGATIVE_Z
    ]
    let count = 0
    const s = native(space || GL.RGBA)
    for (let i = 0; i < faces.length; i++) {
      for (let j = 0; j <= level; j++) {
        const face = faces[i]
        gl.texImage2D(face, j, s, s, gl.UNSIGNED_BYTE, images[count])
        count++
      }
    }
  }
  return texture
}

export const destroyTexture = (gl, texture) => {
  gl.deleteTexture(texture)
}

const initColorOffscreen = (gl, state) => {
  const fbo = gl.createFramebuffer()
  const rbo = gl.createRenderbuffer()
  const colorTexture = gl.createTexture()
  const depthTexture = null

  const { size } = state
  gl.bindTexture(gl.TEXTURE_2D, colorTexture)
  gl.texImage2D(
    gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, null
  )
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)

  gl.bindRenderbuffer(gl.RENDERBUFFER, rbo)
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, size, size)

  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, colorTexture, 0
  )
  gl.framebufferRenderbuffer(
    gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rbo
  )

  const e = gl.checkFramebufferStatus(gl.FRAMEBUFFER)
  if (gl.FRAMEBUFFER_COMPLETE !== e) {
    console.error('Frame buffer object is incomplete: ' + e.toString())
  }

  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  gl.bindTexture(gl.TEXTURE_2D, null)
  gl.bindRenderbuffer(gl.RENDERBUFFER, null)

  return { fbo, rbo, colorTexture, depthTexture }
}

const initDepthOffscreen = (gl, state) => {
  const { size } = state

  const fbo = gl.createFramebuffer()
  const rbo = null
  const colorTexture = gl.createTexture()
  const depthTexture = gl.createTexture()

  gl.bindTexture(gl.TEXTURE_2D, colorTexture)
  gl.texImage2D(
    gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, null
  )

  gl.bindTexture(gl.TEXTURE_2D, depthTexture)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)

  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.DEPTH_COMPONENT,
    size,
    size,
    0,
    gl.DEPTH_COMPONENT,
    gl.UNSIGNED_SHORT,
    null
  )

  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, colorTexture, 0
  )
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTexture, 0
  )

  const e = gl.checkFramebufferStatus(gl.FRAMEBUFFER)
  if (e !== gl.FRAMEBUFFER_COMPLETE) {
    console.error('framebuffer not complete', e.toString())
  }

  gl.bindTexture(gl.TEXTURE_2D, null)
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  return { fbo, rbo, colorTexture, depthTexture }
}

export const initOffscreen = (gl, state) => {
  if (state.depth) return initDepthOffscreen(gl, state)
  else return initColorOffscreen(gl, state)
}

const padDefault = (schema, key, val) => {
  return val !== undefined ? val : schema.uniforms[key].default
}

let lastProgram = null
export const draw = (
  gl, shader, vertexBuffers, indexResource, uniforms, textures
) => {
  const { schema, shaderRefs } = shader
  const { program } = shaderRefs
  if (!lastProgram || lastProgram !== program) {
    gl.useProgram(program)
    lastProgram = program
  }
  Object.keys(shaderRefs.attributes).forEach(key => {
    if (
      !schema.buffers[key] || schema.buffers[key].type === SchemaTypes.index || !vertexBuffers[key]
    ) return
    const { location } = shaderRefs.attributes[key]
    const { n, type } = schema.buffers[key]
    const numComponents = n || miscUtils.getNumComponents(type)

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffers[key])
    gl.vertexAttribPointer(location, numComponents, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(location)
  })
  const { buffer, state } = indexResource
  const { offset, count } = state
  if (buffer) {
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer)
  }

  let unit = -1
  Object.keys(shaderRefs.uniforms).forEach(key => {
    const { type, location } = shaderRefs.uniforms[key]
    let val
    const isTexure = type === SchemaTypes.tex2D || type === SchemaTypes.texCube
    if (!isTexure) {
      val = padDefault(schema, key, uniforms[key])
    }
    if (!val && !isTexure) return

    const uniformSetterMapping = {
      [SchemaTypes.vec4]: () => gl.uniform4fv(location, val),
      [SchemaTypes.vec3]: () => gl.uniform3fv(location, val),
      [SchemaTypes.vec2]: () => gl.uniform2fv(location, val),
      [SchemaTypes.int]: () => {
        !val || typeof val === 'number' || typeof val === 'string'
          ? gl.uniform1i(location, val)
          : gl.uniform1iv(location, val)
      },
      [SchemaTypes.float]: () => {
        !val || typeof val === 'number' || typeof val === 'string'
          ? gl.uniform1f(location, val)
          : gl.uniform1fv(location, val)
      },
      [SchemaTypes.mat4]: () => gl.uniformMatrix4fv(location, false, val),
      [SchemaTypes.mat3]: () => gl.uniformMatrix3fv(location, false, val),
      [SchemaTypes.mat2]: () => gl.uniformMatrix2fv(location, false, val),
      [SchemaTypes.tex2D]: () => {
        unit++
        const texture = textures[key]
        if (!texture) {
          console.warn(`Missing texture ${key} at unit ${unit}`)
          return
        }
        gl.uniform1i(location, unit)
        gl.activeTexture(gl.TEXTURE0 + unit)
        gl.bindTexture(gl.TEXTURE_2D, texture)
      },
      [SchemaTypes.texCube]: () => {
        unit++
        const texture = textures[key]
        if (!texture) {
          console.warn(`Missing texture ${key} at unit ${unit}`)
          return
        }
        gl.uniform1i(location, unit)
        gl.activeTexture(gl.TEXTURE0 + unit)
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture)
      }
    }
    // FIXME uniform keys padded by default are always re-uploaded.
    if (val !== undefined || isTexure) uniformSetterMapping[type]()
  })

  const drawMode = schema.mode === GL.Triangles ? gl.TRIANGLES : gl.LINES
  gl.drawElements(drawMode, count, gl.UNSIGNED_INT, offset * 4)
}
