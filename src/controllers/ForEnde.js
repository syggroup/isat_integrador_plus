const ForEndeModel = require("../models/ForEndeModel");

class ForEnde {
  constructor(db) {
    this.forEnde_model = new ForEndeModel(db);
  }

  getForsEndes(data) {
    return this.forEnde_model.get(data);
  }
}

module.exports = ForEnde;
