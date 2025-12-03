class SagiFormaPagtosModel {
  constructor(db) {
    this.db = db;
  }

  /*
    CREATE TABLE IF NOT EXISTS sagi_forma_pagto
    (
      id BIGSERIAL,
      codigo NUMERIC(10) NOT NULL,
      descricao CHARACTER VARYING(100) NOT NULL,
      pagrec CHARACTER VARYING(1) NOT NULL,
      mostra_banc BOOLEAN NOT NULL,
      mostra_forma BOOLEAN NOT NULL,
      usa_dinheiro BOOLEAN NOT NULL,
      libera_credito BOOLEAN NOT NULL,
      status CHARACTER VARYING(7) NOT NULL,
      eletronico NUMERIC(1) NOT NULL,
      forma_pix BOOLEAN NOT NULL,
      lim_desc_perc NUMERIC(5,2) NOT NULL,
      id_cliente INTEGER NOT NULL,
      CONSTRAINT pkey_sagi_forma_pagto PRIMARY KEY (id),
      CONSTRAINT uq_sagi_forma_pagto_cliente UNIQUE (codigo, id_cliente),
      CONSTRAINT fk_sagi_forma_pagto_cliente FOREIGN KEY (id_cliente)
        REFERENCES cliente (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
    )
  */

  async getAll({ token }) {
    await this.db.query("SET client_encoding TO 'SQL_ASCII'");
    const result = await this.db.query(`
      SELECT a.codigo,
        tiraacento(trim(a.descricao)) as descricao,
        a.pagrec,
        coalesce(a.mostra_banc, false) as mostra_banc,
        coalesce(a.mostra_forma, false) as mostra_forma,
        coalesce(a.usa_dinheiro, false) as usa_dinheiro,
        coalesce(a.libera_credito, false) as libera_credito,
        trim(a.status) as status,
        a.eletronico,
        coalesce(a.forma_pix, false) as forma_pix,
        a.lim_desc_perc
      FROM sagi_forma_pagto a
      WHERE a.codigo not in (select b.codigo from sagi_isat_sinc b where b.tipo='SAGI_FORMA_PAGTO' and b.token = '${token}')
      ORDER BY a.codigo
    `);
    return result[1].rows;
  }
}

module.exports = SagiFormaPagtosModel;
