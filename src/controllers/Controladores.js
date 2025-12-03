const ControladoresModel = require("../models/ControladoresModel");

class Checklist {
  constructor(db) {
    this.controladores_model = new ControladoresModel(db);
  }

  getControladores(data) {
    return this.controladores_model.getAll(data);
  }
}

module.exports = Checklist;
