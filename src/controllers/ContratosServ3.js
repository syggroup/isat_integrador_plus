const ContratosServ3Model = require("../models/ContratosServ3Model");

class ContratosServ3 {
  constructor(db) {
    this.contratos_serv3_model = new ContratosServ3Model(db);
  }

  getContratos(data) {
    return this.contratos_serv3_model.getAll(data);
  }
}

module.exports = ContratosServ3;
