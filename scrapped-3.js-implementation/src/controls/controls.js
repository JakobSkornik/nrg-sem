import * as THREE from "three"
import { PointerLockControls } from "./PointerLockControls"

let moveForward = false
let moveBackward = false
let moveLeft = false
let moveRight = false
let moveUp = false
let moveDown = false
let velocityScale = 1
const velocity = new THREE.Vector3()
const direction = new THREE.Vector3()

export function addListeners(instructions, controls) {
  instructions.addEventListener(
    "click",
    function () {
      controls.lock()
    },
    false
  )

  controls.addEventListener("lock", function () {
    instructions.style.display = "none"
    blocker.style.display = "none"
  })

  controls.addEventListener("unlock", function () {
    blocker.style.display = "block"
    instructions.style.display = ""
  })
}

export function createControls(camera, domElement) {
  const controls = new PointerLockControls(camera, domElement)

  const onKeyDown = function (event) {
    switch (event.keyCode) {
      case 87: // w
        moveForward = true
        break
      case 65: // a
        moveLeft = true
        break
      case 83: // s
        moveBackward = true
        break
      case 68: // d
        moveRight = true
        break
      case 81: // q
        moveUp = true
        break
      case 69: // e
        moveDown = true
        break
    }
  }

  const onKeyUp = function (event) {
    switch (event.keyCode) {
      case 87: // w
        moveForward = false
        break
      case 65: // a
        moveLeft = false
        break
      case 83: // s
        moveBackward = false
        break
      case 68: // d
        moveRight = false
        break
      case 81: // q
        moveUp = false
        break
      case 69: // e
        moveDown = false
        break
    }
  }

  document.addEventListener("keydown", onKeyDown, false)
  document.addEventListener("keyup", onKeyUp, false)
  document.addEventListener("wheel", function (event) {
    if (event.deltaY < 0) {
      velocityScale *= 1.1
    } else {
      velocityScale /= 1.1
    }
  })

  return controls
}

export function getMovementVector(delta) {
  velocity.x -= velocity.x * 10.0 * delta
  velocity.y -= velocity.y * 10.0 * delta
  velocity.z -= velocity.z * 10.0 * delta

  direction.z = Number(moveForward) - Number(moveBackward)
  direction.y = Number(moveUp) - Number(moveDown)
  direction.x = Number(moveRight) - Number(moveLeft)
  direction.normalize()

  if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta * velocityScale
  if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta * velocityScale
  if (moveUp || moveDown) velocity.y -= direction.y * 400.0 * delta * velocityScale

  return velocity
}
