const ClientesModel = require("../models/ClientesModel");

class Clientes {
  constructor(db) {
    this.clientes_model = new ClientesModel(db);
  }

  setIsatSinc(data) {
    return this.clientes_model.setIsatSinc(data);
  }

  getClientes(data) {
    return this.clientes_model.get(data);
  }
}

module.exports = Clientes;
