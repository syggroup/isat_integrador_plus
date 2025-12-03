class SagiUnidadesModel {
  constructor(db) {
    this.db = db;
  }

  /*
    CREATE TABLE IF NOT EXISTS sagi_lista_onu
    (
      id BIGSERIAL,
      onu_id NUMERIC(10) NOT NULL,
      codigo_onu NUMERIC(10) NOT NULL,
      classe_risco CHARACTER VARYING(10) NOT NULL,
      numero_risco NUMERIC(10) NOT NULL,
      descricao CHARACTER VARYING(100) NOT NULL,
      gru_emb CHARACTER VARYING(20) NOT NULL,
      data DATE NOT NULL,
      hora CHARACTER VARYING(8),
      id_cliente INTEGER NOT NULL,
      id_sagi_senha INTEGER,
      CONSTRAINT pkey_sagi_lista_onu PRIMARY KEY (id),
      CONSTRAINT uq_sagi_lista_onu_cliente UNIQUE (onu_id, id_cliente),
      CONSTRAINT fk_sagi_lista_onu_cliente FOREIGN KEY (id_cliente)
        REFERENCES cliente (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
    )
  */

  async getAll({ token }) {
    await this.db.query("SET client_encoding TO 'SQL_ASCII'");
    const result = await this.db.query(`
      SELECT a.id,
        a.codigo_onu,
        tiraacento(trim(a.classe_risco)) as classe_risco,
        a.numero_risco,
        tiraacento(trim(a.descricao)) as descricao,
        tiraacento(trim(a.gru_emb)) as gru_emb,
        (select s.iduser from senha s where trim(a.usuario) = trim(s.usuario) limit 1) as iduser,
        a.data,
        a.hora
      FROM sagi_lista_onu a
      WHERE a.id not in (select b.codigo from sagi_isat_sinc b where b.tipo='SAGI_LISTA_ONU' and b.token = '${token}')
      ORDER BY a.id
    `);
    return result[1].rows;
  }
}

module.exports = SagiUnidadesModel;
