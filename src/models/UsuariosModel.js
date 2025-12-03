class UsuariosModel {
  constructor(db) {
    this.db = db;
  }

  /*
    CREATE TABLE IF NOT EXISTS sagi_senha (
      id BIGSERIAL,
      iduser NUMERIC(10,0) NOT NULL,
      usuario CHARACTER VARYING(20),
      nomefun CHARACTER VARYING(60),
      tipo CHARACTER VARYING(13),
      bloqueia CHARACTER(1),
      altera CHARACTER(1),
      desc_com NUMERIC(10,2),
      desc_ven NUMERIC(10,2),
      acre_com NUMERIC(10,2),
      acre_ven NUMERIC(10,2),
      exp_arq BOOLEAN,
      impresso BOOLEAN,
      email BOOLEAN,
      naoaviso BOOLEAN,
      notas TEXT,
      chave CHARACTER VARYING(35),
      bloq_portal_cli BOOLEAN,
      end_email CHARACTER VARYING(100),
      server CHARACTER VARYING(100),
      porta_smtp NUMERIC(10,0),
      email_usuario CHARACTER VARYING(100),
      email_senha CHARACTER VARYING(20),
      email_cc CHARACTER VARYING(100),
      email_bcc CHARACTER VARYING(100),
      ssl_email BOOLEAN,
      email_conf BOOLEAN,
      bloq_alt_hor_mtr BOOLEAN,
      tls_email BOOLEAN,
      dicas TEXT,
      nome_arq CHARACTER VARYING(300),
      arquivo TEXT,
      assinatura TEXT,
      assinatura_med BOOLEAN,
      user_develop BOOLEAN,
      centrocusto BOOLEAN,
      centrocustusins BOOLEAN,
      cad_usuario CHARACTER VARYING(25),
      cad_data DATE,
      ordemserv_veiculo BOOLEAN,
      ordemserv_cacamba BOOLEAN,
      ordemserv_maquina BOOLEAN,
      ordemserv_prensa BOOLEAN,
      ordemserv_equip BOOLEAN,
      user_gerentecrm BOOLEAN,
      user_naoexibevalunifinc BOOLEAN,
      nao_obrigar_banco_previsto BOOLEAN,
      lim_descvendainheiro NUMERIC(10,2),
      lim_desccomprodinheiro NUMERIC(10,2),
      imp_boleto NUMERIC(10,0),
      imp_recibo NUMERIC(10,0),
      nao_mostra_pendencias_user BOOLEAN,
      pode_dar_desconto_bol BOOLEAN,
      logoff_auto BOOLEAN,
      end_email_relatorio CHARACTER VARYING(100),
      webrel_tema CHARACTER VARYING(25),
      acesso_fin3_pagamentos BOOLEAN,
      acesso_fin3_recebimentos BOOLEAN,
      nao_coletavol BOOLEAN,
      nao_coletaresiduo BOOLEAN,
      nao_coletarequipamento BOOLEAN,
      podeverfinanceiro2 BOOLEAN,
      id_sagi_setor INTEGER,
      id_sagi_cag_fun INTEGER,
      id_sagi_cag_vnd INTEGER,
      id_sagi_cag_ide INTEGER,
      id_sagi_classifica INTEGER,
      id_sagi_categor INTEGER,
      id_cliente INTEGER NOT NULL,
      CONSTRAINT pkey_sagi_senha PRIMARY KEY (id),
      CONSTRAINT uq_sagi_senha_cliente UNIQUE (iduser, id_cliente),
      CONSTRAINT fk_sagi_senha_cliente FOREIGN KEY (id_cliente)
        REFERENCES cliente (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
      CONSTRAINT fk_sagi_senha_sagi_setor FOREIGN KEY (id_sagi_setor)
        REFERENCES sagi_setor (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
      CONSTRAINT fk_sagi_senha_sagi_cag_fun FOREIGN KEY (id_sagi_cag_fun)
        REFERENCES sagi_cag_fun (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
      CONSTRAINT fk_sagi_senha_sagi_cag_vnd FOREIGN KEY (id_sagi_cag_vnd)
        REFERENCES sagi_cag_vnd (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
      CONSTRAINT fk_sagi_senha_sagi_cag_ide FOREIGN KEY (id_sagi_cag_ide)
        REFERENCES sagi_cag_ide (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
      CONSTRAINT fk_sagi_senha_sagi_classifica FOREIGN KEY (id_sagi_classifica)
        REFERENCES sagi_classifica (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
      CONSTRAINT fk_sagi_senha_sagi_categor FOREIGN KEY (id_sagi_categor)
        REFERENCES sagi_categor (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sagi_senha_filial (
      id BIGSERIAL PRIMARY KEY,
      id_sagi_senha INTEGER NOT NULL,
      id_filial INTEGER NOT NULL,
      CONSTRAINT uq_sagi_senha_filial_id_sagi_senha_id_cliente UNIQUE (id_sagi_senha, id_filial),
      CONSTRAINT fk_sagi_senha_filial_sagi_senha FOREIGN KEY (id_sagi_senha)
        REFERENCES sagi_senha (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
      CONSTRAINT fk_sagi_senha_filial_filiais FOREIGN KEY (id_filial)
        REFERENCES filiais (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
    )
  */

  async getAll({ token }) {
    await this.db.query("SET client_encoding TO 'SQL_ASCII'");
    const result = await this.db.query(`
      SELECT senha.iduser,
        trim(senha.usuario) as usuario,
        (select setor.codset from setor where trim(senha.setor) = trim(setor.setor) limit 1) as codset,
        case when senha.codfunc = 0 then null else senha.codfunc end as codfunc,
        trim(senha.nomefun) as nomefun,
        trim(senha.tipo) as tipo,
        case when trim(senha.bloqueia) = '' then 'N' else senha.bloqueia end as bloqueia,
        case when trim(senha.altera) = '' then 'N' else senha.altera end as altera,
        senha.desc_com,
        senha.desc_ven,
        senha.acre_com,
        senha.acre_ven,
        case when senha.codven = 0 then null else senha.codven end as codven,
        case when senha.codcom = 0 then null else senha.codcom end as codcom,
        case when senha.codcla = 0 then null else senha.codcla end as codcla,
        case when senha.codcatfor = 0 then null else senha.codcatfor end as codcatfor,
        coalesce(senha.exp_arq, false) as exp_arq,
        coalesce(senha.impressao, false) as impressao,
        coalesce(senha.email, false) as email,
        coalesce(senha.naoaviso, false) as naoaviso,
        case when trim(senha.empresa) <> '' then trim(senha.empresa) else 'TODAS' end as filial,
        trim(senha.notas) as notas,
        trim(senha.chave) as chave,
        coalesce(senha.bloq_portal_cli) as bloq_portal_cli,
        trim(senha.end_email) as end_email,
        trim(senha.server) as server,
        senha.porta_smtp,
        trim(senha.email_usuario) as email_usuario,
        trim(senha.email_senha) as email_senha,
        trim(senha.email_cc) as email_cc,
        trim(senha.email_bcc) as email_bcc,
        coalesce(senha.ssl_email, false) as ssl_email,
        coalesce(senha.email_conf, false) as email_conf,
        coalesce(senha.bloq_alt_hor_mtr, false) as bloq_alt_hor_mtr,
        coalesce(senha.tls_email, false) as tls_email,
        coalesce(senha.dicas, false) as dicas,
        trim(senha.nome_arq) as nome_arq,
        trim(senha.arquivo) as arquivo,
        trim(senha.assinatura) as assinatura,
        coalesce(senha.assinatura_med, false) as assinatura_med,
        coalesce(senha.user_develop, false) as user_develop,
        coalesce(senha.centrocusto, false) as centrocusto,
        coalesce(senha.centrocustoins, false) as centrocustoins,
        trim(senha.cad_usuario) as cad_usuario,
        senha.cad_data,
        coalesce(senha.ordserv_veiculo, false) as ordserv_veiculo,
        coalesce(senha.ordserv_cacamba, false) as ordserv_cacamba,
        coalesce(senha.ordserv_maquina, false) as ordserv_maquina,
        coalesce(senha.ordserv_prensa, false) as ordserv_prensa,
        coalesce(senha.ordserv_equip, false) as ordserv_equip,
        coalesce(senha.user_gerentecrm, false) as user_gerentecrm,
        coalesce(senha.user_naoexibevalunifunc, false) as user_naoexibevalunifunc,
        coalesce(senha.nao_obrigar_banco_previsto, false) as nao_obrigar_banco_previsto,
        senha.lim_descvendadinheiro,
        senha.lim_desccompradinheiro,
        senha.imp_boleto,
        senha.imp_recibo,
        coalesce(senha.nao_mostra_pendencias_user, false) as nao_mostra_pendencias_user,
        coalesce(senha.pode_dar_desconto_bol, false) as pode_dar_desconto_bol,
        coalesce(senha.logoff_auto, false) as logoff_auto,
        trim(senha.end_email_relatorio) as end_email_relatorio,
        trim(senha.webrel_tema) as webrel_tema,
        coalesce(senha.acesso_fin3_pagamentos, false) as acesso_fin3_pagamentos,
        coalesce(senha.acesso_fin3_recebimentos, false) as acesso_fin3_recebimentos,
        coalesce(senha.nao_colnormal, false) as nao_colnormal,
        coalesce(senha.nao_colservico, false) as nao_colservico,
        coalesce(senha.nao_colembarque, false) as nao_colembarque,
        coalesce(senha.podeverfinanceiro2, false) as podeverfinanceiro2
      FROM senha
      WHERE senha.iduser not in (select b.codigo from sagi_isat_sinc b where b.tipo='SENHA' and b.token = '${token}')
      ORDER BY senha.iduser
    `);
    return result[1].rows;
  }
}

module.exports = UsuariosModel;
