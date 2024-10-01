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

  getCacambasWithChr13OrChr10() {
    return this.cacambas_model.getWithChr13OrChr10();
  }

  updateCacambasWithChr13OrChr10() {
    return this.cacambas_model.updateWithChr13OrChr10();
  }
}

module.exports = Cacambas;
