import * as THREE from "three"
import WebGL from "./renderer/WebGL.js"
import { GUI } from "lil-gui"
import { ReactionDiffusion3D } from "./math/ReactionDiffusion3D.js"
import { OrbitControls } from "./controls/OrbitControls.js"
import { fragmentGlsl, vertexGlsl } from "./renderer/GLSL.js"

if (WebGL.isWebGL2Available() === false) {
  document.body.appendChild(WebGL.getWebGL2ErrorMessage())
}

let renderer, scene, camera, texture, mesh, rd
let prevTime = performance.now()
const size = 80

const parameters = {
  threshold: 0.2,
  steps: 200,
  diffusionRateU: 0.164,
  diffusionRateV: 0.2,
  feedRate: 0.013,
  killRate: 0.2,
  p: 0.01,
  wrap: false,
}

init()
animate()

function getInitialTexture(size) {
  const data = new Uint8Array(size * size * size * 4)
  let i = 0
  for (let z = 0; z < size; z++) {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const stride = i * 4
        data[stride] = 255
        if (Math.random() < parameters.p) {
          data[stride + 1] = Math.random() * 255
        } else {
          data[stride + 1] = 0
        }
        data[stride + 2] = 0
        data[stride + 3] = 100
        i++
      }
    }
  }

  const t = new THREE.Data3DTexture(data, size, size, size)
  t.format = THREE.RGBAFormat
  t.minFilter = THREE.LinearFilter
  t.magFilter = THREE.LinearFilter
  t.unpackAlignment = 1
  t.needsUpdate = true
  return t
}

function init() {
  renderer = new THREE.WebGLRenderer()
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(window.innerWidth, window.innerHeight)
  document.body.appendChild(renderer.domElement)

  scene = new THREE.Scene()

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100)
  camera.position.set(0, 0, 2)
  new OrbitControls(camera, renderer.domElement)

  // Texture
  texture = getInitialTexture(size)
  rd = new ReactionDiffusion3D(size, texture.image.data, parameters)

  // Material
  const vertexShader = vertexGlsl
  const fragmentShader = fragmentGlsl

  const geometry = new THREE.BoxGeometry(1, 1, 1)
  const material = new THREE.RawShaderMaterial({
    glslVersion: THREE.GLSL3,
    uniforms: {
      map: { value: texture },
      cameraPos: { value: new THREE.Vector3() },
      threshold: { value: parameters.threshold },
      steps: { value: parameters.steps },
    },
    vertexShader,
    fragmentShader,
    side: THREE.BackSide,
  })

  mesh = new THREE.Mesh(geometry, material)
  scene.add(mesh)

  function update() {
    material.uniforms.threshold.value = parameters.threshold
    material.uniforms.steps.value = parameters.steps
    rd.diffusionRateU = parameters.diffusionRateU
    rd.diffusionRateV = parameters.diffusionRateV
    rd.feedRate = parameters.feedRate
    rd.killRate = parameters.killRate
  }

  const gui = new GUI()
  gui.add(parameters, "threshold", 0, 1, 0.01).onChange(update)
  gui.add(parameters, "steps", 0, 300, 1).onChange(update)
  gui.add(parameters, "diffusionRateU", 0, 0.5, 0.0001).onChange(update)
  gui.add(parameters, "diffusionRateV", 0, 0.5, 0.0001).onChange(update)
  gui.add(parameters, "feedRate", 0, 0.1, 0.0001).onChange(update)
  gui.add(parameters, "killRate", 0, 1, 0.0001).onChange(update)
  gui.add(parameters, "p", 0, 0.5, 0.001).onChange(update)
  gui.add(parameters, "wrap").onChange(update)

  const restartButton = {
    Restart: function () {
      texture.dispose()
      texture = getInitialTexture(size)
      rd = new ReactionDiffusion3D(size, texture.image.data, parameters)
    },
  }
  gui.add(restartButton, "Restart")

  window.addEventListener("resize", onWindowResize)
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}

function animate() {
  requestAnimationFrame(animate)
  const now = performance.now()

  if (now - prevTime > 25) {
    let newTexture = rd.update(parameters) // Replace this line with reaction diffusion
    mesh.material.uniforms.map.value = newTexture
    mesh.material.needsUpdate = true
    texture.dispose()
    texture = newTexture
    prevTime = now
  }

  mesh.material.uniforms.cameraPos.value.copy(camera.position)
  renderer.render(scene, camera)
}
