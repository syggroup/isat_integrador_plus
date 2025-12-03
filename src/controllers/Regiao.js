const RegiaoModel = require("../models/RegiaoModel");

class Regiao {
  constructor(db) {
    this.regiao_model = new RegiaoModel(db);
  }

  getRegiao(data) {
    return this.regiao_model.getAll(data);
  }
}

module.exports = Regiao;
