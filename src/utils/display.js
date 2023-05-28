"use strict"

import vertexShader from "../shaders/camera.vert"
import raycastShader from "../shaders/raycast.frag"
import { Box, Camera, Shader } from "./webgl"

const ROTATION_FACTOR = 0.8
const INITIAL_POSITION = 3
const INITIAL_RADIUS = 2
const RAY_STEPS = 200.0
const BLACK = [0.0, 0.0, 0.0, 1.0]

const shaderUniforms = {
  modelMatrix: "mat4",
  viewMatrix: "mat4",
  projectionMatrix: "mat4",
  map: "sampler3D",
  size: "vec3",
  raySteps: "float",
  hasColor: "int",
}

export class Display {
  constructor(renderer, width, height) {
    this.renderer = renderer
    this.size = { width, height }
    this.displayCube = new Box(renderer)
    this.shader = new Shader(renderer, vertexShader, raycastShader)
    this.camera = new Camera()
    this.rotation = { dtheta: 0, dphi: 0, decay: ROTATION_FACTOR }
    this.raySteps = RAY_STEPS

    this.shader.createAttributes({ position: INITIAL_POSITION })
    this.shader.createUniforms(shaderUniforms)

    this.camera.setRadius(INITIAL_RADIUS)
    this.camera.perspective(Math.PI / 4, width / height, 0.001, 20)
  }

  updateCamera() {
    this.camera.rotate(this.rotation.dtheta, this.rotation.dphi)
    this.rotation.dtheta *= this.rotation.decay
    this.rotation.dphi *= this.rotation.decay
  }

  resize(width, height) {
    this.size = { width, height }
    this.camera.perspective(Math.PI / 4, width / height, 0.001, 20)
  }

  zoom(dz) {
    const newRadius = dz * this.camera.getRadius()
    this.camera.setRadius(newRadius)
  }

  setTexture(texture) {
    this.texture = texture
  }

  render(hasColor) {
    this.renderer.resize(this.size.width, this.size.height)
    this.renderer.set(
      this.displayCube,
      this.shader,
      { map: this.texture, size: [1, 1, 1], raySteps: this.raySteps, hasColor: hasColor ? 1 : 0 },
      this.camera,
      true
    )
    this.renderer.render({ clearColor: BLACK, clearDepth: 1.0 })
  }
}
