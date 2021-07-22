const TipoCacambasModel = require("../models/TipoCacambasModel");

class TipoCacambas {
  constructor(db) {
    this.tipo_cacambas_model = new TipoCacambasModel(db);
  }

  getTipoCacambas(data) {
    return this.tipo_cacambas_model.get(data);
  }
}

module.exports = TipoCacambas;
