const SagiListaOnuModel = require("../models/SagiListaOnuModel");

class SagiListaOnu {
  constructor(db) {
    this.sagiListaOnu_model = new SagiListaOnuModel(db);
  }

  getSagiListaOnu(data) {
    return this.sagiListaOnu_model.getAll(data);
  }
}

module.exports = SagiListaOnu;
