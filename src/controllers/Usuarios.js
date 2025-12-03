const UsuariosModel = require("../models/UsuariosModel");

class Usuarios {
  constructor(db) {
    this.usuarios_model = new UsuariosModel(db);
  }

  getUsuarios(data) {
    return this.usuarios_model.getAll(data);
  }
}

module.exports = Usuarios;
