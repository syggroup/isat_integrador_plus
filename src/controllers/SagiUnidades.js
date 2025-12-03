const SagiUnidadesModel = require("../models/SagiUnidadesModel");

class SagiUnidades {
  constructor(db) {
    this.sagiUnidades_model = new SagiUnidadesModel(db);
  }

  getSagiUnidades(data) {
    return this.sagiUnidades_model.getAll(data);
  }
}

module.exports = SagiUnidades;
