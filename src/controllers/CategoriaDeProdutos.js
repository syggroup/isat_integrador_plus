const CategoriaDeProdutosModel = require("../models/CategoriaDeProdutosModel");

class CategoriaDeProdutos {
  constructor(db) {
    this.categoria_de_produtos_model = new CategoriaDeProdutosModel(db);
  }

  getCategoriaDeProdutos(data) {
    return this.categoria_de_produtos_model.getAll(data);
  }
}

module.exports = CategoriaDeProdutos;
