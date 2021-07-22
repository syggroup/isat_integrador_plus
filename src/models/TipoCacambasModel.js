class TipoCacambasModel {
  constructor(db) {
    this.db = db;
  }

  async get({ token }) {
    await this.db.query("SET client_encoding TO 'SQL_ASCII'");
    const result = await this.db.query(`
      SELECT a.id::text,
        a.descricao,
        coalesce(c.sr_recno, 0) > 0 as atualizado
      FROM sagi_tipo_container a
      LEFT JOIN sagi_isat_sinc c ON c.tipo='SAGI_TIPO_CONTAINER'
        AND c.codigo=a.id
        AND c.token = '${token}'
    `);
    return result[1].rows;
  }
}

module.exports = TipoCacambasModel;
