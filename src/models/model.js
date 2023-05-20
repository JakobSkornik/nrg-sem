"use strict"

import sourceShader from "../shaders/source.frag"
import { Framebuffer, Plane, Shader } from "../utils"

const CLEAR_COLOR = [1.0, 0.0, 0.0, 0.0]

const sourceUniforms = {
  startZ: "float",
  resolution: "vec3",
  map: "sampler3D",
  center: "vec3",
  sourceSize: "float",
}

export class ReactionDiffusionModel {
  constructor(renderer, size, vertexShader, simulateShader, uniforms) {
    this.renderer = renderer
    this.size = size

    this.source = new Framebuffer(
      this.renderer,
      this.size.width,
      this.size.height,
      this.size.depth,
      true,
      CLEAR_COLOR
    )
    this.plane = new Plane(this.renderer, 2, 2)

    this.shader = new Shader(this.renderer, vertexShader, simulateShader)
    this.shader.createAttributes({ position: 3, uv2: 2 })
    this.shader.createUniforms(uniforms)

    this.sourceShader = new Shader(this.renderer, vertexShader, sourceShader)
    this.sourceShader.createAttributes({ position: 3, uv2: 2 })
    this.sourceShader.createUniforms(sourceUniforms)
  }

  resize(size) {
    this.size = size
    this.source.resize(size.width, size.height)
  }

  reset() {
    this.source.clearColor(CLEAR_COLOR)
    this._addSource()
  }

  step() {
    console.log("Step not implemented...")
  }

  setGravityForce(val) {
    this.param.G = val * this.param.G_factor
  }

  _addSource() {
    for (let i = 0; i < this.param.sources; i++) {
      this.renderer.set(this.plane, this.sourceShader, {
        map: this.source.texture,
        center: [Math.random(), Math.random(), Math.random()],
        sourceSize: this.param.sourceSize,
      })
      this.source.render()
    }
  }
}
