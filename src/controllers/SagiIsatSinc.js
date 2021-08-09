const SagiIsatSincModel = require("../models/SagiIsatSincModel");

class SagiIsatSinc {
  constructor(db) {
    this.sagiIsatSinc_model = new SagiIsatSincModel(db);
  }

  insert(data) {
    return this.sagiIsatSinc_model.insert(data);
  }
}

module.exports = SagiIsatSinc;
