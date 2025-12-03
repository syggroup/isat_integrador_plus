class CentroDeCustosModel {
  constructor(db) {
    this.db = db;
  }

  /*
    CREATE TABLE IF NOT EXISTS sagi_cag_cdc (
      id BIGSERIAL,
      cag_cdc_id NUMERIC(10,0) NOT NULL NOT NULL,
      codcdc CHARACTER VARYING(20) NOT NULL,
      descdc CHARACTER VARYING(90) NOT NULL,
      caminho_cdc TEXT NOT NULL,
      tipcdc CHARACTER(1),
      percdc NUMERIC(5,2) NOT NULL,
      obscdc TEXT,
      datcdc DATE,
      horcdc CHARACTER VARYING(8),
      bcacdc NUMERIC(12,2) NOT NULL,
      psbcdc NUMERIC(18,3) NOT NULL,
      principal BOOLEAN NOT NULL,
      ativo CHARACTER(10) NOT NULL,
      pro001 CHARACTER VARYING(20),
      bca001 NUMERIC(12,2) NOT NULL,
      pro002 CHARACTER VARYING(20),
      bca002 NUMERIC(12,2) NOT NULL,
      pro003 CHARACTER VARYING(20),
      bca003 NUMERIC(12,2) NOT NULL,
      pro004 CHARACTER VARYING(20),
      bca004 NUMERIC(12,2) NOT NULL,
      pro005 CHARACTER VARYING(20),
      bca005 NUMERIC(12,2) NOT NULL,
      pro006 CHARACTER VARYING(20),
      bca006 NUMERIC(12,2) NOT NULL,
      pro007 CHARACTER VARYING(20),
      bca007 NUMERIC(12,2) NOT NULL,
      pro008 CHARACTER VARYING(20),
      bca008 NUMERIC(12,2) NOT NULL,
      pro009 CHARACTER VARYING(20),
      bca009 NUMERIC(12,2) NOT NULL,
      pro010 CHARACTER VARYING(20),
      bca010 NUMERIC(12,2) NOT NULL,
      pro011 CHARACTER VARYING(20),
      bca011 NUMERIC(12,2) NOT NULL,
      pro012 CHARACTER VARYING(20),
      bca012 NUMERIC(12,2) NOT NULL,
      habilita BOOLEAN NOT NULL,
      alterdata CHARACTER(10),
      cod_dtc NUMERIC(10,0),
      flag_orca BOOLEAN NOT NULL,
      oculta_dre BOOLEAN NOT NULL,
      usa_imobilizado BOOLEAN NOT NULL,
      ret_socio BOOLEAN NOT NULL,
      cdc_validade_inicio DATE,
      cdc_validade_fim DATE,
      cdc_codigo_gov CHARACTER VARYING(20),
      fixa_var CHARACTER(1),
      posicao NUMERIC(10,0) NOT NULL,
      oculta_fortes BOOLEAN NOT NULL,
      cdc_usa_fantasia BOOLEAN NOT NULL,
      cdc_fantasia CHARACTER VARYING(90),
      id_sagi_senha INTEGER,
      id_cliente INTEGER NOT NULL,
      id_filial INTEGER NOT NULL,
      CONSTRAINT pkey_cag_cdc PRIMARY KEY (id),
      CONSTRAINT uq_cag_cdc_cliente UNIQUE (cag_cdc_id, id_cliente),
      CONSTRAINT fk_cag_cdc_filiais FOREIGN KEY (id_filial)
        REFERENCES filiais (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
      CONSTRAINT fk_cag_cdc_cliente FOREIGN KEY (id_cliente)
        REFERENCES cliente (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
    );
  */

  async getAll({ token }) {
    await this.db.query("SET client_encoding TO 'SQL_ASCII'");
    const result = await this.db.query(`
      SELECT a.cag_cdc_id,
        trim(a.codcdc) as codcdc,
        trim(a.descdc) as descdc,
        trim(a.caminho_cdc) as caminho_cdc,
        a.tipcdc,
        a.percdc,
        trim(a.obscdc) as obscdc,
        case when trim(a.empcdc) <> '' then trim(a.empcdc) else 'TODAS' end as filial,
        (select s.iduser from senha s where trim(a.usecdc) = trim(s.usuario) limit 1) as iduser,
        a.datcdc,
        case when trim(a.horcdc) <> '' then trim(a.horcdc) else null end as horcdc,
        a.bcacdc,
        a.psbcdc,
        coalesce(a.principal, false) as principal,
        trim(a.ativo) as ativo,
        trim(a.pro001) as pro001,
        a.bca001,
        trim(a.pro002) as pro002,
        a.bca002,
        trim(a.pro003) as pro003,
        a.bca003,
        trim(a.pro004) as pro004,
        a.bca004,
        trim(a.pro005) as pro005,
        a.bca005,
        trim(a.pro006) as pro006,
        a.bca006,
        trim(a.pro007) as pro007,
        a.bca007,
        trim(a.pro008) as pro008,
        a.bca008,
        trim(a.pro009) as pro009,
        a.bca009,
        trim(a.pro010) as pro010,
        a.bca010,
        trim(a.pro011) as pro011,
        a.bca011,
        trim(a.pro012) as pro012,
        a.bca012,
        coalesce(a.habilita, false) as habilita,
        trim(a.alterdata) as alterdata,
        a.cod_dtc,
        coalesce(a.flag_orca, false) as flag_orca,
        coalesce(a.oculta_dre, false) as oculta_dre,
        coalesce(a.usa_imobilizado, false) as usa_imobilizado,
        coalesce(a.ret_socio, false) as ret_socio,
        a.cdc_validade_inicio,
        a.cdc_validade_fim,
        trim(a.cdc_codigo_gov) as cdc_codigo_gov,
        a.fixa_var,
        a.posicao,
        coalesce(a.oculta_fortes, false) as oculta_fortes,
        coalesce(a.cdc_usa_fantasia, false) as cdc_usa_fantasia,
        trim(a.cdc_fantasia) as cdc_fantasia
      FROM cag_cdc a
      WHERE a.cag_cdc_id not in (select b.codigo from sagi_isat_sinc b where b.tipo='CAG_CDC' and b.token = '${token}')
      ORDER BY a.cag_cdc_id
    `);
    return result[1].rows;
  }
}

module.exports = CentroDeCustosModel;
