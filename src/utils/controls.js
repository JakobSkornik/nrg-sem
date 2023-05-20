"use strict"

const POS_ZOOM_FACTOR = 1.03
const NEG_ZOOM_FACTOR = 0.97

export class Controls {
  constructor(canvas, display, model) {
    this.canvas = canvas
    this.display = display
    this.model = model

    this.mouse = { x: 0, y: 0, dx: 0, dy: 0, down: false }
    this.canvas.addEventListener("mousemove", (e) => this._mousemove(e))
    this.canvas.addEventListener("wheel", (e) => this._mousewheel(e))
    this.canvas.addEventListener("mousedown", this._mousedown.bind(this))
    this.canvas.addEventListener("mouseup", this._mouseup.bind(this))
    window.addEventListener("keydown", (e) => this._keydown(e))
    window.addEventListener("keyup", (e) => this._keyup(e))
  }

  _keydown(e) {
    if(e.code === "Space") {
      this.model.setGravityForce(1.0, this.mouse)
    }
  }

  _keyup(e) { 
    if(e.code === "Space") {
      this.model.setGravityForce(0.0, this.mouse)
    }
  }

  _mousemove(e) {
    Object.assign(this.mouse, {
      x: e.x / window.innerWidth,
      y: (window.innerHeight - e.y) / window.innerHeight,
      dx: e.movementX,
      dy: -e.movementY,
    })

    if (this.mouse.down == true) {
      this.display.rotation.dtheta = (-Math.PI * this.mouse.dx) / window.innerWidth
      this.display.rotation.dphi = (Math.PI * this.mouse.dy) / window.innerHeight
    }
  }

  _mousedown() {
    this.mouse.down = true
  }

  _mouseup() {
    this.mouse.down = false
  }

  _mousewheel(e) {
    const dz = e.deltaY > 0 ? POS_ZOOM_FACTOR : NEG_ZOOM_FACTOR
    this.display.zoom(dz)
  }
}
