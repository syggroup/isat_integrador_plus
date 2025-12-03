class SetoresModel {
  constructor(db) {
    this.db = db;
  }

  /*
    CREATE TABLE IF NOT EXISTS sagi_setor
    (
      id BIGSERIAL,
      codset NUMERIC(10) NOT NULL,
      setor CHARACTER VARYING(100) NOT NULL,
      bloquear_preco_orcamento BOOLEAN NOT NULL,
      id_sagi_senha INTEGER,
      cad_data DATE,
      init_ped_ven_bloq BOOLEAN NOT NULL,
      status CHARACTER VARYING(7) NOT NULL,
      id_sagi_unidade INTEGER,
      id_cliente INTEGER NOT NULL,
      CONSTRAINT pkey_sagi_setor PRIMARY KEY (id),
      CONSTRAINT uq_sagi_setor_cliente UNIQUE (codset, id_cliente),
      CONSTRAINT fk_sagi_setor_sagi_unidade FOREIGN KEY (id_sagi_unidade)
        REFERENCES sagi_unidade (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
      CONSTRAINT fk_sagi_setor_cliente FOREIGN KEY (id_cliente)
        REFERENCES cliente (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
    )
  */

  async getAll({ token }) {
    await this.db.query("SET client_encoding TO 'SQL_ASCII'");
    const result = await this.db.query(`
      SELECT a.codset,
        tiraacento(trim(a.setor)) as setor,
        coalesce(a.bloquear_preco_orcamento, false) as bloquear_preco_orcamento,
        (select s.iduser from senha s where trim(a.cad_usuario) = trim(s.usuario) limit 1) as iduser,
        a.cad_data,
        coalesce(a.init_ped_ven_bloq, false) as init_ped_ven_bloq,
        trim(a.status) as status,
        case when a.unidade_principal = 0 then null else a.unidade_principal end as unidade_principal
      FROM setor a
      WHERE a.codset not in (select b.codigo from sagi_isat_sinc b where b.tipo='SETOR' and b.token = '${token}')
      ORDER BY a.codset
    `);
    return result[1].rows;
  }
}

module.exports = SetoresModel;
