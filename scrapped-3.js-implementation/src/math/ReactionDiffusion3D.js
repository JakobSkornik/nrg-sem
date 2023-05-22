import * as THREE from "three"

export class ReactionDiffusion3D {
  constructor(size, data, params) {
    this.size = size
    this.diffusionRateU = params.diffusionRateU
    this.diffusionRateV = params.diffusionRateV
    this.feedRate = params.feedRate
    this.killRate = params.killRate
    this.data = data
  }

  laplacianWrap(x, y, z) {
    let idx = (z * this.size ** 2 + y * this.size + x) * 4
    const sU = this.data[idx + 1] / 255
    const sV = this.data[idx] / 255

    let sumU = 0
    let sumV = 0
    const dirs = [
      [-1, 0, 0],
      [1, 0, 0],
      [0, -1, 0],
      [0, 1, 0],
      [0, 0, -1],
      [0, 0, 1],
    ]
    for (let [dx, dy, dz] of dirs) {
      let nx = (x + dx + this.size) % this.size
      let ny = (y + dy + this.size) % this.size
      let nz = (z + dz + this.size) % this.size

      let idx = (nz * this.size ** 2 + ny * this.size + nx) * 4
      sumU += this.data[idx + 1] / 255
      sumV += this.data[idx] / 255
    }
    return [sumU - 6.0 * sU, sumV - 6.0 * sV]
  }

  laplacian(x, y, z) {
    let idx = (z * this.size ** 2 + y * this.size + x) * 4
    const sU = this.data[idx + 1] / 255
    const sV = this.data[idx] / 255

    let sumU = 0
    let sumV = 0
    const dirs = [
      [-1, 0, 0],
      [1, 0, 0],
      [0, -1, 0],
      [0, 1, 0],
      [0, 0, -1],
      [0, 0, 1],
    ]
    for (let [dx, dy, dz] of dirs) {
      let nx = x + dx
      let ny = y + dy
      let nz = z + dz

      if (nx < 0 || nx >= this.size || ny < 0 || ny >= this.size || nz < 0 || nz >= this.size) {
        continue
      }

      let idx = (nz * this.size ** 2 + ny * this.size + nx) * 4
      sumU += this.data[idx + 1] / 255
      sumV += this.data[idx] / 255
    }
    return [sumU - 6.0 * sU, sumV - 6.0 * sV]
  }

  reactionDiffusionStep(wrapped) {
    const newData = new Uint8Array(this.size * this.size * this.size * 4)

    for (let z = 0; z < this.size; z++) {
      for (let y = 0; y < this.size; y++) {
        for (let x = 0; x < this.size; x++) {
          let idx = (z * this.size * this.size + y * this.size + x) * 4
          let u = this.data[idx + 1] / 255
          let v = this.data[idx] / 255

          let [lapU, lapV] = wrapped ? this.laplacianWrap(x, y, z) : this.laplacian(x, y, z)

          let du = this.diffusionRateU * lapU - u * v * v + this.feedRate * (1 - u)
          let dv = this.diffusionRateV * lapV + u * v * v - (this.killRate + this.feedRate) * v

          u += du
          v += dv

          u = Math.min(Math.max(u, 0), 1)
          v = Math.min(Math.max(v, 0), 1)

          newData[idx + 1] = u * 255
          newData[idx] = v * 255
          newData[idx + 2] = 0
          newData[idx + 3] = 100
        }
      }
    }
    this.data = newData
  }

  dataToTexture() {
    const newTexture = new THREE.Data3DTexture(this.data, this.size, this.size, this.size)
    newTexture.format = THREE.RGBAFormat
    newTexture.minFilter = THREE.LinearFilter
    newTexture.magFilter = THREE.LinearFilter
    newTexture.unpackAlignment = 1
    newTexture.needsUpdate = true

    return newTexture
  }

  update(params) {
    this.diffusionRateU = params.diffusionRateU
    this.diffusionRateV = params.diffusionRateV
    this.feedRate = params.feedRate
    this.killRate = params.killRate
    this.reactionDiffusionStep()
    return this.dataToTexture()
  }
}
