const TipoCaminhaoModel = require("../models/TipoCaminhaoModel");

class TipoCaminhao {
  constructor(db) {
    this.tipo_caminhao_model = new TipoCaminhaoModel(db);
  }

  getTipoCaminhao(data) {
    return this.tipo_caminhao_model.get(data);
  }
}

module.exports = TipoCaminhao;
