const PrazosModel = require("../models/PrazosModel");

class Prazos {
  constructor(db) {
    this.prazos_model = new PrazosModel(db);
  }

  getPrazos(data) {
    return this.prazos_model.getAll(data);
  }
}

module.exports = Prazos;
