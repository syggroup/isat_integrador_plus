const WeighingsModel = require("../models/WeighingsModel");

class Weighings {
  constructor(db) {
    this.weighings_model = new WeighingsModel(db);
  }

  insert(data) {
    return this.weighings_model.insert(data);
  }
}

module.exports = Weighings;
