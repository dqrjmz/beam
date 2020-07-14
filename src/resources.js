import { ResourceTypes } from './consts.js'
import * as glUtils from './utils/gl-utils.js'

/**
 * 创建资源，缓冲区
 * @param {*} gl webgl渲染上下文
 * @param {*} type 资源类型
 * @param {*} state 资源数据
 */
export const createResource = (gl, type, state) => {
  const Types = ResourceTypes
  class Resource {
    constructor () { this.state = state; this.type = type }
    set (key, val) { this.state[key] = val; return this }
  }

  // 顶点缓冲区资源
  class VertexBuffersResource extends Resource {
    // 初始化顶点缓冲区
    constructor () {
      super()
      this.buffers = glUtils.initVertexBuffers(gl, state)
    }

    /**
     * 设置新的值给缓冲区
     * @param {*} key glsl es中的一个变量
     * @param {*} val 变量的值
     */
    set (key, val) {
      this.state[key] = val
      glUtils.updateVertexBuffer(gl, this.buffers[key], val)
      return this
    }

    // 销毁指定的缓冲区
    destroy (key) {
      glUtils.destroyVertexBuffer(gl, this.buffers[key])
      delete this.state[key]
    }
  }

  class IndexBufferResource extends Resource {
    constructor () {
      super()
      const { offset = 0, count = state.array.length } = state
      this.state.offset = offset
      this.state.count = count
      this.buffer = glUtils.initIndexBuffer(gl, state)
    }

    set (state) {
      const { offset = 0, count = state.array.length } = state
      this.state.offset = offset
      this.state.count = count
      glUtils.updateIndexBuffer(gl, this.buffer, state.array)
      return this
    }

    destroy () {
      glUtils.destroyIndexBuffer(gl, this.buffer)
      delete this.state
    }
  }

  class UniformsResource extends Resource {}

  class TexturesResource extends Resource {
    constructor () {
      super()
      this.textures = glUtils.initTextures(gl, state)
    }

    set (key, val) {
      const { textures, state } = this

      const oldVal = state[key]
      let texture
      // workaround OffscreenTarget
      if (val.constructor.name !== 'Object') {
        const offscreenTarget = val
        texture = offscreenTarget.state.depth
          ? offscreenTarget.depthTexture
          : offscreenTarget.colorTexture
      } else if (oldVal) {
        const newVal = { ...val, flip: oldVal.flip, space: oldVal.space }
        // TODO ensure same target
        if (oldVal.image) {
          texture = glUtils.update2DTexture(gl, textures[key], newVal)
        } else {
          texture = glUtils.updateCubeTexture(gl, textures[key], newVal)
        }
      } else {
        // init texture if state[key] does not exist
        texture = val.image
          ? glUtils.init2DTexture(gl, val)
          : glUtils.initCubeTexture(gl, val)
      }
      textures[key] = texture
      state[key] = { ...state[key], ...val }
      return this
    }

    destroy (key) {
      glUtils.destroyTexture(gl, this.textures[key])
      delete this.state[key]
    }
  }

  class OffscreenTargetResource extends Resource {
    constructor () {
      super()
      const { size = 2048 } = this.state
      this.state.size = size
      const {
        fbo, rbo, colorTexture, depthTexture
      } = glUtils.initOffscreen(gl, state)
      this.fbo = fbo
      this.rbo = rbo
      this.colorTexture = colorTexture
      this.depthTexture = depthTexture
    }
  }

  const resourceCreatorMap = {
    [Types.VertexBuffers]: () => new VertexBuffersResource(),
    [Types.IndexBuffer]: () => new IndexBufferResource(),
    [Types.Uniforms]: () => new UniformsResource(),
    [Types.Textures]: () => new TexturesResource(),
    [Types.OffscreenTarget]: () => new OffscreenTargetResource()
  }
  return resourceCreatorMap[type]()
}
