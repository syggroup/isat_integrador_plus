class ClassificadoresModel {
  constructor(db) {
    this.db = db;
  }

  /*
    CREATE TABLE IF NOT EXISTS sagi_classifica
    (
      id BIGSERIAL,
      codigo NUMERIC(10) NOT NULL,
      nome CHARACTER VARYING(40) NOT NULL,
      id_filial INTEGER NOT NULL,
      id_cliente INTEGER NOT NULL,
      status CHARACTER VARYING(10) NOT NULL,
      id_sagi_senha INTEGER,
      cad_data DATE,
      CONSTRAINT pkey_sagi_classifica PRIMARY KEY (id),
      CONSTRAINT uq_sagi_classifica_cliente UNIQUE (codigo, id_cliente),
      CONSTRAINT fk_sagi_classifica_filiais FOREIGN KEY (id_filial)
        REFERENCES filiais (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
      CONSTRAINT fk_sagi_classifica_cliente FOREIGN KEY (id_cliente)
        REFERENCES cliente (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
    )
  */

  async getAll({ token }) {
    await this.db.query("SET client_encoding TO 'SQL_ASCII'");
    const result = await this.db.query(`
      SELECT a.codigo,
        tiraacento(trim(a.nome)) as nome,
        case when trim(a.empresa) <> '' then trim(a.empresa) else 'TODAS' end as filial,
        trim(a.status) as status,
        (select s.iduser from senha s where trim(a.cad_usuario) = trim(s.usuario) limit 1) as iduser,
        a.cad_data
      FROM classifica a
      WHERE a.codigo not in (select b.codigo from sagi_isat_sinc b where b.tipo='CLASSIFICA' and b.token = '${token}')
      ORDER BY a.codigo
    `);
    return result[1].rows;
  }
}

module.exports = ClassificadoresModel;
