class DadosModel {
  constructor(db) {
    this.db = db;
  }

  async get() {
    await this.db.query("SET client_encoding TO 'SQL_ASCII'");
    const result = await this.db.query(
      "SELECT gps_aberto, filiais, nomegeral FROM dados"
    );
    return result[1].rows;
  }

  async set({ datetime }) {
    await this.db.query("SET client_encoding TO 'SQL_ASCII'");
    const result = await this.db.query(
      `UPDATE dados SET gps_aberto = '${datetime}'`
    );
    return result[1].rowCount;
  }

  async getForcaAtualizacao() {
    await this.db.query("SET client_encoding TO 'SQL_ASCII'");
    const result = await this.db.query("SELECT forca_atua FROM dados");
    return result[1].rows[0].forca_atua;
  }

  async getNomeGeral() {
    await this.db.query("SET client_encoding TO 'SQL_ASCII'");
    const result = await this.db.query("SELECT nomegeral FROM dados");
    return result[1].rows[0].nomegeral;
  }
}

module.exports = DadosModel;
