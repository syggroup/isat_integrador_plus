const NotasModel = require("../models/NotasModel");

class Notas {
  constructor(db) {
    this.notas_model = new NotasModel(db);
  }

  getNotas(data) {
    return this.notas_model.getAll(data);
  }
}

module.exports = Notas;
