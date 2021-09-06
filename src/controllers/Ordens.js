const OrdensModel = require("../models/OrdensModel");

class Ordens {
  constructor(db) {
    this.ordens_model = new OrdensModel(db);
  }

  getOrdens(data) {
    return this.ordens_model.get(data);
  }

  getOrdensForUpdateStatus(data) {
    return this.ordens_model.getForUpdateStatus(data);
  }

  updateForDelete(data) {
    return this.ordens_model.updateForDelete(data);
  }

  updateForDelete2() {
    return this.ordens_model.updateForDelete2();
  }

  delete(data) {
    return this.ordens_model.delete(data);
  }

  treatCheck(data) {
    return this.ordens_model.treatCheck(data);
  }

  treatImprevisto(data) {
    return this.ordens_model.treatImprevisto(data);
  }

  treatCacamba(data) {
    return this.ordens_model.treatCacamba(data);
  }

  treatKm(data) {
    return this.ordens_model.treatKm(data);
  }

  setInitialDateTime(data) {
    return this.ordens_model.setInitialDateTime(data);
  }

  retornoIsat(data) {
    return this.ordens_model.retornoIsat(data);
  }
}

module.exports = Ordens;
