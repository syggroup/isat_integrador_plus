const ConcorrentesModel = require("../models/ConcorrentesModel");

class Concorrentes {
  constructor(db) {
    this.concorrentes_model = new ConcorrentesModel(db);
  }

  getConcorrentes(data) {
    return this.concorrentes_model.get(data);
  }
}

module.exports = Concorrentes;
