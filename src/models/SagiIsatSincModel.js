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

  async delete({ type, token, column, table }) {
    await this.db.query("SET client_encoding TO 'SQL_ASCII'");
    const result = await this.db.query(`
      DELETE FROM sagi_isat_sinc AS a
      WHERE tipo='${type}' AND token='${token}' AND codigo in(SELECT z.${column} FROM ${table} AS z WHERE COALESCE(z.isat_sinc, false) = false)
    `);
    return result[1].rowCount;
  }
}

module.exports = SagiIsatSincModel;
