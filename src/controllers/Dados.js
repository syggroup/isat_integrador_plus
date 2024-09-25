const DadosModel = require("../models/DadosModel");

class Dados {
  constructor(db) {
    this.dados_model = new DadosModel(db);
  }

  getDados() {
    return this.dados_model.get();
  }

  setDados(data) {
    return this.dados_model.set(data);
  }

  getForcaAtualizacao() {
    return this.dados_model.getForcaAtualizacao();
  }

  getNomeGeral() {
    return this.dados_model.getNomeGeral();
  }

  getCountMenuPermissa(idfuncao) {
    return this.dados_model.getCountMenuPermissa(idfuncao);
  }

  getFunctionExists(nome_funcao) {
    return this.dados_model.getFunctionExists(nome_funcao);
  }
}

module.exports = Dados;
