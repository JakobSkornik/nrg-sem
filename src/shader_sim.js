"use strict"

import * as Stats from "stats-js"
import { Controls, Display, Renderer, UI } from "./utils"

const SIZE = 300
const dims = { width: SIZE, height: SIZE, depth: SIZE }

export class ShaderSim {
  constructor(canvas, RDModel) {
    this.canvas = canvas
    this._initCanvasDimensions()
    this.renderer = new Renderer(this.canvas)
    this.display = new Display(this.renderer, canvas.width, canvas.height)
    window.addEventListener("resize", this._resize.bind(this))
    this.init(RDModel)
  }

  init(RDModel) {
    this.model = new RDModel(this.renderer, dims)
    this.ui = new UI(this, RDModel, dims)
    this.controls = new Controls(this.canvas, this.display, this.model)
    
    this.stats = new Stats()
    this.stats.showPanel(0)
    document.body.appendChild(this.stats.dom)
    
    this._loop()
  }

  _initCanvasDimensions() {
    const [width, height, pixelRatio] = [
      window.innerWidth,
      window.innerHeight,
      Math.min(window.devicePixelRatio, 2),
    ]

    this.canvas.width = Math.floor(width * pixelRatio)
    this.canvas.height = Math.floor(height * pixelRatio)
    this.canvas.style = { width: `${width}px`, height: `${height}px` }
  }

  _resize() {
    this._initCanvasDimensions()
    this.renderer.resize(this.canvas.width, this.canvas.height)
    this.display.resize(this.canvas.width, this.canvas.height)
  }

  _loop() {
    requestAnimationFrame(this._loop.bind(this))
    this.stats.begin()
    this.model.step()
    this.display.updateCamera()
    this.display.setTexture(this.model.source.texture)
    this.display.render()
    this.stats.end()
  }
}
