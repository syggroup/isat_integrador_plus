class VendedoresModel {
  constructor(db) {
    this.db = db;
  }

  /*
    CREATE TABLE IF NOT EXISTS sagi_cag_vnd
    (
      id BIGSERIAL,
      codvnd NUMERIC(6) NOT NULL,
      vendedor CHARACTER VARYING(60) NOT NULL,
      apelido CHARACTER VARYING(30) NOT NULL,
      fone CHARACTER VARYING(14) NOT NULL,
      fone2 CHARACTER VARYING(14) NOT NULL,
      cel CHARACTER VARYING(14) NOT NULL,
      nextel CHARACTER VARYING(15) NOT NULL,
      ende CHARACTER VARYING(60) NOT NULL,
      bairro CHARACTER VARYING(40) NOT NULL,
      cidade CHARACTER VARYING(35) NOT NULL,
      uf CHARACTER VARYING(2) NOT NULL,
      ende1 CHARACTER VARYING(60) NOT NULL,
      bairro1 CHARACTER VARYING(40) NOT NULL,
      cidade1 CHARACTER VARYING(35) NOT NULL,
      uf1 CHARACTER VARYING(2) NOT NULL,
      cep CHARACTER VARYING(8) NOT NULL,
      cep1 CHARACTER VARYING(8) NOT NULL,
      tip CHARACTER VARYING(1) NOT NULL,
      cpf_cnpj CHARACTER VARYING(20),
      iest CHARACTER VARYING(12) NOT NULL,
      rg CHARACTER VARYING(12) NOT NULL,
      banco CHARACTER VARYING(40) NOT NULL,
      conta CHARACTER VARYING(20) NOT NULL,
      agencia CHARACTER VARYING(30) NOT NULL,
      email CHARACTER VARYING(80) NOT NULL,
      site CHARACTER VARYING(80) NOT NULL,
      prazo NUMERIC(10,0) NOT NULL,
      data_cad DATE NOT NULL,
      obs CHARACTER VARYING(500) NOT NULL,
      fpg_comiss NUMERIC(10,0) NOT NULL,
      tp_comiss CHARACTER VARYING(20) NOT NULL,
      percomis_min NUMERIC(5,2) NOT NULL,
      percomis_max NUMERIC(5,2) NOT NULL,
      status CHARACTER VARYING(20) NOT NULL,
      cod_pais NUMERIC(10,0) NOT NULL,
      cod_pais1 NUMERIC(10,0) NOT NULL,
      gerar_comissao_nao_recebida BOOLEAN NOT NULL,
      id_sagi_cag_cdc INTEGER,
      id_sagi_cag_cre INTEGER,
      id_cidade INTEGER,
      id_cliente INTEGER NOT NULL,
      id_filial INTEGER NOT NULL,
      id_sagi_senha INTEGER,
      CONSTRAINT pkey_sagi_cag_vnd PRIMARY KEY (id),
      CONSTRAINT uq_sagi_cag_vnd_cliente UNIQUE (codvnd, id_cliente),
      CONSTRAINT fk_sagi_cag_vnd_cliente FOREIGN KEY (id_cliente)
        REFERENCES cliente (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
      CONSTRAINT fk_sagi_cag_vnd_filiais FOREIGN KEY (id_filial)
        REFERENCES filiais (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
      CONSTRAINT fk_sagi_cag_vnd_cidade FOREIGN KEY (id_cidade)
        REFERENCES cidade (id) MATCH FULL
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
      CONSTRAINT fk_sagi_cag_vnd_sagi_cag_cre FOREIGN KEY (id_sagi_cag_cre)
        REFERENCES referencias (id) MATCH FULL
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
      CONSTRAINT fk_sagi_cag_vnd_sagi_cag_cdc FOREIGN KEY (id_sagi_cag_cdc)
        REFERENCES sagi_cag_cdc (id) MATCH FULL
        ON UPDATE NO ACTION
        ON DELETE CASCADE
    )
  */

  async getAll({ token }) {
    await this.db.query("SET client_encoding TO 'SQL_ASCII'");
    const result = await this.db.query(`
      SELECT a.codvnd,
        tiraacento(trim(a.vendedor)) as vendedor,
        tiraacento(trim(a.apelido)) as apelido,
        regexp_replace(ltrim(trim(a.fone), '0'), '\\D', '', 'g') as fone,
        regexp_replace(ltrim(trim(a.fone2), '0'), '\\D', '', 'g') as fone2,
        regexp_replace(ltrim(trim(a.cel), '0'), '\\D', '', 'g') as cel,
        regexp_replace(ltrim(trim(a.nextel), '0'), '\\D', '', 'g') as nextel,
        tiraacento(trim(a.ende)) as ende,
        tiraacento(trim(a.bairro)) as bairro,
        tiraacento(trim(a.cidade)) as cidade,
        a.uf,
        tiraacento(trim(a.ende1)) as ende1,
        tiraacento(trim(a.bairro1)) as bairro1,
        tiraacento(trim(a.cidade1)) as cidade1,
        a.uf1,
        trim(a.cep) as cep,
        trim(a.cep1) as cep1,
        trim(a.tip) as tip,
        case when trim(a.tip) = 'F' then regexp_replace(trim(a.cpf), '\\D', '', 'g') else regexp_replace(trim(a.cgc), '\\D', '', 'g') end as cpf_cnpj,
        trim(a.iest) as iest,
        trim(a.rg) as rg,
        trim(a.banco) as banco,
        trim(a.conta) as conta,
        trim(a.agencia) as agencia,
        trim(a.email) as email,
        trim(a.site) as site,
        a.prazo,
        a.data_cad,
        (select s.iduser from senha s where trim(a.cad_usuario) = trim(s.usuario) limit 1) as iduser,
        tiraacento(trim(a.obs)) as obs,
        case when a.numcid = 0 then null else a.numcid end as numcid,
        a.fpg_comiss,
        a.tp_comiss,
        a.percomis_min,
        a.percomis_max,
        case when a.codcre = 0 then null else a.codcre end as codcre,
        (select cdc.cag_cdc_id from cag_cdc cdc where trim(a.codcdc) = trim(cdc.codcdc) limit 1) as codcdc,
        case when trim(a.empresa) <> '' then trim(a.empresa) else 'TODAS' end as filial,
        trim(a.status) as status,
        a.cod_pais,
        a.cod_pais1,
        coalesce(a.gerar_comissao_nao_recebida, false) as gerar_comissao_nao_recebida
      FROM cag_vnd a
      WHERE a.codvnd not in (select b.codigo from sagi_isat_sinc b where b.tipo='CAG_VND' and b.token = '${token}')
      ORDER BY a.codvnd
    `);
    return result[1].rows;
  }
}

module.exports = VendedoresModel;
