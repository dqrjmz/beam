import { RendererConfig } from './consts.js'
import { Shader } from './shader.js'
import { createResource } from './resources.js'
import * as glUtils from './utils/gl-utils.js'
import * as miscUtils from './utils/misc-utils.js'

export class Beam {
  /**
   * 构造函数
   * @param {*} canvas dom对象
   * @param {*} config 配置参数
   */
  constructor (canvas, config = {}) {
    // 获取webgl的渲染上下文
    this.gl = glUtils.getWebGLInstance(canvas, config.contextAttributes)
    // 配置
    this.config = { ...RendererConfig, ...config }
    //配置webgl系统的扩展程序，开启webgl指定的拓展功能
    this.gl.extensions = glUtils.getExtensions(this.gl, this.config)
  }

  /**
   * 清除webgl系统
   * @param {*} color 
   */
  clear (color = [0, 0, 0, 0]) {
    glUtils.clear(this.gl, color)
    return this
  }
  /**
   * 
   * @param {*} shader 着色器对象
   * @param  {...any} resources 
   */
  draw (shader, ...resources) {
    // 
    const groupedResources = miscUtils.groupResources(resources)
    // 开始绘制，使用指定的做瑟琪
    glUtils.draw(this.gl, shader, ...groupedResources)
    return this
  }

  /**
   * 创建着色器
   * @param {*} shaderTemplate 
   */
  shader (shaderTemplate) {
    const shader = new Shader(this, shaderTemplate)
    return shader
  }

  /**
   * 
   * @param {*} type 
   * @param {*} state 
   */
  resource (type, state = {}) {
    // 创建资源
    return createResource(this.gl, type, state)
  }

  define ({ name, onBefore, onAfter }) {
    this[name] = (arg, modifier = () => {}) => {
      if (onBefore) onBefore(this.gl, arg)
      modifier(arg)
      if (onAfter) onAfter(this.gl, arg)
      return this
    }
  }
}
