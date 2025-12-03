const SetoresModel = require("../models/SetoresModel");

class Setores {
  constructor(db) {
    this.setores_model = new SetoresModel(db);
  }

  getSetores(data) {
    return this.setores_model.getAll(data);
  }
}

module.exports = Setores;
