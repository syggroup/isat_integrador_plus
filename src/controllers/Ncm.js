const NcmModel = require("../models/NcmModel");

class Ncm {
  constructor(db) {
    this.ncm_model = new NcmModel(db);
  }

  getNcm(data) {
    return this.ncm_model.getAll(data);
  }
}

module.exports = Ncm;
