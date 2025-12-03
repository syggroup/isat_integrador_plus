class RegiaoModel {
  constructor(db) {
    this.db = db;
  }

  /*
    CREATE TABLE IF NOT EXISTS sagi_regiao
    (
      id BIGSERIAL,
      codreg NUMERIC(10) NOT NULL,
      nome CHARACTER VARYING(60) NOT NULL,
      id_cliente INTEGER NOT NULL,
      nivel CHARACTER VARYING(20) NOT NULL,
      id_sagi_senha INTEGER,
      cad_data DATE,
      CONSTRAINT pkey_sagi_regiao PRIMARY KEY (id),
      CONSTRAINT uq_sagi_regiao_cliente UNIQUE (codreg, id_cliente),
      CONSTRAINT fk_sagi_regiao_cliente FOREIGN KEY (id_cliente)
        REFERENCES cliente (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
    )
  */

  async getAll({ token }) {
    await this.db.query("SET client_encoding TO 'SQL_ASCII'");
    const result = await this.db.query(`
      SELECT a.codreg,
        tiraacento(trim(a.nome)) as nome,
        trim(a.nivel) as nivel,
        (select s.iduser from senha s where trim(a.cad_usuario) = trim(s.usuario) limit 1) as iduser,
        a.cad_data
      FROM regiao a
      WHERE a.codreg not in (select b.codigo from sagi_isat_sinc b where b.tipo='REGIAO' and b.token = '${token}')
      ORDER BY a.codreg
    `);
    return result[1].rows;
  }
}

module.exports = RegiaoModel;
