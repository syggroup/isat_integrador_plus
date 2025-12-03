class SagiUnidadesModel {
  constructor(db) {
    this.db = db;
  }

  /*
    CREATE TABLE IF NOT EXISTS sagi_unidade
    (
      id BIGSERIAL,
      unidade_id NUMERIC(10) NOT NULL,
      unidade_descricao CHARACTER VARYING(50) NOT NULL,
      principal BOOLEAN NOT NULL,
      naoexigeimagem BOOLEAN NOT NULL,
      naobloq_nfsai BOOLEAN NOT NULL,
      naobloq_ordem_placa BOOLEAN NOT NULL,
      naobloq_ordem_placa_emb BOOLEAN NOT NULL,
      bloq_emis_bol_retro_und NUMERIC(10) NOT NULL,
      naoexibir_palm BOOLEAN NOT NULL,
      id_cliente INTEGER NOT NULL,
      id_filial INTEGER NOT NULL,
      CONSTRAINT pkey_sagi_unidade PRIMARY KEY (id),
      CONSTRAINT uq_sagi_unidade_cliente UNIQUE (unidade_id, id_cliente),
      CONSTRAINT fk_sagi_unidade_cliente FOREIGN KEY (id_cliente)
        REFERENCES cliente (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
      CONSTRAINT fk_sagi_unidade_filiais FOREIGN KEY (id_filial)
        REFERENCES filiais (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
    )
  */

  async getAll({ token }) {
    await this.db.query("SET client_encoding TO 'SQL_ASCII'");
    const result = await this.db.query(`
      SELECT a.unidade_id,
        case when trim(a.empresa) <> '' then trim(a.empresa) else 'TODAS' end as filial,
        trim(a.unidade_descricao) as unidade_descricao,
        coalesce(a.principal, false) as principal,
        coalesce(a.naoexigeimagem, false) as naoexigeimagem,
        coalesce(a.naobloq_nfsai, false) as naobloq_nfsai,
        coalesce(a.naobloq_ordem_placa, false) as naobloq_ordem_placa,
        coalesce(a.naobloq_ordem_placa_emb, false) as naobloq_ordem_placa_emb,
        a.bloq_emis_bol_retro_und,
        coalesce(a.naoexibir_palm, false) as naoexibir_palm
      FROM sagi_unidade a
      WHERE a.unidade_id not in (select b.codigo from sagi_isat_sinc b where b.tipo='SAGI_UNIDADE' and b.token = '${token}')
      ORDER BY a.unidade_id
    `);
    return result[1].rows;
  }
}

module.exports = SagiUnidadesModel;
