class SagiCadAtivoModel {
  constructor(db) {
    this.db = db;
  }

  /*
    CREATE TABLE IF NOT EXISTS sagi_cad_ativo
    (
      id BIGSERIAL,
      ativo_id NUMERIC(10,0) NOT NULL,
      ativo_codigo CHARACTER VARYING(20) NOT NULL,
      ativo_descricao CHARACTER VARYING(200) NOT NULL,
      ativo_tipo CHARACTER VARYING(40) NOT NULL,
      ativo_local TEXT,
      ativo_nf_emissao DATE,
      ativo_nf_entrada DATE,
      ativo_nf_numero NUMERIC(10,0),
      ativo_nf_serie CHARACTER VARYING(3),
      ativo_nf_modelo CHARACTER VARYING(2),
      ativo_serial CHARACTER VARYING(100),
      ativo_placa CHARACTER VARYING(8) NOT NULL,
      ativo_ufplaca CHARACTER VARYING(2),
      ativo_codid CHARACTER VARYING(10),
      ativo_licenciamento DATE,
      ativo_tara NUMERIC(19,3) NOT NULL,
      ativo_capacidade NUMERIC(19,3) NOT NULL,
      ativo_mediapadrao NUMERIC(19,3) NOT NULL,
      ativo_tipoconsumo NUMERIC(10,0) NOT NULL,
      ativo_veicprop BOOLEAN NOT NULL DEFAULT FALSE,
      ativo_status CHARACTER VARYING(10) NOT NULL,
      ativo_marca CHARACTER VARYING(20),
      ativo_modelo CHARACTER VARYING(25),
      ativo_ano NUMERIC(10,0) NOT NULL,
      ativo_cor CHARACTER VARYING(20),
      ativo_chassis CHARACTER VARYING(30),
      ativo_renavan CHARACTER VARYING(30),
      ativo_referencia CHARACTER VARYING(13),
      ativo_valativo NUMERIC(17,2) NOT NULL,
      ativo_kmrevisao NUMERIC(10,0) NOT NULL,
      ativo_manureal BOOLEAN NOT NULL DEFAULT FALSE,
      ativo_consumo NUMERIC(19,2) NOT NULL,
      ativo_cons_media NUMERIC(6,2) NOT NULL,
      ativo_trans_tp_prop NUMERIC(10,0) NOT NULL,
      ativo_trans_etc_tac_ctc NUMERIC(10,0) NOT NULL,
      ativo_limitecoldia NUMERIC(10,0) NOT NULL,
      ativo_eixo NUMERIC(6,0) NOT NULL,
      ativo_tipoimob NUMERIC(1,0),
      ativo_descimob CHARACTER VARYING(80),
      ativo_bemprinc CHARACTER VARYING(20),
      ativo_parcimob NUMERIC(3,0) NOT NULL,
      ativo_dtinidep DATE,
      ativo_categdep CHARACTER VARYING(40),
      ativo_mesesdep NUMERIC(3,0) NOT NULL,
      pode_transp_res_classei BOOLEAN NOT NULL DEFAULT FALSE,
      pode_transp_res_classeiia BOOLEAN NOT NULL DEFAULT FALSE,
      pode_transp_res_classeiib BOOLEAN NOT NULL DEFAULT FALSE,
      web BOOLEAN NOT NULL DEFAULT FALSE,
      status_cnh CHARACTER VARYING(1),
      status_crv CHARACTER VARYING(1),
      data_status_cnh DATE,
      data_status_crv DATE,
      ativo_rastreador CHARACTER VARYING(30) NOT NULL,
      ativo_gps_ignicao BOOLEAN NOT NULL DEFAULT FALSE,
      ativo_gps_velocidade NUMERIC(10,0) NOT NULL,
      ativo_gps_latitude CHARACTER VARYING(50),
      ativo_gps_longitude CHARACTER VARYING(50),
      ativo_gps_endereco TEXT,
      ativo_gps_ult_data DATE,
      ativo_gps_ult_hora CHARACTER VARYING(8),
      ativo_data DATE,
      ativo_hora CHARACTER VARYING(10),
      cad_data DATE,
      ativo_cod_pais NUMERIC(10,0) NOT NULL,
      tipo_forno CHARACTER VARYING(10),
      ativo_custo_quilometragem NUMERIC(12,2) NOT NULL,
      ativo_obs_compra TEXT,
      ativo_do_codfor NUMERIC(10,0),
      ctasmart_codfor NUMERIC(10,0),
      id_referencia_ativo_nf_credor INTEGER,
      id_tipo_caminhao INTEGER,
      id_referencia_ativo_trans_codigo INTEGER,
      id_motorista_ativo_mot_codigo INTEGER,
      id_sagi_senha_ativo_usuario INTEGER,
      id_sagi_senha_cad_usuario INTEGER,
      id_sagi_cag_cdc INTEGER,
      id_referencia_ativo_proprietario INTEGER,
      id_tipo_cacamba_ativo_id_cacamba INTEGER,
      id_cliente INTEGER NOT NULL,
      id_filial INTEGER NOT NULL,
      CONSTRAINT pkey_sagi_cad_ativo PRIMARY KEY (id),
      CONSTRAINT uq_sagi_cad_ativo_cliente UNIQUE (ativo_id, id_cliente),
      CONSTRAINT fk_sagi_cad_ativo_cliente FOREIGN KEY (id_cliente)
        REFERENCES cliente (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
      CONSTRAINT fk_sagi_cad_ativo_filiais FOREIGN KEY (id_filial)
        REFERENCES filiais (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
      CONSTRAINT fk_sagi_cad_ativo_referencia_nf_credor FOREIGN KEY (id_referencia_ativo_nf_credor)
        REFERENCES referencias (id) MATCH FULL
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
      CONSTRAINT fk_sagi_cad_ativo_tipo_caminhao FOREIGN KEY (id_tipo_caminhao)
        REFERENCES tipo_caminhao (id) MATCH FULL
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
      CONSTRAINT fk_sagi_cad_ativo_referencia_trans_codigo FOREIGN KEY (id_referencia_ativo_trans_codigo)
        REFERENCES referencias (id) MATCH FULL
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
      CONSTRAINT fk_sagi_cad_ativo_motorista FOREIGN KEY (id_motorista_ativo_mot_codigo)
        REFERENCES motorista (id) MATCH FULL
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
      CONSTRAINT fk_sagi_cad_ativo_cag_cdc FOREIGN KEY (id_sagi_cag_cdc)
        REFERENCES sagi_cag_cdc (id) MATCH FULL
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
      CONSTRAINT fk_sagi_cad_ativo_referencia_proprietario FOREIGN KEY (id_referencia_ativo_proprietario)
        REFERENCES referencias (id) MATCH FULL
        ON UPDATE NO ACTION
        ON DELETE CASCADE
    )
  */

  async getAll({ token }) {
    await this.db.query("SET client_encoding TO 'SQL_ASCII'");
    const result = await this.db.query(`
      SELECT a.ativo_id,
        tiraacento(trim(a.ativo_codigo)) as ativo_codigo,
        tiraacento(trim(a.ativo_descricao)) as ativo_descricao,
        tiraacento(trim(a.ativo_tipo)) as ativo_tipo,
        tiraacento(trim(a.ativo_local)) as ativo_local,
        a.ativo_nf_emissao,
        a.ativo_nf_entrada,
        coalesce(a.ativo_nf_numero, 0) as ativo_nf_numero,
        a.ativo_nf_serie,
        trim(a.ativo_nf_modelo) as ativo_nf_modelo,
        case when a.ativo_nf_credor = 0 then null else a.ativo_nf_credor end as id_referencia_ativo_nf_credor,
        tiraacento(trim(a.ativo_serial)) as ativo_serial,
        case when tiraacento(trim(ativo_placa)) <> '' then tiraacento(trim(ativo_codigo)) else REGEXP_REPLACE(tiraacento(trim(ativo_codigo)), '[^a-zA-Z0-9]', '', 'g') end as ativo_placa,
        trim(a.ativo_ufplaca) as ativo_ufplaca,
        tiraacento(trim(a.ativo_codid)) as ativo_codid,
        (select s.idnum from sagi_caminhao s where trim(a.ativo_tipoveiculo) = trim(s.descricao) limit 1) as id_tipo_caminhao,
        a.ativo_licenciamento,
        coalesce(a.ativo_tara, 0) as ativo_tara,
        coalesce(a.ativo_capacidade, 0) as ativo_capacidade,
        coalesce(a.ativo_mediapadrao, 0) as ativo_mediapadrao,
        coalesce(a.ativo_tipoconsumo, 0) as ativo_tipoconsumo,
        case when a.ativo_trans_codigo = 0 then null else a.ativo_trans_codigo end as id_referencia_ativo_trans_codigo,
        coalesce(a.ativo_veicprop, false) as ativo_veicprop,
        case when a.ativo_mot_codigo = 0 then null else a.ativo_mot_codigo end as id_motorista_ativo_mot_codigo,
        trim(a.ativo_status) as ativo_status,
        tiraacento(trim(a.ativo_marca)) as ativo_marca,
        tiraacento(trim(a.ativo_modelo)) as ativo_modelo,
        coalesce(a.ativo_ano, 0) as ativo_ano,
        trim(a.ativo_cor) as ativo_cor,
        trim(a.ativo_chassis) as ativo_chassis,
        trim(a.ativo_renavan) as ativo_renavan,
        trim(a.ativo_referencia) as ativo_referencia,
        coalesce(a.ativo_valativo, 0) as ativo_valativo,
        coalesce(a.ativo_kmrevisao, 0) as ativo_kmrevisao,
        coalesce(a.ativo_manureal, false) as ativo_manureal,
        coalesce(a.ativo_consumo, 0) as ativo_consumo,
        coalesce(a.ativo_cons_media, 0) as ativo_cons_media,
        coalesce(a.ativo_trans_tp_prop, 0) as ativo_trans_tp_prop,
        coalesce(a.ativo_trans_etc_tac_ctc, 0) as ativo_trans_etc_tac_ctc,
        case when trim(a.ativo_filial) <> '' then trim(a.ativo_filial) else 'TODAS' end as ativo_filial,
        coalesce(a.ativo_limitecoldia, 0) as ativo_limitecoldia,
        coalesce(a.ativo_eixo, 0) as ativo_eixo,
        a.ativo_tipoimob,
        tiraacento(trim(a.ativo_descimob)) as ativo_descimob,
        tiraacento(trim(a.ativo_bemprinc)) as ativo_bemprinc,
        coalesce(a.ativo_parcimob, 0) as ativo_parcimob,
        a.ativo_dtinidep,
        tiraacento(trim(a.ativo_categdep)) as ativo_categdep,
        coalesce(a.ativo_mesesdep, 0) as ativo_mesesdep,
        coalesce(a.pode_transp_res_classei, false) as pode_transp_res_classei,
        coalesce(a.pode_transp_res_classeiia, false) as pode_transp_res_classeiia,
        coalesce(a.pode_transp_res_classeiib, false) as pode_transp_res_classeiib,
        coalesce(a.web, false) as web,
        a.status_cnh,
        a.status_crv,
        a.data_status_cnh,
        a.data_status_crv,
        tiraacento(trim(a.ativo_rastreador)) as ativo_rastreador,
        coalesce(a.ativo_gps_ignicao, false) as ativo_gps_ignicao,
        coalesce(a.ativo_gps_velocidade, 0) as ativo_gps_velocidade,
        trim(a.ativo_gps_latitude) as ativo_gps_latitude,
        trim(a.ativo_gps_longitude) as ativo_gps_longitude,
        tiraacento(trim(a.ativo_gps_endereco)) as ativo_gps_endereco,
        a.ativo_gps_ult_data,
        trim(a.ativo_gps_ult_hora) as ativo_gps_ult_hora,
        (select s.iduser from senha s where trim(a.ativo_usuario) = trim(s.usuario) limit 1) as id_sagi_senha_ativo_usuario,
        a.ativo_data,
        trim(a.ativo_hora) as ativo_hora,
        (select s.iduser from senha s where trim(a.cad_usuario) = trim(s.usuario) limit 1) as id_sagi_senha_cad_usuario,
        a.cad_data,
        coalesce(a.ativo_cod_pais, 0) as ativo_cod_pais,
        a.tipo_forno,
        coalesce(a.ativo_custo_quilometragem, 0) as ativo_custo_quilometragem,
        (select s.cag_cdc_id from cag_cdc s where trim(a.ativo_cdc_diariapernoite) = trim(s.codcdc) limit 1) as id_sagi_cag_cdc,
        case when a.ativo_proprietario = 0 then null else a.ativo_proprietario end as id_referencia_ativo_proprietario,
        tiraacento(trim(a.ativo_obs_compra)) as ativo_obs_compra,
        case when a.ativo_id_cacamba = 0 then null else a.ativo_id_cacamba end as id_tipo_cacamba_ativo_id_cacamba,
        a.ativo_do_codfor,
        a.ctasmart_codfor
      FROM sagi_cad_ativo a
      WHERE a.ativo_id not in (select b.codigo from sagi_isat_sinc b where b.tipo='SAGI_CAD_ATIVO' and b.token = '${token}')
      ORDER BY a.ativo_id
    `);
    return result[1].rows;
  }
}

module.exports = SagiCadAtivoModel;
