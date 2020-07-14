// 资源类型，顶点，顶点索引，统一变量，纹理，离屏目标
export const ResourceTypes = {
  VertexBuffers: 'VertexBuffers',
  IndexBuffer: 'IndexBuffer',
  Uniforms: 'Uniforms',
  Textures: 'Textures',
  OffscreenTarget: 'OffscreenTarget'
}

// 模式类型， 
export const SchemaTypes = {
  vec4: 'vec4',
  vec3: 'vec3',
  vec2: 'vec2',
  int: 'int',
  float: 'float',
  mat4: 'mat4',
  mat3: 'mat3',
  mat2: 'mat2',
  tex2D: 'tex2D',
  texCube: 'texCube'
}

export const GLTypes = {
  Triangles: 'Triangles',
  Lines: 'Lines',
  Repeat: 'Repeat',
  MirroredRepeat: 'MirroredRepeat',
  ClampToEdge: 'ClampToEdge',
  Nearest: 'Nearest',
  Linear: 'Linear',
  NearestMipmapNearest: 'NearestMipmapNearest',
  LinearMipmapNearest: 'LinearMipmapNearest',
  NearestMipmapLinear: 'NearestMipmapLinear',
  LinearMipmapLinear: 'LinearMipmapLinear',
  RGB: 'RGB',
  RGBA: 'RGBA',
  SRGB: 'SRGB'
}

// 渲染配置，默认启用的扩展
export const RendererConfig = {
  contextAttributes: {},
  extensions: ['OES_element_index_uint', 'WEBGL_depth_texture']
}
