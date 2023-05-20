"use strict"

import { ShaderSim } from "./shader_sim"
import { GrayScott3D } from "./models/gray_scott"
import { Schnakenberg } from "./models/schnakenberg"

new ShaderSim(document.getElementById("main"), Schnakenberg)
