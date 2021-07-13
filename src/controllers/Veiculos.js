const VeiculosModel = require("../models/VeiculosModel");

class Veiculos {
  constructor(db) {
    this.veiculos_model = new VeiculosModel(db);
  }

  update(data) {
    return this.veiculos_model.update(data);
  }
}

module.exports = Veiculos;
