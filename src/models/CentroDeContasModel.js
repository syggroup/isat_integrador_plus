class CentroDeContasModel {
  constructor(db) {
    this.db = db;
  }

  /*
    CREATE TABLE IF NOT EXISTS sagi_centro
    (
      id BIGSERIAL,
      centro_id NUMERIC(10) NOT NULL,
      centro_codigo NUMERIC(10) NOT NULL,
      centro_descricao CHARACTER VARYING(100) NOT NULL,
      centro_data DATE,
      codigo CHARACTER VARYING(20) NOT NULL,
      caminho TEXT NOT NULL,
      status CHARACTER VARYING(10) NOT NULL,
      centro_natureza CHARACTER VARYING(1) NOT NULL,
      responsavel CHARACTER VARYING(30) NOT NULL,
      classe CHARACTER VARYING(30) NOT NULL,
      id_filial INTEGER NOT NULL,
      tipo CHARACTER VARYING(10),
      nivel NUMERIC(10),
      nao_usar BOOLEAN,
      id_sagi_senha INTEGER,
      id_cliente INTEGER NOT NULL,
      CONSTRAINT pkey_sagi_centro PRIMARY KEY (id),
      CONSTRAINT uq_sagi_centro_cliente UNIQUE (centro_id, id_cliente),
      CONSTRAINT fk_sagi_centro_filiais FOREIGN KEY (id_filial)
        REFERENCES filiais (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
      CONSTRAINT fk_sagi_centro_cliente FOREIGN KEY (id_cliente)
        REFERENCES cliente (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
    )
  */

  async getAll({ token }) {
    await this.db.query("SET client_encoding TO 'SQL_ASCII'");
    const result = await this.db.query(`
      SELECT a.centro_id,
        a.centro_codigo,
        tiraacento(trim(a.centro_descricao)) as descricao,
        a.centro_data,
        (select s.iduser from senha s where trim(a.centro_usuario) = trim(s.usuario) limit 1) as iduser,
        trim(a.codigo) as codigo,
        tiraacento(trim(a.caminho)) as caminho,
        trim(a.status) as status,
        tiraacento(trim(a.centro_natureza)) as centro_natureza,
        tiraacento(trim(a.responsavel)) as responsavel,
        tiraacento(trim(a.classe)) as classe,
        case when trim(a.empcen) <> '' then trim(a.empcen) else 'TODAS' end as filial,
        coalesce(tiraacento(trim(a.tipo)), '') as tipo,
        coalesce(a.nivel, 0) as nivel,
        coalesce(a.nao_usar, false) as nao_usar
      FROM sagi_centro a
      WHERE a.centro_id not in (select b.codigo from sagi_isat_sinc b where b.tipo='SAGI_CENTRO' and b.token = '${token}')
      ORDER BY a.centro_id
    `);
    return result[1].rows;
  }
}

module.exports = CentroDeContasModel;
