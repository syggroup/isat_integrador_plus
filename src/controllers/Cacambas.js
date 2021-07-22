const CacambasModel = require("../models/CacambasModel");

class Cacambas {
  constructor(db) {
    this.cacambas_model = new CacambasModel(db);
  }

  getCacambas(data) {
    return this.cacambas_model.get(data);
  }

  update(data) {
    return this.cacambas_model.update(data);
  }
}

module.exports = Cacambas;
