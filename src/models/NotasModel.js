class NotasModel {
  constructor(db) {
    this.db = db;
  }

  async getAll({ token }) {
    await this.db.query("SET client_encoding TO 'SQL_ASCII'");
    const result = await this.db.query(`
      SELECT *
      FROM sagi_nf a
      WHERE a.sr_recno not in (select b.codigo from sagi_isat_sinc b where b.tipo='SAGI_NF' and b.token = '${token}')
      ORDER BY a.sr_recno
    `);
    return result[1].rows;
  }
}

module.exports = NotasModel;
