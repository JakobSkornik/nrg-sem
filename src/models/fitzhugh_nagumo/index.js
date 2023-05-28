"use strict"

import simulateShader from "./fitzhugh_nagumo.frag"
import vertexShader from "../../shaders/position.vert"
import { ReactionDiffusionModel } from "../model"

const INITIAL_SOURCES_NUM = 1
const INITIAL_REACTION_RATE = 0.34
const INITIAL_DIFFUSION_RATE = 0.171
const INITIAL_EPSILON = 0.107
const INITIAL_A = 0.95
const INITIAL_B = 1.0
const INITIAL_WIND_FACTOR = 0.0
const INITIAL_WIND_DIRECTION = [0.7, 0.3, -0.5]
const INITIAL_GRAVITY = 0.0
const INITIAL_GRAVITY_FACTOR = 0.0001
const INITIAL_GRAVITY_POS = [0.0, -1.0, 0.0]
const SOURCE_SIZE = 0.001

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
  isWrapMode: "int",
  pause: "int",
}

export class FitzHughNagumo3D extends ReactionDiffusionModel {
  constructor(renderer, size) {
    super(renderer, size, vertexShader, simulateShader, fitzhughNagumoUniforms)

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
      isWrapMode: false,
      sourceSize: SOURCE_SIZE,
      pause: 0,
      togglePause: () => this.togglePause(),
      reset: () => this.reset(),
    }
    this.reset()
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
        isWrapMode: this.param.isWrapMode ? 1 : 0,
        pause: this.param.pause,
      })
      this.source.render()
    }
  }
}
