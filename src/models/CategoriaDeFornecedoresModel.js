class CategoriaDeFornecedoresModel {
  constructor(db) {
    this.db = db;
  }

  /*
    CREATE TABLE IF NOT EXISTS sagi_categor
    (
      id BIGSERIAL,
      cls NUMERIC(10) NOT NULL,
      categoria CHARACTER VARYING(35) NOT NULL,
      obs CHARACTER VARYING(10) NOT NULL,
      nao_blq_prc_tabdif_fsd BOOLEAN NOT NULL,
      id_cliente INTEGER NOT NULL,
      id_filial INTEGER NOT NULL,
      CONSTRAINT pkey_sagi_categor PRIMARY KEY (id),
      CONSTRAINT uq_sagi_categor_cliente UNIQUE (cls, id_cliente),
      CONSTRAINT fk_sagi_categor_filiais FOREIGN KEY (id_filial)
        REFERENCES filiais (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
      CONSTRAINT fk_sagi_categor_cliente FOREIGN KEY (id_cliente)
        REFERENCES cliente (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
    )
  */

  async getAll({ token }) {
    await this.db.query("SET client_encoding TO 'SQL_ASCII'");
    const result = await this.db.query(`
      SELECT a.cls,
        tiraacento(trim(a.categoria)) as categoria,
        tiraacento(trim(a.obs)) as obs,
        case when trim(a.empresa) <> '' then trim(a.empresa) else 'TODAS' end as filial,
        coalesce(a.nao_blq_prc_tabdif_fsd, false) as nao_blq_prc_tabdif_fsd
      FROM categor a
      WHERE a.cls not in (select b.codigo from sagi_isat_sinc b where b.tipo='CATEGOR' and b.token = '${token}')
      ORDER BY a.cls
    `);
    return result[1].rows;
  }
}

module.exports = CategoriaDeFornecedoresModel;
