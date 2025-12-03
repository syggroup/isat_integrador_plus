const CredoresModel = require("../models/CredoresModel");

class Credores {
  constructor(db) {
    this.credores_model = new CredoresModel(db);
  }

  getCredores(data) {
    return this.credores_model.getAll(data);
  }
}

module.exports = Credores;
