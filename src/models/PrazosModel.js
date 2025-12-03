class PrazosModel {
  constructor(db) {
    this.db = db;
  }

  /*
    CREATE TABLE IF NOT EXISTS sagi_prazo (
      id BIGSERIAL,
      prazo_id NUMERIC(10,0) NOT NULL NOT NULL,
      prazo_descricao CHARACTER VARYING(250) NOT NULL,
      prazo_parcelas NUMERIC(10,0) NOT NULL,
      prazo_vencimento NUMERIC(10,0) NOT NULL,
      prazo_vencto_regra NUMERIC(10,0) NOT NULL,
      prazo_diferenca NUMERIC(10,0) NOT NULL,
      prazo_dif_regra NUMERIC(10,0) NOT NULL,
      prazo_juros NUMERIC(6,2) NOT NULL,
      prazo_tipo_pag CHARACTER(1) NOT NULL,
      parcela_dia_mes BOOLEAN NOT NULL,
      prazo_seg BOOLEAN NOT NULL,
      prazo_ter BOOLEAN NOT NULL,
      prazo_qua BOOLEAN NOT NULL,
      prazo_qui BOOLEAN NOT NULL,
      prazo_sex BOOLEAN NOT NULL,
      prazo_sab BOOLEAN NOT NULL,
      prazo_dom BOOLEAN NOT NULL,
      prazo_prox_sem BOOLEAN NOT NULL,
      prazo_fora_sem BOOLEAN NOT NULL,
      prazo_fora_qui BOOLEAN NOT NULL,
      prazo_fora_mes BOOLEAN NOT NULL,
      prazo_dias NUMERIC(10,0) NOT NULL,
      prazo_dias_uteis BOOLEAN NOT NULL,
      prazo_dias_alter BOOLEAN NOT NULL,
      prazo_tipo_par CHARACTER(1) NOT NULL,
      prazo_dias2 NUMERIC(10,0) NOT NULL,
      przo_dias_vct_alt CHARACTER VARYING(512) NOT NULL,
      przo_tp_feriado NUMERIC(1,0) NOT NULL,
      przo_tp_prazo NUMERIC(1,0) NOT NULL,
      przo_tp_person NUMERIC(1,0) NOT NULL,
      cad_data DATE,
      prazo_status CHARACTER(7) NOT NULL,
      id_sagi_senha INTEGER,
      id_cliente INTEGER NOT NULL,
      id_sagi_forma_pagto INTEGER NOT NULL,
      CONSTRAINT pkey_sagi_prazo PRIMARY KEY (id),
      CONSTRAINT uq_sagi_prazo_cliente UNIQUE (prazo_id, id_cliente),
      CONSTRAINT fk_sagi_prazo_sagi_forma_pagto FOREIGN KEY (id_sagi_forma_pagto)
        REFERENCES sagi_forma_pagto (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
      CONSTRAINT fk_sagi_prazo_cliente FOREIGN KEY (id_cliente)
        REFERENCES cliente (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
    )
  */

  async getAll({ token }) {
    await this.db.query("SET client_encoding TO 'SQL_ASCII'");
    const result = await this.db.query(`
      SELECT a.prazo_id,
        tiraacento(trim(a.prazo_descricao)) as prazo_descricao,
        a.prazo_parcelas,
        a.prazo_vencimento,
        a.prazo_vencto_regra,
        a.prazo_diferenca,
        a.prazo_dif_regra,
        a.prazo_juros,
        case when a.prazo_codigo_forma = 0 then null else a.prazo_codigo_forma end as prazo_codigo_forma,
        a.prazo_tipo_pag,
        coalesce(a.parcela_dia_mes, false) as parcela_dia_mes,
        coalesce(a.prazo_seg, false) as prazo_seg,
        coalesce(a.prazo_ter, false) as prazo_ter,
        coalesce(a.prazo_qua, false) as prazo_qua,
        coalesce(a.prazo_qui, false) as prazo_qui,
        coalesce(a.prazo_sex, false) as prazo_sex,
        coalesce(a.prazo_sab, false) as prazo_sab,
        coalesce(a.prazo_dom, false) as prazo_dom,
        coalesce(a.prazo_prox_sem, false) as prazo_prox_sem,
        coalesce(a.prazo_fora_sem, false) as prazo_fora_sem,
        coalesce(a.prazo_fora_dez, false) as prazo_fora_dez,
        coalesce(a.prazo_fora_qui, false) as prazo_fora_qui,
        coalesce(a.prazo_fora_mes, false) as prazo_fora_mes,
        a.prazo_dias,
        coalesce(a.prazo_dias_uteis, false) as prazo_dias_uteis,
        coalesce(a.prazo_dias_alter, false) as prazo_dias_alter,
        a.prazo_tipo_par,
        a.prazo_dias2,
        trim(a.przo_dias_vct_alt) as przo_dias_vct_alt,
        a.przo_tp_feriado,
        a.przo_tp_prazo,
        a.przo_tp_person,
        (select s.iduser from senha s where trim(a.cad_usuario) = trim(s.usuario) limit 1) as iduser,
        a.cad_data,
        trim(a.prazo_status) as prazo_status
      FROM sagi_prazo a
      WHERE a.prazo_id not in (select b.codigo from sagi_isat_sinc b where b.tipo='SAGI_PRAZO' and b.token = '${token}')
      ORDER BY a.prazo_id
    `);
    return result[1].rows;
  }
}

module.exports = PrazosModel;
