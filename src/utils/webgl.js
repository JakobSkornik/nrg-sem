"use strict"

import * as glMatrix from "gl-matrix"

// Adapted from glslEditor: https://github.com/patriciogonzalezvivo/glslEditor/tree/main

const CUBE_UV3_MAPPING = [1, 1, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0]
const CUBE_FACES = [
  0, 2, 1, 2, 0, 3, 4, 5, 6, 6, 7, 4, 0, 7, 3, 7, 0, 4, 1, 2, 6, 6, 5, 1, 0, 5, 4, 5, 0, 1, 3, 7, 6,
  6, 2, 3,
]
const BOX_POSITION_INDICES = {
  x: [0, 1, 4, 5],
  y: [0, 3, 4, 7],
  z: [0, 1, 2, 3],
}

const PLANE_POSITION_INDICES = {
  x: [0, 1],
  y: [0, 3],
}
const PLANE_UV2_MAPPING = [1, 1, 1, 0, 0, 0, 0, 1]
const PLANE_FACES = [0, 2, 1, 2, 0, 3]

export class Geometry {
  constructor(renderer) {
    this.gl = renderer.gl
    this.vbos = []
    this.ibo = null
    this.modelMatrix = glMatrix.mat4.create()
  }

  createVertexBuffer(name, list) {
    this.vbos[name] = this._createBuffer(
      this.gl.ARRAY_BUFFER,
      list,
      Float32Array,
      this.gl.STATIC_DRAW
    )
  }

  createIndexBuffer(list) {
    this.ibo = this._createBuffer(
      this.gl.ELEMENT_ARRAY_BUFFER,
      list,
      Uint8Array,
      this.gl.STATIC_DRAW
    )
    this.indexLength = list.length
  }

  _createBuffer(target, list, ArrayType, usage) {
    const { gl } = this
    const buffer = gl.createBuffer()
    gl.bindBuffer(target, buffer)
    gl.bufferData(target, new ArrayType(list), usage)
    gl.bindBuffer(target, null)
    return buffer
  }
}

export class Plane extends Geometry {
  constructor(renderer, width = 2, height = 2) {
    super(renderer)

    const posValues = [width / 2, height / 2, 0]
    const positions = []
    for (let i = 0; i < 4; i++) {
      positions.push((PLANE_POSITION_INDICES.x.includes(i) ? 1 : -1) * posValues[0])
      positions.push((PLANE_POSITION_INDICES.y.includes(i) ? 1 : -1) * posValues[1])
      positions.push(posValues[2])
    }
    this.createVertexBuffer("position", positions)
    this.createVertexBuffer("uv2", PLANE_UV2_MAPPING)
    this.createIndexBuffer(PLANE_FACES)
  }
}

export class Box extends Geometry {
  constructor(renderer, width = 1, height = 1, depth = 1) {
    super(renderer)

    const posValues = [width / 2, height / 2, depth / 2]
    const positions = []
    for (let i = 0; i < 8; i++) {
      positions.push((BOX_POSITION_INDICES.x.includes(i) ? 1 : -1) * posValues[0])
      positions.push((BOX_POSITION_INDICES.y.includes(i) ? 1 : -1) * posValues[1])
      positions.push((BOX_POSITION_INDICES.z.includes(i) ? 1 : -1) * posValues[2])
    }
    this.createVertexBuffer("position", positions)
    this.createIndexBuffer(CUBE_FACES)
  }
}

export class Camera {
  constructor() {
    this.viewMatrix = glMatrix.mat4.create()
    this.projectionMatrix = glMatrix.mat4.create()
    this.radius = 0
    this.theta = 0
    this.phi = 0
    this.position = glMatrix.vec3.create()
  }

  setRadius(radius) {
    this.radius = radius
    glMatrix.vec3.set(this.position, 0, 0, this.radius)
    glMatrix.mat4.lookAt(this.viewMatrix, this.position, [0, 0, 0], [0, 1, 0])
  }

  getRadius() {
    return this.radius
  }

  rotate(dtheta, dphi) {
    this.theta += dtheta
    this.phi = Math.min(Math.max(this.phi + dphi, -Math.PI / 2), Math.PI / 2)
    const rotateMatrix = glMatrix.mat4.create()
    glMatrix.mat4.rotateY(rotateMatrix, rotateMatrix, this.theta)
    glMatrix.mat4.rotateX(rotateMatrix, rotateMatrix, this.phi)
    glMatrix.vec3.transformMat4(this.position, [0, 0, this.radius], rotateMatrix)
    glMatrix.mat4.lookAt(this.viewMatrix, this.position, [0, 0, 0], [0, 1, 0])
  }

  perspective(fovy, aspect, near, far) {
    glMatrix.mat4.perspective(this.projectionMatrix, fovy, aspect, near, far)
  }
}

export class Framebuffer {
  constructor(renderer, width, height, depth, double = true, initValue = null) {
    this.renderer = renderer
    this.size = { width, height, depth }

    if (double) {
      this.frameId = 0
      this.frame = new Array(2)
      this.frame[0] = this._createFramebuffer(width, height, depth, initValue)
      this.frame[1] = this._createFramebuffer(width, height, depth, initValue)
      this.texture = this.frame[1].texture
    } else {
      this.frame = this._createFramebuffer(width, height, depth, initValue)
      this.texture = this.frame.texture
    }

    this.isDouble = double
  }

  render(useAlpha, clearColor, clearDepth) {
    const currentFrame = this.isDouble ? this.frame[this.frameId] : this.frame
    this.renderer.resize(this.size.width, this.size.height)
    this.renderer.uniforms["resolution"] = [this.size.width, this.size.height, this.size.depth]
    for (let i = 0; i < currentFrame.list.length; i++) {
      this.renderer.uniforms["startZ"] = i * this.maxBuffers
      this.renderer.render({
        framebuffer: currentFrame.list[i].framebuffer,
        buffers: currentFrame.list[i].buffers,
        useAlpha: useAlpha,
        clearColor: clearColor,
        clearDepth: clearDepth,
      })
    }

    this.texture = currentFrame.texture
    if (this.isDouble) this.frameId = 1 - this.frameId
  }

  clearColor(color) {
    const currentFrame = this.isDouble ? this.frame[this.frameId] : this.frame
    for (let i = 0; i < currentFrame.list.length; i++) {
      this.renderer.clearColor(
        currentFrame.list[i].framebuffer,
        currentFrame.list[i].buffers,
        color
      )
    }
    this.texture = currentFrame.texture
    if (this.isDouble) this.frameId = 1 - this.frameId
  }

  _createFramebuffer(width, height, depth, initValue) {
    const gl = this.renderer.gl

    const texture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_3D, texture)

    if (initValue != null) {
      const initialData = new Float32Array(4 * width * height * depth)
      for (let i = 0; i < width * height * depth; i++) {
        initialData[i * 4 + 0] = initValue[0]
        initialData[i * 4 + 1] = initValue[1]
        initialData[i * 4 + 2] = initValue[2]
        initialData[i * 4 + 3] = initValue[3]
      }
      gl.texImage3D(
        gl.TEXTURE_3D,
        0,
        gl.RGBA32F,
        width,
        height,
        depth,
        0,
        gl.RGBA,
        gl.FLOAT,
        initialData
      )
    } else {
      gl.texImage3D(gl.TEXTURE_3D, 0, gl.RGBA32F, width, height, depth, 0, gl.RGBA, gl.FLOAT, null)
    }
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE)

    const list = []
    this.maxBuffers = gl.getParameter(gl.MAX_DRAW_BUFFERS)
    for (let j = 0; j < depth; j += this.maxBuffers) {
      const framebuffer = gl.createFramebuffer()
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)

      const layers = Math.min(this.maxBuffers, depth - j)
      const buffers = []
      for (let i = 0; i < layers; i++) {
        gl.framebufferTextureLayer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, texture, 0, i + j)
        buffers.push(gl.COLOR_ATTACHMENT0 + i)
      }

      list.push({ framebuffer, buffers })
    }

    gl.bindTexture(gl.TEXTURE_3D, null)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)

    return { texture, list }
  }
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas
    this.gl = canvas.getContext("webgl2")
    this._validateWebGLContext()
    this.gl.enable(this.gl.CULL_FACE)

    this.geometries = []
    this.shader = null
    this.uniforms = []
    this.camera = null
  }

  resize(width, height) {
    this.gl.viewport(0, 0, width, height)
  }

  set(geometries, shader, uniforms, camera) {
    this.geometries = Array.isArray(geometries) ? geometries : [geometries]
    this.shader = shader
    this.uniforms = uniforms
    this.camera = camera
  }

  render({
    framebuffer = null,
    buffers = null,
    useAlpha = true,
    clearColor = null,
    clearDepth = null,
  }) {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer)

    if (buffers) this.gl.drawBuffers(buffers)
    useAlpha ? this._enableAlphaBlending() : this.gl.disable(this.gl.BLEND)

    if (clearColor) this._clearColorBuffer(clearColor)
    if (clearDepth) this._clearDepthBuffer(clearDepth)

    this.gl.useProgram(this.shader.program)
    this._setUniforms()

    this.geometries.forEach((geometry) => this._drawGeometry(geometry))
    this.gl.flush()
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null)
  }

  clearColor(framebuffer, buffers, color) {
    const gl = this.gl
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)
    if (buffers) {
      gl.drawBuffers(buffers)
    }
    gl.clearColor(color[0], color[1], color[2], color[3])
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.flush()
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  }

  _validateWebGLContext() {
    if (!this.gl) alert("WebGL2 unsupported.")

    if (!this.gl.getExtension("EXT_color_buffer_float")) alert("need EXT_color_buffer_float")
    if (!this.gl.getExtension("OES_texture_float_linear")) alert("need OES_texture_float_linear")
  }

  _enableAlphaBlending() {
    this.gl.enable(this.gl.BLEND)
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA)
  }

  _clearColorBuffer(color) {
    this.gl.clearColor(...color)
    this.gl.clear(this.gl.COLOR_BUFFER_BIT)
  }

  _clearDepthBuffer(depth) {
    this.gl.clearDepth(depth)
    this.gl.clear(this.gl.DEPTH_BUFFER_BIT)
  }

  _drawGeometry(geometry) {
    this._setAttributes(geometry)
    if (this.camera) {
      this._setUniform(
        this.shader.uniforms["modelMatrix"].location,
        geometry.modelMatrix,
        this.shader.uniforms["modelMatrix"].type
      )
    }
    this.gl.drawElements(this.gl.TRIANGLES, geometry.indexLength, this.gl.UNSIGNED_BYTE, 0)
  }

  _setAttributes(geometry) {
    const gl = this.gl
    const shader = this.shader

    for (let key in geometry.vbos) {
      if (key in shader.attributes) {
        gl.bindBuffer(gl.ARRAY_BUFFER, geometry.vbos[key])
        gl.enableVertexAttribArray(shader.attributes[key].location)
        gl.vertexAttribPointer(
          shader.attributes[key].location,
          shader.attributes[key].size,
          gl.FLOAT,
          false,
          0,
          0
        )
      }
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, geometry.ibo)
  }

  _validateWebGLContext() {
    if (!this.gl) alert("WebGL2 unsupported.")
    if (!this.gl.getExtension("EXT_color_buffer_float")) alert("need EXT_color_buffer_float")
    if (!this.gl.getExtension("OES_texture_float_linear")) alert("need OES_texture_float_linear")
  }

  _setUniforms() {
    const shader = this.shader
    const uniforms = this.uniforms

    let textureId = 0

    for (let key in uniforms) {
      if (key in shader.uniforms) {
        if (shader.uniforms[key].type == "sampler2D") {
          this.gl.activeTexture(this.gl.TEXTURE0 + textureId)
          this.gl.bindTexture(this.gl.TEXTURE_2D, uniforms[key])
          this._setUniform(shader.uniforms[key].location, textureId, shader.uniforms[key].type)
          textureId++
        } else if (shader.uniforms[key].type == "sampler3D") {
          this.gl.activeTexture(this.gl.TEXTURE0 + textureId)
          this.gl.bindTexture(this.gl.TEXTURE_3D, uniforms[key])
          this._setUniform(shader.uniforms[key].location, textureId, shader.uniforms[key].type)
          textureId++
        } else {
          this._setUniform(shader.uniforms[key].location, uniforms[key], shader.uniforms[key].type)
        }
      }
    }

    if (this.camera) {
      this._setUniform(
        shader.uniforms["viewMatrix"].location,
        this.camera.viewMatrix,
        shader.uniforms["viewMatrix"].type
      )
      this._setUniform(
        shader.uniforms["projectionMatrix"].location,
        this.camera.projectionMatrix,
        shader.uniforms["projectionMatrix"].type
      )
    }
  }

  _setUniform(location, value, type) {
    switch (type) {
      case "int":
      case "sampler2D":
      case "sampler3D":
      case "bool":
        this.gl.uniform1i(location, value)
        break
      case "float":
        this.gl.uniform1f(location, value)
        break
      case "vec2":
        this.gl.uniform2fv(location, value)
        break
      case "vec3":
        this.gl.uniform3fv(location, value)
        break
      case "vec4":
        this.gl.uniform4fv(location, value)
        break
      case "mat4":
        this.gl.uniformMatrix4fv(location, false, value)
        break
      default:
        break
    }
  }
}

export class Shader {
  constructor(renderer, vertexShader, fragmentShader) {
    this.gl = renderer.gl

    this._createShader(vertexShader, fragmentShader)

    this.attributes = []
    this.uniforms = []
  }

  createAttributes(attributes) {
    for (let key in attributes) {
      const attributeLocation = this.gl.getAttribLocation(this.program, key)
      this.attributes[key] = {
        location: attributeLocation,
        size: attributes[key],
      }
    }
  }

  createUniforms(uniforms) {
    for (let key in uniforms) {
      const uniformLocation = this.gl.getUniformLocation(this.program, key)
      this.uniforms[key] = {
        location: uniformLocation,
        type: uniforms[key],
      }
    }
  }

  _createShader(vertexShader, fragmentShader) {
    this.vertexShader = this.gl.createShader(this.gl.VERTEX_SHADER)
    this.fragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER)

    this.gl.shaderSource(this.vertexShader, vertexShader)
    this.gl.shaderSource(this.fragmentShader, fragmentShader)

    this.gl.compileShader(this.vertexShader)
    this.gl.compileShader(this.fragmentShader)

    if (!this.gl.getShaderParameter(this.vertexShader, this.gl.COMPILE_STATUS)) {
      alert(
        "An error occurred compiling the vertex shader: " +
          this.gl.getShaderInfoLog(this.vertexShader)
      )
      this.gl.deleteShader(this.vertexShader)
      return null
    }

    if (!this.gl.getShaderParameter(this.fragmentShader, this.gl.COMPILE_STATUS)) {
      alert(
        "An error occurred compiling the fragment shader: " +
          this.gl.getShaderInfoLog(this.fragmentShader)
      )
      this.gl.deleteShader(this.fragmentShader)
      return null
    }

    this.program = this.gl.createProgram()
    this.gl.attachShader(this.program, this.vertexShader)
    this.gl.attachShader(this.program, this.fragmentShader)
    this.gl.linkProgram(this.program)

    if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
      alert(this.gl.getProgramInfoLog(this.program))
    }
    this.gl.useProgram(this.program)
  }
}

