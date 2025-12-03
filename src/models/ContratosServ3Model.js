class ContratosServ3Model {
  constructor(db) {
    this.db = db;
  }

  /*
    CREATE TABLE IF NOT EXISTS sagi_contrato_serv3 (
      id BIGSERIAL,
      contrato_id NUMERIC(10,0) NOT NULL,
      contrato_data DATE NOT NULL,
      contrato_status CHARACTER(2) NOT NULL,
      contrato_inicio DATE NOT NULL,
      contrato_fim DATE,
      contrato_vencto DATE NOT NULL,
      contrato_fecha NUMERIC(10,0) NOT NULL,
      contrato_descricao CHARACTER VARYING(250) NOT NULL,
      contrato_detalhe TEXT,
      proposta_detalhe TEXT,
      cobranca_detalhe TEXT,
      contrato_obs TEXT,
      contrato_total NUMERIC(19,5) NOT NULL,
      contrato_assinado BOOLEAN NOT NULL,
      contrato_visto BOOLEAN NOT NULL,
      laudo_fotografico BOOLEAN,
      tipo_contrato CHARACTER VARYING(20),
      mot_recusa_proposta TEXT,
      enviar_auto_cert BOOLEAN NOT NULL,
      enviar_auto_email_med BOOLEAN NOT NULL,
      gerar_cobbanc_auto_med BOOLEAN NOT NULL,
      aprova_auto_med BOOLEAN NOT NULL,
      app_obriga_foto_antes_col BOOLEAN NOT NULL,
      app_obriga_foto_depois_col BOOLEAN NOT NULL,
      app_obriga_ass_depois_col BOOLEAN NOT NULL,
      receber_email_incluir_rota BOOLEAN NOT NULL,
      receber_whats_incluir_rota BOOLEAN NOT NULL,
      notifica_venc_proposta BOOLEAN NOT NULL,
      mtr_gerada_emp_contratante BOOLEAN NOT NULL,
      mtr_quemgera CHARACTER(10) NOT NULL,
      mtr_momentogera CHARACTER(10) NOT NULL,
      mtr_cli_orgao CHARACTER VARYING(20),
      mtr_cli_nome CHARACTER VARYING(60),
      mtr_cli_cpf CHARACTER VARYING(11),
      mtr_cli_unidade CHARACTER VARYING(15),
      mtr_cli_senha CHARACTER VARYING(35),
      mtr_cli_nome_receb CHARACTER VARYING(100),
      mtr_cli_just_receb CHARACTER VARYING(250),
      data DATE,
      hora CHARACTER VARYING(8) NOT NULL,
      contrato_codpro_fat CHARACTER(6),
      contrato_subcod_fat CHARACTER(1),
      d4_proposta_enviado BOOLEAN NOT NULL,
      d4_proposta_assinado BOOLEAN NOT NULL,
      d4_contrato_enviado BOOLEAN NOT NULL,
      d4_contrato_assinado BOOLEAN NOT NULL,
      d4_uuid_proposta TEXT,
      d4_uuid_contrato TEXT,
      d4_id_status_proposta NUMERIC(10,0) NOT NULL,
      d4_id_status_contrato NUMERIC(10,0) NOT NULL,
      d4_status_proposta CHARACTER VARYING(100),
      d4_status_contrato CHARACTER VARYING(100),
      id_cliente INTEGER NOT NULL,
      id_referencia_contrato_cliente INTEGER NOT NULL,
      id_referencia_codcli_fatura INTEGER,
      contrato_user_visto INTEGER,
      usuario INTEGER,
      usuario_alt INTEGER,
      id_sagi_prazo_contrato_forma_pg INTEGER,
      id_sagi_cag_vnd_contrato_codvnd INTEGER,
      id_sagi_regiao_regiao_id INTEGER,
      id_sagi_forma_pagto_contrato_condicao INTEGER,
      CONSTRAINT pkey_sagi_contrato_serv3 PRIMARY KEY (id),
      CONSTRAINT uq_sagi_contrato_serv3_cliente UNIQUE (contrato_id, id_cliente),
      CONSTRAINT fk_sagi_contrato_serv3_cliente FOREIGN KEY (id_cliente)
        REFERENCES cliente (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
      CONSTRAINT fk_sagi_contrato_serv3_referencia_contrato_cliente FOREIGN KEY (id_referencia_contrato_cliente)
        REFERENCES referencias (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
      CONSTRAINT fk_sagi_contrato_serv3_referencia_codcli_fatura FOREIGN KEY (id_referencia_codcli_fatura)
        REFERENCES referencias (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
      CONSTRAINT fk_sagi_contrato_serv3_sagi_prazo_contrato_forma_pg FOREIGN KEY (id_sagi_prazo_contrato_forma_pg)
        REFERENCES sagi_prazo (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
      CONSTRAINT fk_sagi_contrato_serv3_sagi_cag_vnd_contrato_codvnd FOREIGN KEY (id_sagi_cag_vnd_contrato_codvnd)
        REFERENCES sagi_cag_vnd (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
      CONSTRAINT fk_sagi_contrato_serv3_sagi_regiao_regiao_id FOREIGN KEY (id_sagi_regiao_regiao_id)
        REFERENCES sagi_regiao (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
      CONSTRAINT fk_sagi_contrato_serv3_sagi_forma_pagto_contrato_condicao FOREIGN KEY (id_sagi_forma_pagto_contrato_condicao)
        REFERENCES sagi_forma_pagto (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sagi_contrato_serv3_filial (
      id BIGSERIAL PRIMARY KEY,
      id_contrato_id INTEGER NOT NULL,
      id_filial INTEGER NOT NULL,
      CONSTRAINT uq_sagi_contrato_serv3_filial_id_id_contrato_id_id_filial UNIQUE (id_contrato_id, id_filial),
      CONSTRAINT fk_sagi_contrato_serv3_filial_sagi_contrato_serv3 FOREIGN KEY (id_contrato_id)
        REFERENCES sagi_contrato_serv3 (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
      CONSTRAINT fk_sagi_contrato_serv3_filial_filiais FOREIGN KEY (id_filial)
        REFERENCES filiais (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sagi_item_contrato_serv3 (
      id BIGSERIAL,
      item_id NUMERIC(10,0) NOT NULL,
      descricao_servico_nf CHARACTER VARYING(255),
      serv_gestaoresiduo BOOLEAN,
      serv_armazenagem BOOLEAN,
      serv_consultoria BOOLEAN,
      serv_locacao BOOLEAN,
      gestaoresiduo_forma_cobr NUMERIC(1,0),
      gestaoresiduo_metodo_med CHARACTER(2),
      gestaoresiduo_valorunit NUMERIC(19,6) NOT NULL,
      gestaoresiduo_valorsem NUMERIC(19,6) NOT NULL,
      gestaoresiduo_prest_aut BOOLEAN,
      gestaoresiduo_min_tempo NUMERIC(16,0),
      gestaoresiduo_vlr_minuto NUMERIC(19,5) NOT NULL,
      gestaoresiduo_vlr_cobaut NUMERIC(19,5) NOT NULL,
      gestaoresiduo_como_cobra CHARACTER(5),
      gestaoresiduo_transp_proprio BOOLEAN,
      gestaoresiduo_placa_transp CHARACTER(10),
      gestaoresiduo_gerapagar_transp BOOLEAN,
      gestaoresiduo_valortransp NUMERIC(19,5) NOT NULL,
      gestaoresiduo_cons_peso_servun BOOLEAN,
      armaz_forma_cobr NUMERIC(1,0),
      armaz_metodo_med CHARACTER(2),
      armaz_valor NUMERIC(19,5) NOT NULL,
      armaz_qtd_dias NUMERIC(10,0),
      armaz_altura CHARACTER(10),
      armaz_largura CHARACTER(10),
      armaz_prateleira CHARACTER(10),
      armaz_corredor CHARACTER(10),
      armaz_nf_numero NUMERIC(10,0) NOT NULL,
      armaz_nf_serie NUMERIC(3,0) NOT NULL,
      armaz_nf_modelo CHARACTER(2),
      armaz_nf_nome CHARACTER VARYING(100),
      cons_forma_cobr NUMERIC(1,0),
      cons_valorunit NUMERIC(19,5) NOT NULL,
      cons_valorsem NUMERIC(19,5) NOT NULL,
      cons_prest_aut BOOLEAN,
      cons_metodo_med CHARACTER(2),
      loc_forma_cobr NUMERIC(1,0),
      loc_metodo_med CHARACTER(2),
      loc_como_cobra CHARACTER(5),
      loc_prest_aut BOOLEAN,
      loc_tipativo CHARACTER(40),
      loc_valorlocacao NUMERIC(19,5) NOT NULL,
      freq_tipo NUMERIC(1,0),
      freq_per NUMERIC(1,0),
      turno CHARACTER(10),
      freq_dtini DATE NOT NULL,
      so_dias_uteis BOOLEAN NOT NULL,
      pula_feriado BOOLEAN NOT NULL,
      segunda BOOLEAN NOT NULL,
      terca BOOLEAN NOT NULL,
      quarta BOOLEAN NOT NULL,
      quinta BOOLEAN NOT NULL,
      sexta BOOLEAN NOT NULL,
      sabado BOOLEAN NOT NULL,
      domingo BOOLEAN NOT NULL,
      mes_01_col CHARACTER(10),
      mes_02_col CHARACTER(10),
      mes_03_col CHARACTER(10),
      mes_04_col CHARACTER(10),
      mes_05_col CHARACTER(10),
      mes_06_col CHARACTER(10),
      sol_aprov_cli BOOLEAN NOT NULL,
      item_id_entrega NUMERIC(10,0),
      id_cliente INTEGER NOT NULL,
      id_sagi_item_contrato_serv3_contrato_id INTEGER NOT NULL,
      id_sagi_cag_cre_gestaoresiduo_cod_transp INTEGER,
      id_sagi_orgao_ambiental_gestaoresiduo_orgao_id INTEGER,
      id_sagi_cag_fun_cons_cod_fun INTEGER,
      loc_usu_aviso_devemp INTEGER,
      id_sagi_setor_loc_setor_aviso_devemp INTEGER,
      id_sagi_cag_pro INTEGER NOT NULL,
      CONSTRAINT pkey_sagi_item_contrato_serv3 PRIMARY KEY (id),
      CONSTRAINT uq_sagi_item_contrato_serv3_cliente UNIQUE (item_id, id_cliente),
      CONSTRAINT fk_sagi_item_contrato_serv3_cliente FOREIGN KEY (id_cliente)
        REFERENCES cliente (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
      CONSTRAINT fk_sagi_item_contrato_serv3_sagi_contrato_serv3 FOREIGN KEY (id_sagi_item_contrato_serv3_contrato_id)
        REFERENCES sagi_contrato_serv3 (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
      CONSTRAINT fk_sagi_item_contrato_serv3_sagi_cag_cre FOREIGN KEY (id_sagi_cag_cre_gestaoresiduo_cod_transp)
        REFERENCES referencias (id) MATCH FULL
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
      CONSTRAINT fk_sagi_item_contrato_serv3_sagi_orgao_ambiental FOREIGN KEY (id_sagi_orgao_ambiental_gestaoresiduo_orgao_id)
        REFERENCES sagi_orgao_ambiental (id) MATCH FULL
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
      CONSTRAINT fk_sagi_item_contrato_serv3_sagi_cag_fun FOREIGN KEY (id_sagi_cag_fun_cons_cod_fun)
        REFERENCES sagi_cag_fun (id) MATCH FULL
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
      CONSTRAINT fk_sagi_item_contrato_serv3_sagi_setor FOREIGN KEY (id_sagi_setor_loc_setor_aviso_devemp)
        REFERENCES sagi_setor (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
      CONSTRAINT fk_sagi_item_contrato_serv3_sagi_cag_pro FOREIGN KEY (id_sagi_cag_pro)
        REFERENCES sagi_cag_pro (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sagi_vinc_res_serv_serv3
    (
      id BIGSERIAL,
      id_sagi_contrato_serv3 INTEGER NOT NULL,
      id_sagi_item_contrato_serv3 INTEGER NOT NULL,
      id_sagi_cag_pr2 INTEGER NOT NULL,
      id_cliente INTEGER NOT NULL,
      CONSTRAINT pkey_sagi_vinc_res_serv_serv3 PRIMARY KEY (id),
      CONSTRAINT fk_sagi_vinc_res_serv_serv3_cliente FOREIGN KEY (id_cliente)
        REFERENCES cliente (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
      CONSTRAINT fk_sagi_vinc_res_serv_serv3_sagi_contrato_serv3 FOREIGN KEY (id_sagi_contrato_serv3)
        REFERENCES sagi_contrato_serv3 (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
      CONSTRAINT fk_sagi_vinc_res_serv_serv3_sagi_item_contrato_serv3 FOREIGN KEY (id_sagi_item_contrato_serv3)
        REFERENCES sagi_item_contrato_serv3 (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
      CONSTRAINT fk_sagi_vinc_res_serv_serv3_sagi_cag_pr2 FOREIGN KEY (id_sagi_cag_pr2)
        REFERENCES sagi_cag_pr2 (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sagi_ativo_locacao_serv3
    (
      id BIGSERIAL,
      id_sagi_contrato_serv3 INTEGER NOT NULL,
      id_sagi_item_contrato_serv3 INTEGER NOT NULL,
      id_sagi_cad_ativo INTEGER NOT NULL,
      valor_locacao NUMERIC(19,5) NOT NULL,
      id_cliente INTEGER NOT NULL,
      CONSTRAINT pkey_sagi_ativo_locacao_serv3 PRIMARY KEY (id),
      CONSTRAINT fk_sagi_ativo_locacao_serv3_cliente FOREIGN KEY (id_cliente)
        REFERENCES cliente (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
      CONSTRAINT fk_sagi_ativo_locacao_serv3_sagi_contrato_serv3 FOREIGN KEY (id_sagi_contrato_serv3)
        REFERENCES sagi_contrato_serv3 (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
      CONSTRAINT fk_sagi_ativo_locacao_serv3_sagi_item_contrato_serv3 FOREIGN KEY (id_sagi_item_contrato_serv3)
        REFERENCES sagi_item_contrato_serv3 (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
      CONSTRAINT fk_sagi_ativo_locacao_serv3_sagi_cad_ativo FOREIGN KEY (id_sagi_cad_ativo)
        REFERENCES sagi_cad_ativo (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sagi_item_contrato_sagi_cag_cdc_serv3
    (
      id BIGSERIAL,
      id_sagi_item_contrato_serv3 INTEGER NOT NULL,
      id_sagi_cag_cdc INTEGER NOT NULL,
      id_cliente INTEGER NOT NULL,
      CONSTRAINT pkey_sagi_item_contrato_sagi_cag_cdc_serv3 PRIMARY KEY (id),
      CONSTRAINT fk_sagi_item_contrato_sagi_cag_cdc_serv3_cliente FOREIGN KEY (id_cliente)
        REFERENCES cliente (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
      CONSTRAINT fk_sagi_item_contrato_sagi_cag_cdc_serv3_sagi_item_contrato_serv3 FOREIGN KEY (id_sagi_item_contrato_serv3)
        REFERENCES sagi_item_contrato_serv3 (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
      CONSTRAINT fk_sagi_item_contrato_sagi_cag_cdc_serv3_sagi_cag_cdc FOREIGN KEY (id_sagi_cag_cdc)
        REFERENCES sagi_cag_cdc (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sagi_item_contrato_sagi_centro_serv3
    (
      id BIGSERIAL,
      id_sagi_item_contrato_serv3 INTEGER NOT NULL,
      id_sagi_centro INTEGER NOT NULL,
      id_cliente INTEGER NOT NULL,
      CONSTRAINT pkey_sagi_item_contrato_sagi_centro_serv3 PRIMARY KEY (id),
      CONSTRAINT fk_sagi_item_contrato_sagi_centro_serv3_cliente FOREIGN KEY (id_cliente)
        REFERENCES cliente (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
      CONSTRAINT fk_sagi_item_contrato_sagi_centro_serv3_sagi_item_contrato_serv3 FOREIGN KEY (id_sagi_item_contrato_serv3)
        REFERENCES sagi_item_contrato_serv3 (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
      CONSTRAINT fk_sagi_item_contrato_sagi_centro_serv3_sagi_centro FOREIGN KEY (id_sagi_centro)
        REFERENCES sagi_centro (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
    );
  */

  async getAll({ token }) {
    await this.db.query("SET client_encoding TO 'SQL_ASCII'");
    const result = await this.db.query(`
      SELECT a.contrato_id,
        a.contrato_data,
        case when a.contrato_cliente = 0 then null else a.contrato_cliente end as contrato_cliente,
        case when a.codcli_fatura = 0 then null else a.codcli_fatura end as codcli_fatura,
        a.contrato_status,
        a.contrato_inicio,
        a.contrato_fim,
        a.contrato_vencto,
        a.contrato_fecha,
        tiraacento(trim(a.contrato_descricao)) as contrato_descricao,
        tiraacento(trim(a.contrato_detalhe)) as contrato_detalhe,
        tiraacento(trim(a.proposta_detalhe)) as proposta_detalhe,
        tiraacento(trim(a.cobranca_detalhe)) as cobranca_detalhe,
        tiraacento(trim(a.contrato_obs)) as contrato_obs,
        a.contrato_total,
        coalesce(a.contrato_assinado, false) as contrato_assinado,
        coalesce(a.contrato_visto, false) as contrato_visto,
        (select s.iduser from senha s where trim(a.contrato_user_visto) = trim(s.usuario) limit 1) as iduser_visto,
        case when a.contrato_forma_pg = 0 then null else a.contrato_forma_pg end as contrato_forma_pg,
        case when a.contrato_codvnd = 0 then null else a.contrato_codvnd end as contrato_codvnd,
        coalesce(a.laudo_fotografico, false) as laudo_fotografico,
        trim(a.tipo_contrato) as tipo_contrato,
        case when a.regiao_id = 0 then null else a.regiao_id end as regiao_id,
        tiraacento(trim(a.mot_recusa_proposta)) as mot_recusa_proposta,
        coalesce(a.enviar_auto_cert, false) as enviar_auto_cert,
        coalesce(a.enviar_auto_email_med, false) as enviar_auto_email_med,
        coalesce(a.gerar_cobbanc_auto_med, false) as gerar_cobbanc_auto_med,
        coalesce(a.aprova_auto_med, false) as aprova_auto_med,
        coalesce(a.app_obriga_foto_antes_col, false) as app_obriga_foto_antes_col,
        coalesce(a.app_obriga_foto_depois_col, false) as app_obriga_foto_depois_col,
        coalesce(a.app_obriga_ass_depois_col, false) as app_obriga_ass_depois_col,
        coalesce(a.receber_email_incluir_rota, false) as receber_email_incluir_rota,
        coalesce(a.receber_whats_incluir_rota, false) as receber_whats_incluir_rota,
        coalesce(a.notifica_venc_proposta, false) as notifica_venc_proposta,
        coalesce(a.mtr_gerada_emp_contratante, false) as mtr_gerada_emp_contratante,
        tiraacento(trim(a.mtr_quemgera)) as mtr_quemgera,
        tiraacento(trim(a.mtr_momentogera)) as mtr_momentogera,
        tiraacento(trim(a.mtr_cli_orgao)) as mtr_cli_orgao,
        tiraacento(trim(a.mtr_cli_nome)) as mtr_cli_nome,
        tiraacento(trim(a.mtr_cli_cpf)) as mtr_cli_cpf,
        tiraacento(trim(a.mtr_cli_unidade)) as mtr_cli_unidade,
        tiraacento(trim(a.mtr_cli_senha)) as mtr_cli_senha,
        tiraacento(trim(a.mtr_cli_nome_receb)) as mtr_cli_nome_receb,
        tiraacento(trim(a.mtr_cli_just_receb)) as mtr_cli_just_receb,
        a.data,
        a.hora,
        (select s.iduser from senha s where trim(a.usuario) = trim(s.usuario) limit 1) as iduser_cad,
        (select s.iduser from senha s where trim(a.usuario_alt) = trim(s.usuario) limit 1) as iduser_alt,
        (select s.codigo from sagi_forma_pagto s where trim(a.contrato_condicao) = trim(s.descricao) limit 1) as contrato_condicao,
        tiraacento(trim(a.contrato_codpro_fat)) as contrato_codpro_fat,
        tiraacento(trim(a.contrato_subcod_fat)) as contrato_subcod_fat,
        coalesce(a.d4_proposta_enviado, false) as d4_proposta_enviado,
        coalesce(a.d4_proposta_assinado, false) as d4_proposta_assinado,
        coalesce(a.d4_contrato_enviado, false) as d4_contrato_enviado,
        coalesce(a.d4_contrato_assinado, false) as d4_contrato_assinado,
        trim(a.d4_uuid_proposta) as d4_uuid_proposta,
        trim(a.d4_uuid_contrato) as d4_uuid_contrato,
        a.d4_id_status_proposta,
        a.d4_id_status_contrato,
        tiraacento(trim(a.d4_status_proposta)) as d4_status_proposta,
        tiraacento(trim(a.d4_status_contrato)) as d4_status_contrato
      FROM sagi_contrato_serv3 a
      WHERE a.contrato_id not in (select b.codigo from sagi_isat_sinc b where b.tipo='SAGI_CONTRATO_SERV3' and b.token = '${token}')
      ORDER BY a.contrato_id
    `);

    const contratos = result[1].rows;

    for (const contrato of contratos) {
      const result_2 = await this.db.query(`
        SELECT ac.contrato_id,
          trim(ac.contrato_filial) as filial
        FROM sagi_cont_autoriza_serv3 ac
        WHERE ac.contrato_id = ${contrato.contrato_id}
      `);
      contrato.filiais = result_2[1].rows;

      const result_3 = await this.db.query(`
        SELECT ic.item_id,
          ic.contrato_id,
          (select cp.sr_recno from cag_pro cp where trim(cp.codpro) = trim(ic.cod_servico) and trim(cp.subcod) = trim(ic.subcod_servico) limit 1) as id_codpro,
          tiraacento(trim(ic.descricao_servico_nf)) as descricao_servico_nf,
          CASE
            WHEN trim(ic.serv_codcdc_var) IS NULL OR trim(ic.serv_codcdc_var) = '' THEN '{}'
            ELSE string_to_array(trim(ic.serv_codcdc_var), '|')
          END as serv_codcdc_var,
          CASE
            WHEN trim(ic.serv_centro_var) IS NULL OR trim(ic.serv_centro_var) = '' THEN '{}'
            ELSE string_to_array(trim(ic.serv_centro_var), '|')
          END as serv_centro_var,
          coalesce(ic.serv_gestaoresiduo, false) as serv_gestaoresiduo,
          coalesce(ic.serv_armazenagem, false) as serv_armazenagem,
          coalesce(ic.serv_consultoria, false) as serv_consultoria,
          coalesce(ic.serv_locacao, false) as serv_locacao,
          ic.gestaoresiduo_forma_cobr,
          ic.gestaoresiduo_metodo_med,
          ic.gestaoresiduo_valorunit,
          ic.gestaoresiduo_valorfsem,
          coalesce(ic.gestaoresiduo_prest_aut, false) as gestaoresiduo_prest_aut,
          ic.gestaoresiduo_min_tempo,
          ic.gestaoresiduo_vlr_minuto,
          ic.gestaoresiduo_vlr_cobaut,
          trim(ic.gestaoresiduo_como_cobra) as gestaoresiduo_como_cobra,
          coalesce(ic.gestaoresiduo_transp_proprio, false) as gestaoresiduo_transp_proprio,
          case when ic.gestaoresiduo_cod_transp = 0 then null else ic.gestaoresiduo_cod_transp end as gestaoresiduo_cod_transp,
          trim(ic.gestaoresiduo_placa_transp) as gestaoresiduo_placa_transp,
          coalesce(ic.gestaoresiduo_gerapagar_transp, false) as gestaoresiduo_gerapagar_transp,
          ic.gestaoresiduo_valortransp,
          case when ic.gestaoresiduo_orgao_id = 0 then null else ic.gestaoresiduo_orgao_id end as gestaoresiduo_orgao_id,
          coalesce(ic.gestaoresiduo_cons_peso_servun, false) as gestaoresiduo_cons_peso_servun,
          ic.armaz_forma_cobr,
          ic.armaz_metodo_med,
          ic.armaz_valor,
          ic.armaz_qtd_dias,
          trim(ic.armaz_altura) as armaz_altura,
          trim(ic.armaz_largura) as armaz_largura,
          trim(ic.armaz_prateleira) as armaz_prateleira,
          trim(ic.armaz_corredor) as armaz_corredor,
          ic.armaz_nf_numero,
          ic.armaz_nf_serie,
          ic.armaz_nf_modelo,
          tiraacento(trim(ic.armaz_nf_nome)) as armaz_nf_nome,
          ic.cons_forma_cobr,
          case when ic.cons_cod_fun = 0 then null else ic.cons_cod_fun end as cons_cod_fun,
          ic.cons_valorunit,
          ic.cons_valorfsem,
          coalesce(ic.cons_prest_aut, false) as cons_prest_aut,
          ic.cons_metodo_med,
          ic.loc_forma_cobr,
          ic.loc_metodo_med,
          trim(ic.loc_como_cobra) as loc_como_cobra,
          coalesce(ic.loc_prest_aut, false) as loc_prest_aut,
          (select s.iduser from senha s where trim(ic.loc_usu_aviso_devemp) = trim(s.usuario) limit 1) as loc_usu_aviso_devemp,
          (select s.codset from setor s where trim(ic.loc_setor_aviso_devemp) = trim(s.setor) limit 1) as loc_setor_aviso_devemp,
          tiraacento(trim(ic.loc_tipoativo)) as loc_tipoativo,
          ic.loc_valorlocacao,
          ic.freq_tipo,
          ic.freq_per,
          tiraacento(trim(ic.turno)) as turno,
          ic.freq_dtini,
          coalesce(ic.so_dias_uteis, false) as so_dias_uteis,
          coalesce(ic.pula_feriado, false) as pula_feriado,
          coalesce(ic.segunda, false) as segunda,
          coalesce(ic.terca, false) as terca,
          coalesce(ic.quarta, false) as quarta,
          coalesce(ic.quinta, false) as quinta,
          coalesce(ic.sexta, false) as sexta,
          coalesce(ic.sabado, false) as sabado,
          coalesce(ic.domingo, false) as domingo,
          tiraacento(trim(ic.mes_01_col)) as mes_01_col,
          tiraacento(trim(ic.mes_02_col)) as mes_02_col,
          tiraacento(trim(ic.mes_03_col)) as mes_03_col,
          tiraacento(trim(ic.mes_04_col)) as mes_04_col,
          tiraacento(trim(ic.mes_05_col)) as mes_05_col,
          tiraacento(trim(ic.mes_06_col)) as mes_06_col,
          coalesce(ic.sol_aprov_cli, false) as sol_aprov_cli,
          ic.item_id_entrega
        FROM sagi_item_contrato_serv3 ic
        WHERE ic.contrato_id = ${contrato.contrato_id}
      `);
      contrato.itens = result_3[1].rows;

      for (const item of contrato.itens) {
        const result_4 = await this.db.query(`
          SELECT a.sr_recno_cag_pr2
          FROM sagi_vinc_res_serv_serv3 a
          WHERE a.contrato_item_id = ${item.item_id}
        `);
        item.residuos = result_4[1].rows;

        const result_5 = await this.db.query(`
          SELECT a.ativo_id,
            a.valor_locacao
          FROM sagi_ativo_locacao_serv3 a
          WHERE a.item_id = ${item.item_id}
        `);
        item.ativos = result_5[1].rows;
      }
    }

    return contratos;
  }
}

module.exports = ContratosServ3Model;
