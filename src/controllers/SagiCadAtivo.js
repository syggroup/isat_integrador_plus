const SagiCadAtivoModel = require("../models/SagiCadAtivoModel");

class SagiCadAtivo {
  constructor(db) {
    this.sagiCadAtivo_model = new SagiCadAtivoModel(db);
  }

  getSagiCadAtivo(data) {
    return this.sagiCadAtivo_model.getAll(data);
  }
}

module.exports = SagiCadAtivo;
