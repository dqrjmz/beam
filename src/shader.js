import { GLTypes } from './consts.js'
import * as glUtils from './utils/gl-utils.js'

export class Shader {

  /**
   * 
   * @param {*} beam beam 
   * @param {*} shaderTemplate 着色器模板
   */
  constructor (beam, shaderTemplate) {
    this.beam = beam

    const {
      // 缓冲区
      buffers = {},
      // 统一变量
      uniforms = {},
      // 纹理
      textures = {},
      // 模型
      mode = GLTypes.Triangles
    } = shaderTemplate

    // 模式
    this.schema = { buffers, uniforms, textures, mode }
    // 字符串的着色器程序
    const { vs, fs, defines = {} } = shaderTemplate
    this.shaderRefs = glUtils.initShaderRefs(
      beam.gl, defines, this.schema, vs, fs
    )
  }

  set ({ vs, fs, defines }) {

  }
}
