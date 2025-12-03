const CentroDeCustosModel = require("../models/CentroDeCustosModel");

class CentroDeCustos {
  constructor(db) {
    this.centro_de_custos_model = new CentroDeCustosModel(db);
  }

  getCentroDeCustos(data) {
    return this.centro_de_custos_model.getAll(data);
  }
}

module.exports = CentroDeCustos;
