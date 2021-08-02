const ParametrosModel = require("../models/ParametrosModel");

class Parametros {
  constructor(db) {
    this.parametros_model = new ParametrosModel(db);
  }

  async getTokens(data) {
    return (await this.parametros_model.getTokens(data)).filter(
      (token) => token.usa === ".T." && token.token
    );
  }

  setToken(data) {
    const { token, filial } = data;

    if (filial !== "TODAS") {
      return this.parametros_model.setToken(data);
    } else {
      return this.parametros_model.setAllTokens(data);
    }
  }

  /* async checkParameterOdometer() {
    let parameter = await this.parametros_model.checkParameterOdometer();

    if (parameter.length === 0) {
      parameter = await this.parametros_model.createParameterOdometer();
    }
    console.log(parameter);
    return parameter;
  } */
}

module.exports = Parametros;
