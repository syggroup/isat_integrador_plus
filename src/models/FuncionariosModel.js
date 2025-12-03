class FuncionariosModel {
  constructor(db) {
    this.db = db;
  }

  /*
    CREATE TABLE IF NOT EXISTS sagi_cag_fun
    (
      id BIGSERIAL,
      cod NUMERIC(10) NOT NULL,
      nom CHARACTER VARYING(100) NOT NULL,
      status CHARACTER VARYING(20) NOT NULL,
      id_sagi_senha INTEGER,
      datacad DATE NOT NULL,
      id_cliente INTEGER NOT NULL,
      id_filial INTEGER NOT NULL,
      CONSTRAINT pkey_sagi_cag_fun PRIMARY KEY (id),
      CONSTRAINT uq_sagi_cag_fun_cliente UNIQUE (cod, id_cliente),
      CONSTRAINT fk_sagi_cag_fun_filiais FOREIGN KEY (id_filial)
        REFERENCES filiais (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
      CONSTRAINT fk_sagi_cag_fun_cliente FOREIGN KEY (id_cliente)
        REFERENCES cliente (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
    )
  */

  async getAll({ token }) {
    await this.db.query("SET client_encoding TO 'SQL_ASCII'");
    const result = await this.db.query(`
      SELECT a.cod,
        tiraacento(trim(a.nom)) as nom,
        trim(a.status) as status,
        (select s.iduser from senha s where trim(a.cad_usuario) = trim(s.usuario) limit 1) as iduser,
        a.datacad,
        case when trim(a.empresa) <> '' then trim(a.empresa) else 'TODAS' end as filial
      FROM cag_fun a
      WHERE a.cod not in (select b.codigo from sagi_isat_sinc b where b.tipo='CAG_FUN' and b.token = '${token}')
      ORDER BY a.cod
    `);
    return result[1].rows;
  }
}

module.exports = FuncionariosModel;
