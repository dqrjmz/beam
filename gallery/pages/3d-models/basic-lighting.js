/* eslint-env browser */

/**
 * 使用Beam库编写webgl程序
 */
import { Beam, ResourceTypes } from '../../../src/index.js'
import { LambertLighting } from '../../shaders/basic-lighting-shader.js'
import { parseOBJ } from '../../utils/obj-loader.js'
import { createCamera } from '../../utils/camera.js'
import { create, rotate } from '../../utils/mat4.js'
const { VertexBuffers, IndexBuffer, Uniforms } = ResourceTypes

// 获取canvas元素
const canvas = document.querySelector('canvas')
// 将canvas的高度宽度，设置为body的高度，宽度
canvas.height = document.body.offsetHeight
canvas.width = document.body.offsetWidth
// 实例化Beam类
const beam = new Beam(canvas)
// 创建着色器程序
const shader = beam.shader(LambertLighting)
// 创建视图举证
const cameraMats = createCamera({ eye: [0, 6, 6] }, { canvas })
// 创建纹理对象
const matrices = beam.resource(Uniforms, cameraMats)
// 创建灯光
const light = beam.resource(Uniforms)
const modelBuffers = []

const render = () => beam.clear().draw(shader, ...modelBuffers, matrices, light)

fetch('../../assets/models/bunny.obj').then(resp => resp.text()).then(str => {
  const [model] = parseOBJ(str)
  modelBuffers[0] = beam.resource(VertexBuffers, model.vertex)
  modelBuffers[1] = beam.resource(IndexBuffer, model.index)
  render()
})

const $modelX = document.getElementById('model-x')
const $modelY = document.getElementById('model-y')
const $modelZ = document.getElementById('model-z')
  ;[$modelX, $modelY, $modelZ].forEach(input => {
  input.addEventListener('input', () => {
    const [rx, ry, rz] = [$modelX.value, $modelY.value, $modelZ.value]
    const modelMat = create()
    rotate(modelMat, modelMat, rx / 180 * Math.PI, [1, 0, 0])
    rotate(modelMat, modelMat, ry / 180 * Math.PI, [0, 1, 0])
    rotate(modelMat, modelMat, rz / 180 * Math.PI, [0, 0, 1])
    matrices.set('modelMat', modelMat)
    render()
  })
})

const $dirX = document.getElementById('dir-x')
const $dirY = document.getElementById('dir-y')
const $dirZ = document.getElementById('dir-z')
;[$dirX, $dirY, $dirZ].forEach(input => {
  input.addEventListener('input', () => {
    const [dx, dy, dz] = [$dirX.value, $dirY.value, $dirZ.value]
    light.set('dirLight.direction', [dx, dy, dz])
    render()
  })
})

const $dirStrength = document.getElementById('dir-strength')
$dirStrength.addEventListener('input', () => {
  light.set('dirLight.strength', $dirStrength.value)
  render()
})

const $dirColor = document.getElementById('dir-color')
$dirColor.addEventListener('input', () => {
  const hex = $dirColor.value
  const rgb = [
    parseInt(hex.slice(1, 3), 16) / 256,
    parseInt(hex.slice(3, 5), 16) / 256,
    parseInt(hex.slice(5, 7), 16) / 256
  ]
  light.set('dirLight.color', rgb)
  render()
})
