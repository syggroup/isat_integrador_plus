const CentroDeContasModel = require("../models/CentroDeContasModel");

class CentroDeContas {
  constructor(db) {
    this.plano_de_contas_model = new CentroDeContasModel(db);
  }

  getCentroDeContas(data) {
    return this.plano_de_contas_model.getAll(data);
  }
}

module.exports = CentroDeContas;
