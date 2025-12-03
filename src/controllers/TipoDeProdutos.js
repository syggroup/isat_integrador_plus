const TipoDeProdutosModel = require("../models/TipoDeProdutosModel");

class TipoDeProdutos {
  constructor(db) {
    this.tipo_de_produtos_model = new TipoDeProdutosModel(db);
  }

  getTipoDeProdutos(data) {
    return this.tipo_de_produtos_model.get(data);
  }
}

module.exports = TipoDeProdutos;
