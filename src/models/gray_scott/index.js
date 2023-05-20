"use strict"

import simulateShader from "./gray_scott.frag"
import vertexShader from "../../shaders/vertex.vert"
import { ReactionDiffusionModel } from "../model"

const INITIAL_SOURCES_NUM = 5
const INITIAL_REACTION_RATE = 0.15
const INITIAL_DIFFUSION_RATE = 0.08
const INITIAL_FEED_RATE = 0.03
const INITIAL_CONVERSION_RATE = 0.06
const INITIAL_WIND_FACTOR = 0.0
const INITIAL_WIND_DIRECTION = [0.7, 0.3, -0.5]
const INITIAL_GRAVITY = 0.0
const INITIAL_GRAVITY_FACTOR = 0.0001
const INITIAL_GRAVITY_POS = [0.0, -1.0, 0.0]
const SOURCE_SIZE = 0.001

const grayScottUniforms = {
  startZ: "float",
  resolution: "vec3",
  map: "sampler3D",
  D: "vec2",
  f: "float",
  k: "float",
  w: "float",
  windDirection: "vec3",
  G: "float",
  G_factor: "float",
  G_pos: "vec3",
  isWrapMode: "int",
}

export class GrayScott3D extends ReactionDiffusionModel {
  constructor(renderer, size) {
    super(renderer, size, vertexShader, simulateShader, grayScottUniforms)
    
    this.param = {
      r_u: INITIAL_REACTION_RATE,
      r_v: INITIAL_DIFFUSION_RATE,
      f: INITIAL_FEED_RATE,
      k: INITIAL_CONVERSION_RATE,
      w: INITIAL_WIND_FACTOR,
      windDirection: INITIAL_WIND_DIRECTION,
      G: INITIAL_GRAVITY,
      G_factor: INITIAL_GRAVITY_FACTOR,
      G_pos: INITIAL_GRAVITY_POS,
      sources: INITIAL_SOURCES_NUM,
      speed: 1,
      isWrapMode: false,
      sourceSize: SOURCE_SIZE,
      reset: () => this.reset(),
    }
    this.reset()
  }

  step() {
    for (let i = 0; i < this.param.speed; i++) {
      this.renderer.set(this.plane, this.shader, {
        map: this.source.texture,
        D: [this.param.r_u, this.param.r_v],
        f: this.param.f,
        k: this.param.k,
        w: this.param.w,
        windDirection: this.param.windDirection,
        G: this.param.G,
        G_factor: this.param.G_factor,
        G_pos: this.param.G_pos,
        isWrapMode: this.param.isWrapMode ? 1 : 0,
      })
      this.source.render()
    }
  }
}
