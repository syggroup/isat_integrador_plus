const SagiFormaPagtosModel = require("../models/SagiFormaPagtosModel");

class SagiFormaPagtos {
  constructor(db) {
    this.sagiFormaPagtos_model = new SagiFormaPagtosModel(db);
  }

  getSagiFormaPagtos(data) {
    return this.sagiFormaPagtos_model.getAll(data);
  }
}

module.exports = SagiFormaPagtos;
