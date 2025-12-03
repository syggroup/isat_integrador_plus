class TipoDeProdutosModel {
  constructor(db) {
    this.db = db;
  }

  /*
    CREATE TABLE IF NOT EXISTS sagi_tipo_pro
    (
      id BIGSERIAL,
      id_tipo_pro NUMERIC(10,0) NOT NULL,
      codigo CHARACTER VARYING(2) NOT NULL,
      descricao CHARACTER VARYING(60) NOT NULL,
      id_cliente INTEGER NOT NULL,
      CONSTRAINT pkey_sagi_tipo_pro PRIMARY KEY (id),
      CONSTRAINT uq_sagi_tipo_pro_cliente UNIQUE (id_tipo_pro, id_cliente),
      CONSTRAINT fk_sagi_tipo_pro_cliente FOREIGN KEY (id_cliente)
        REFERENCES cliente (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
    )
  */

  async get({ token }) {
    await this.db.query("SET client_encoding TO 'SQL_ASCII'");
    const result = await this.db.query(`
      SELECT a.id as id_tipo_pro,
        trim(a.codigo) as codigo,
        tiraacento(trim(a.descricao)) as descricao
      FROM sagi_tipo_pro a
      WHERE a.id not in (select b.codigo from sagi_isat_sinc b where b.tipo='SAGI_TIPO_PRO' and b.token = '${token}')
      ORDER BY a.id
    `);
    return result[1].rows;
  }
}

module.exports = TipoDeProdutosModel;
