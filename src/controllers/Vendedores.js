const VendedoresModel = require("../models/VendedoresModel");

class Vendedores {
  constructor(db) {
    this.vendedores_model = new VendedoresModel(db);
  }

  getVendedores(data) {
    return this.vendedores_model.getAll(data);
  }
}

module.exports = Vendedores;
