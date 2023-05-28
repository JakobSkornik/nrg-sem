"use strict"

import simulateShader from "./schnakenberg.frag"
import vertexShader from "../../shaders/position.vert"
import { ReactionDiffusionModel } from "../model"

const INITIAL_SOURCES_NUM = 1
const INITIAL_REACTION_RATE = 0.176
const INITIAL_DIFFUSION_RATE = 0.08
const INITIAL_ALPHA = 0.00625
const INITIAL_BETA = 0.09
const INITIAL_WIND_FACTOR = 0.0
const INITIAL_WIND_DIRECTION = [0.7, 0.3, -0.5]
const INITIAL_GRAVITY = 0.0
const INITIAL_GRAVITY_FACTOR = 0.0001
const INITIAL_GRAVITY_POS = [0.0, -1.0, 0.0]
const SOURCE_SIZE = 0.001

const schnakenbergUniforms = {
  startZ: "float",
  resolution: "vec3",
  map: "sampler3D",
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

export class Schnakenberg3D extends ReactionDiffusionModel {
  constructor(renderer, size) {
    super(renderer, size, vertexShader, simulateShader, schnakenbergUniforms)

    this.param = {
      r_u: INITIAL_REACTION_RATE,
      r_v: INITIAL_DIFFUSION_RATE,
      a: INITIAL_ALPHA,
      b: INITIAL_BETA,
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
