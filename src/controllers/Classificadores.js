const ClassificadoresModel = require("../models/ClassificadoresModel");

class Classificadores {
  constructor(db) {
    this.classificadores_model = new ClassificadoresModel(db);
  }

  getClassificadores(data) {
    return this.classificadores_model.getAll(data);
  }
}

module.exports = Classificadores;
