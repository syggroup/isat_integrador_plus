const ParametrosModel = require("../models/ParametrosModel");

class Parametros {
  constructor(db) {
    this.parametros_model = new ParametrosModel(db);
  }

  async getTokens(data) {
    const tokens = await this.parametros_model.getTokens(data);
    const tokens_ok = [];

    tokens.forEach((token) => {
      if (
        token.usa === ".T." &&
        token.token &&
        !tokens_ok.includes(token.token)
      ) {
        tokens_ok.push(token);
      }
    });

    return tokens_ok;
  }
}

module.exports = Parametros;
