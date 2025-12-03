class TipoCaminhaoModel {
  constructor(db) {
    this.db = db;
  }

  /*
    ALTER TABLE tipo_caminhao ADD COLUMN idnum NUMERIC(10) DEFAULT NULL;
    ALTER TABLE tipo_caminhao ADD COLUMN container BOOLEAN NOT NULL DEFAULT FALSE;
    ALTER TABLE tipo_caminhao ADD COLUMN data DATE NOT NULL DEFAULT NOW();
    ALTER TABLE tipo_caminhao ADD COLUMN hora CHARACTER VARYING(8);
    ALTER TABLE tipo_caminhao ADD COLUMN obs CHARACTER VARYING(50);
    ALTER TABLE tipo_caminhao ADD COLUMN peso_liq NUMERIC(18, 3) NOT NULL DEFAULT 0.000;
    ALTER TABLE tipo_caminhao ADD COLUMN tipo_licenc CHARACTER VARYING(50);
    ALTER TABLE tipo_caminhao ADD COLUMN peso_bruto NUMERIC(18, 3) NOT NULL DEFAULT 0.000;
    ALTER TABLE tipo_caminhao ADD COLUMN qtd_placas NUMERIC(10, 0) NOT NULL DEFAULT 1;
    ALTER TABLE tipo_caminhao ADD COLUMN peso_bruto_fab NUMERIC(18, 3) NOT NULL DEFAULT 0.000;
    ALTER TABLE tipo_caminhao ADD COLUMN qtd_eixos_t NUMERIC(10, 0) NOT NULL DEFAULT 0;
    ALTER TABLE tipo_caminhao ADD COLUMN qtd_eixos_l NUMERIC(10, 0) NOT NULL DEFAULT 0;
    ALTER TABLE tipo_caminhao ADD COLUMN nome_arq CHARACTER VARYING(300);
    ALTER TABLE tipo_caminhao ADD COLUMN arquivo TEXT;
    ALTER TABLE tipo_caminhao ADD COLUMN agendamento_ordem_fixa BOOLEAN NOT NULL DEFAULT FALSE;
    ALTER TABLE tipo_caminhao ADD COLUMN qtd_pesagem NUMERIC(10, 0) NOT NULL DEFAULT 0;
    ALTER TABLE tipo_caminhao ADD COLUMN status CHARACTER VARYING(10) NOT NULL DEFAULT 'ATIVO';
    ALTER TABLE tipo_caminhao ADD COLUMN id_sagi_senha INTEGER DEFAULT NULL;

    ALTER TABLE ordem_rastreio
      ADD COLUMN id_tipo_caminhao INTEGER,
      ADD CONSTRAINT fk_ordem_rastreio_tipo_caminhao
      FOREIGN KEY (id_tipo_caminhao)
      REFERENCES tipo_caminhao (id);
  */

  async get({ token }) {
    await this.db.query("SET client_encoding TO 'SQL_ASCII'");
    const result = await this.db.query(`
      SELECT a.idnum,
        tiraacento(trim(a.descricao)) as descricao,
        coalesce(a.container, false) as container,
        a.data,
        a.hora,
        (select s.iduser from senha s where trim(a.usuario) = trim(s.usuario) limit 1) as iduser,
        tiraacento(trim(a.obs)) as obs,
        a.peso_liq,
        tiraacento(trim(a.tipo_licenc)) as tipo_licenc,
        a.peso_bruto,
        a.qtd_placas,
        a.peso_bruto_fab,
        a.qtd_eixos_t,
        a.qtd_eixos_l,
        trim(a.nome_arq) as nome_arq,
        trim(a.arquivo) as arquivo,
        coalesce(a.agendamento_ordem_fixa, false) as agendamento_ordem_fixa,
        a.qtd_pesagem,
        trim(a.status) as status
      FROM sagi_caminhao a
      WHERE a.idnum not in (select b.codigo from sagi_isat_sinc b where b.tipo='SAGI_CAMINHAO' and b.token = '${token}')
      ORDER BY a.idnum
    `);
    return result[1].rows;
  }
}

module.exports = TipoCaminhaoModel;
