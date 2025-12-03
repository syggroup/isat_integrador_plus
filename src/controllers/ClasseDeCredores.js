const ClasseDeCredoresModel = require("../models/ClasseDeCredoresModel");

class ClasseDeCredores {
  constructor(db) {
    this.classe_de_credores_model = new ClasseDeCredoresModel(db);
  }

  getClasseDeCredores(data) {
    return this.classe_de_credores_model.getAll(data);
  }
}

module.exports = ClasseDeCredores;
