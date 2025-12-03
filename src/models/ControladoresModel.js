class ControladoresModel {
  constructor(db) {
    this.db = db;
  }

  /*
    CREATE TABLE IF NOT EXISTS sagi_orgao_ambiental
    (
      id BIGSERIAL,
      orgao_ambiental_id NUMERIC(10) NOT NULL,
      descricao CHARACTER VARYING(255) NOT NULL,
      id_sagi_senha INTEGER,
      data DATE NOT NULL,
      hora CHARACTER VARYING(10) NOT NULL,
      id_cliente INTEGER NOT NULL,
      CONSTRAINT pkey_sagi_orgao_ambiental PRIMARY KEY (id),
      CONSTRAINT uq_sagi_orgao_ambiental_cliente UNIQUE (orgao_ambiental_id, id_cliente),
      CONSTRAINT fk_sagi_orgao_ambiental_cliente FOREIGN KEY (id_cliente)
        REFERENCES cliente (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
    )
  */

  async getAll({ token }) {
    await this.db.query("SET client_encoding TO 'SQL_ASCII'");
    const result = await this.db.query(`
      SELECT a.id as orgao_ambiental_id,
        tiraacento(trim(a.descricao)) as descricao,
        (select s.iduser from senha s where trim(a.usuario) = trim(s.usuario) limit 1) as iduser,
        a.data,
        coalesce(trim(a.hora), '') as hora
      FROM sagi_orgao_ambiental a
      WHERE a.id not in (select b.codigo from sagi_isat_sinc b where b.tipo='SAGI_ORGAO_AMBIENTAL' and b.token = '${token}')
      ORDER BY a.id
    `);
    return result[1].rows;
  }
}

module.exports = ControladoresModel;
