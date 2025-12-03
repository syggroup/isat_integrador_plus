const FuncionariosModel = require("../models/FuncionariosModel");

class Funcionarios {
  constructor(db) {
    this.funcionarios_model = new FuncionariosModel(db);
  }

  getFuncionarios(data) {
    return this.funcionarios_model.getAll(data);
  }
}

module.exports = Funcionarios;
