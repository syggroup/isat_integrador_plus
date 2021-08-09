const FornecedoresModel = require("../models/FornecedoresModel");

class Fornecedores {
  constructor(db) {
    this.fornecedores_model = new FornecedoresModel(db);
  }

  getFornecedores(data) {
    return this.fornecedores_model.get(data);
  }
}

module.exports = Fornecedores;
