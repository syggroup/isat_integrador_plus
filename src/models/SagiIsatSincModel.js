class SagiIsatSincModel {
  constructor(db) {
    this.db = db;
  }

  async getSrRecnoFromContaine(codigo) {
    await this.db.query("SET client_encoding TO 'SQL_ASCII'");
    const result = await this.db.query(
      `SELECT sr_recno FROM containe WHERE numero = '${codigo}' LIMIT 1`
    );
    return result[1].rows[0].sr_recno;
  }

  async insert({ codigo, type, token }) {
    await this.db.query("SET client_encoding TO 'SQL_ASCII'");

    if (type !== "CONTAINE") {
      const result = await this.db.query(
        `INSERT INTO sagi_isat_sinc (codigo, tipo, token) VALUES (${codigo}, '${type}', '${token}')`
      );
      return result[1].rowCount;
    } else {
      const sr_recno = await this.getSrRecnoFromContaine(codigo);
      const result = await this.db.query(
        `INSERT INTO sagi_isat_sinc (codigo, tipo, token) VALUES (${sr_recno}, '${type}', '${token}')`
      );
      return result[1].rowCount;
    }
  }
}

module.exports = SagiIsatSincModel;
