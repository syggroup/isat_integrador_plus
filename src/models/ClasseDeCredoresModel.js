class ClasseDeCredoresModel {
  constructor(db) {
    this.db = db;
  }

  /*
    CREATE TABLE IF NOT EXISTS sagi_classes
    (
      id BIGSERIAL,
      cod_clas NUMERIC(6) NOT NULL,
      classe CHARACTER VARYING(35) NOT NULL,
      cad_aut_class BOOLEAN NOT NULL,
      id_cliente INTEGER NOT NULL,
      CONSTRAINT pkey_sagi_classes PRIMARY KEY (id),
      CONSTRAINT uq_sagi_classes_cliente UNIQUE (cod_clas, id_cliente),
      CONSTRAINT fk_sagi_classes_cliente FOREIGN KEY (id_cliente)
        REFERENCES cliente (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
    )
  */

  async getAll({ token }) {
    await this.db.query("SET client_encoding TO 'SQL_ASCII'");
    const result = await this.db.query(`
      SELECT a.cod_clas,
        tiraacento(trim(a.classe)) as classe,
        coalesce(a.cad_aut_class, false) as cad_aut_class
      FROM classes a
      WHERE a.cod_clas not in (select b.codigo from sagi_isat_sinc b where b.tipo='CLASSES' and b.token = '${token}')
      ORDER BY a.cod_clas
    `);
    return result[1].rows;
  }
}

module.exports = ClasseDeCredoresModel;
