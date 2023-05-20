"use strict"

import { ShaderSim } from "./shader_sim"
import { GrayScott3D } from "./models/gray_scott"

new ShaderSim(document.getElementById("main"), GrayScott3D)
