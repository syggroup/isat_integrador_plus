class NcmModel {
  constructor(db) {
    this.db = db;
  }

  /*
    CREATE TABLE IF NOT EXISTS sagi_ncm
    (
      id BIGSERIAL,
      cod_ncm CHARACTER VARYING(10) NOT NULL,
      nome_ncm CHARACTER VARYING(80) NOT NULL,
      un_utrib CHARACTER VARYING(6) NOT NULL,
      id_cliente INTEGER NOT NULL,
      CONSTRAINT pkey_sagi_ncm PRIMARY KEY (id),
      CONSTRAINT uq_sagi_ncm_cliente UNIQUE (cod_ncm, id_cliente),
      CONSTRAINT fk_sagi_ncm_cliente FOREIGN KEY (id_cliente)
        REFERENCES cliente (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
    )
  */

  async getAll({ token }) {
    await this.db.query("SET client_encoding TO 'SQL_ASCII'");
    const result = await this.db.query(`
      SELECT trim(a.cod_ncm) as cod_ncm,
        tiraacento(trim(a.nome_ncm)) as nome_ncm,
        trim(a.un_utrib) as un_utrib,
        a.sr_recno
      FROM ncm a
      WHERE a.sr_recno not in (select b.codigo from sagi_isat_sinc b where b.tipo='NCM' and b.token = '${token}')
        AND trim(a.cod_ncm) ~ '^[0-9]+$'
      ORDER BY a.sr_recno
    `);
    return result[1].rows;
  }
}

module.exports = NcmModel;
