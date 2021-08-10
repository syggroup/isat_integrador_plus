const ClientesModel = require("../models/ClientesModel");

class Clientes {
  constructor(db) {
    this.clientes_model = new ClientesModel(db);
  }

  getClientes(data) {
    return this.clientes_model.getAll(data);
  }

  getCliente(data) {
    return this.clientes_model.get(data);
  }
}

module.exports = Clientes;
