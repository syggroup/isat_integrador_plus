const Produtos2Model = require("../models/Produtos2Model");

class Produtos2 {
  constructor(db) {
    this.produtos2_model = new Produtos2Model(db);
  }

  getProdutos2(data) {
    return this.produtos2_model.getAll(data);
  }
}

module.exports = Produtos2;
