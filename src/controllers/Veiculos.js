const VeiculosModel = require("../models/VeiculosModel");

class Veiculos {
  constructor(db) {
    this.veiculos_model = new VeiculosModel(db);
  }

  update(registro, altera_motorista) {
    return this.veiculos_model.update(registro, altera_motorista);
  }

  notFindInIsatAndUpdate(data) {
    return this.veiculos_model.notFindInIsatAndUpdate(data);
  }
}

module.exports = Veiculos;
