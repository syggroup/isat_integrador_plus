const CategoriaDeFornecedoresModel = require("../models/CategoriaDeFornecedoresModel");

class CategoriaDeFornecedores {
  constructor(db) {
    this.categoria_de_fornecedores_model = new CategoriaDeFornecedoresModel(db);
  }

  getCategoriaDeFornecedores(data) {
    return this.categoria_de_fornecedores_model.getAll(data);
  }
}

module.exports = CategoriaDeFornecedores;
