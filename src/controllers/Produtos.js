const ProdutosModel = require("../models/ProdutosModel");

class Produtos {
  constructor(db) {
    this.produtos_model = new ProdutosModel(db);
  }

  getProdutos(data) {
    return this.produtos_model.getAll(data);
  }
}

module.exports = Produtos;
