const CompradoresModel = require("../models/CompradoresModel");

class Compradores {
  constructor(db) {
    this.compradores_model = new CompradoresModel(db);
  }

  getCompradores(data) {
    return this.compradores_model.getAll(data);
  }
}

module.exports = Compradores;
