"use strict"

import GUI from "lil-gui"
import { GrayScott3D } from "../models/gray_scott"
import { FitzHughNagumo3D } from "../models/fitzhugh_nagumo"
import { Schnakenberg3D } from "../models/schnakenberg"

const Model = {
  GrayScott3D: "Gray-Scott",
  FitzHughNagumo3D: "FitzHugh-Nagumo",
  Schnakenberg3D: "Schnakenberg3D",
}

export class UI {
  constructor(runner, model, dims) {
    this.runner = runner
    this.dims = dims

    this.selectedModel = { name: "", wrap: false }
    this._setGuiParams(model)
  }

  _handleModelChange(e) {
    if (e == this.selectedModel) return
    this.gui.destroy()

    switch (e) {
      case Model.GrayScott3D:
        this.runner.init(GrayScott3D)
        break
      case Model.FitzHughNagumo3D:
        this.runner.init(FitzHughNagumo3D)
        break
      case Model.Schnakenberg3D:
        this.runner.init(Schnakenberg3D)
        break
    }
  }

  _setGuiParams(modelClass) {
    switch (modelClass) {
      case GrayScott3D:
        this.selectedModel.name = Model.GrayScott3D
        this._setGrayScott3DParams()
        break
      case FitzHughNagumo3D:
        this.selectedModel.name = Model.FitzHughNagumo3D
        this._setFitzHughNagumoParams()
        break
      case Schnakenberg3D:
        this.selectedModel.name = Model.Schnakenberg3D
        this._setSchnakenbergParams()
        break
    }
  }

  _setGrayScott3DParams() {
    this.gui = new GUI()
    this.gui
      .add(this.selectedModel, "name", Object.values(Model))
      .onChange(this._handleModelChange.bind(this))
    this.gui.add(this.runner.model.param, "r_u", 0.001, 0.99, 0.001).name("Reaction Rate")
    this.gui.add(this.runner.model.param, "r_v", 0.001, 0.99, 0.001).name("Diffusion Rate")
    this.gui.add(this.runner.model.param, "f", 0.0001, 0.099, 0.0001).name("Feed Rate")
    this.gui.add(this.runner.model.param, "k", 0.0001, 0.099, 0.0001).name("Conversion Rate")
    this.gui.add(this.runner.model.param, "w", 0.0, 0.99, 0.01).name("Wind Force Factor")
    this.gui
      .add(this.runner.model.param, "G_factor", 0.0, 0.09, 0.0001)
      .name("Gravity Force Factor")
    this.gui.add(this.runner.model.param, "speed", 1, 20, 1).name("Speed")
    this.gui.add(this.runner.model.param, "sources", 1, 100, 1).name("Number of source positions")
    this.gui.add(this.runner.model.param, "isWrapMode").name("Wrap")
    this.gui.add(this.runner.model.param, "reset").name("Reset Scene")
  }

  _setFitzHughNagumoParams() {
    this.gui = new GUI()
    this.gui
      .add(this.selectedModel, "name", Object.values(Model))
      .onChange(this._handleModelChange.bind(this))
    this.gui.add(this.runner.model.param, "r_u", 0.17, 0.4, 0.001).name("Reaction Rate")
    this.gui.add(this.runner.model.param, "r_v", 0.003, 0.3, 0.001).name("Diffusion Rate")
    this.gui.add(this.runner.model.param, "epsilon", 0.0001, 0.99, 0.0001).name("Epsilon")
    this.gui.add(this.runner.model.param, "a", 0.0, 1.0, 0.01).name("Alpha")
    this.gui.add(this.runner.model.param, "b", 0.0, 1.0, 0.01).name("Beta")
    this.gui.add(this.runner.model.param, "w", 0.0, 0.99, 0.01).name("Wind Force Factor")
    this.gui
      .add(this.runner.model.param, "G_factor", 0.0, 0.09, 0.0001)
      .name("Gravity Force Factor")
    this.gui.add(this.runner.model.param, "speed", 1, 20, 1).name("Speed")
    this.gui.add(this.runner.model.param, "sources", 1, 100, 1).name("Number of source positions")
    this.gui.add(this.runner.model.param, "isWrapMode").name("Wrap")
    this.gui.add(this.runner.model.param, "reset").name("Reset Scene")
  }

  _setSchnakenbergParams() {
    this.gui = new GUI()
    this.gui
      .add(this.selectedModel, "name", Object.values(Model))
      .onChange(this._handleModelChange.bind(this))
    this.gui.add(this.runner.model.param, "r_u", 0.001, 0.99, 0.001).name("Reaction Rate")
    this.gui.add(this.runner.model.param, "r_v", 0.001, 0.99, 0.001).name("Diffusion Rate")
    this.gui.add(this.runner.model.param, "a", 0.0001, 0.099, 0.0001).name("Alpha")
    this.gui.add(this.runner.model.param, "b", 0.0001, 0.099, 0.0001).name("Beta")
    this.gui.add(this.runner.model.param, "w", 0.0, 0.99, 0.01).name("Wind Force Factor")
    this.gui
      .add(this.runner.model.param, "G_factor", 0.0, 0.09, 0.0001)
      .name("Gravity Force Factor")
    this.gui.add(this.runner.model.param, "speed", 1, 20, 1).name("Speed")
    this.gui.add(this.runner.model.param, "sources", 1, 100, 1).name("Number of source positions")
    this.gui.add(this.runner.model.param, "isWrapMode").name("Wrap")
    this.gui.add(this.runner.model.param, "reset").name("Reset Scene")
  }
}
