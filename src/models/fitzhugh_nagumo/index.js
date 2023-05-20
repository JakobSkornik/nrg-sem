"use strict"

import simulateShader from "./fitzhugh_nagumo.frag"
import vertexShader from "../../shaders/vertex.vert"
import sourceShader from "../../shaders/source.frag"
import { Framebuffer, Plane, Shader } from "../../utils"

const INITIAL_SOURCES_NUM = 5
const INITIAL_REACTION_RATE = 0.24
const INITIAL_DIFFUSION_RATE = 0.168
const INITIAL_EPSILON = 0.63
const INITIAL_A = 0.54
const INITIAL_B = 0.0
const INITIAL_WIND_FACTOR = 0.0
const INITIAL_WIND_DIRECTION = [0.7, 0.3, -0.5]
const INITIAL_GRAVITY = 0.0
const INITIAL_GRAVITY_FACTOR = 0.0001
const INITIAL_GRAVITY_POS = [0.0, -1.0, 0.0]
const SOURCE_SIZE = 0.001
const CLEAR_COLOR = [1.0, 0.0, 0.0, 0.0]

const fitzhughNagumoUniforms = {
  startZ: "float",
  resolution: "vec3",
  map: "sampler3D",
  epsilon: "float",
  D: "vec2",
  a: "float",
  b: "float",
  w: "float",
  windDirection: "vec3",
  G: "float",
  G_factor: "float",
  G_pos: "vec3",
}

const sourceUniforms = {
  startZ: "float",
  resolution: "vec3",
  map: "sampler3D",
  center: "vec3",
  sourceSize: "float",
}

export class FitzHughNagumo3D {
  constructor(renderer, size) {
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
    this.shader.createUniforms(fitzhughNagumoUniforms)

    this.sourceShader = new Shader(this.renderer, vertexShader, sourceShader)
    this.sourceShader.createAttributes({ position: 3, uv2: 2 })
    this.sourceShader.createUniforms(sourceUniforms)

    this.param = {
      epsilon: INITIAL_EPSILON,
      r_u: INITIAL_REACTION_RATE,
      r_v: INITIAL_DIFFUSION_RATE,
      a: INITIAL_A,
      b: INITIAL_B,
      w: INITIAL_WIND_FACTOR,
      windDirection: INITIAL_WIND_DIRECTION,
      G: INITIAL_GRAVITY,
      G_factor: INITIAL_GRAVITY_FACTOR,
      G_pos: INITIAL_GRAVITY_POS,
      sources: INITIAL_SOURCES_NUM,
      speed: 1,
      sourceSize: SOURCE_SIZE,
      reset: () => this.reset(),
    }
    this.reset()
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
    for (let i = 0; i < this.param.speed; i++) {
      this.renderer.set(this.plane, this.shader, {
        map: this.source.texture,
        epsilon: this.param.epsilon,
        D: [this.param.r_u, this.param.r_v],
        a: this.param.a,
        b: this.param.b,
        w: this.param.w,
        windDirection: this.param.windDirection,
        G: this.param.G,
        G_factor: this.param.G_factor,
        G_pos: this.param.G_pos,
      })
      this.source.render()
    }
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
