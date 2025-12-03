class CategoriaDeProdutosModel {
  constructor(db) {
    this.db = db;
  }

  /*
    CREATE TABLE IF NOT EXISTS sagi_cag_cat
    (
      id BIGSERIAL,
      codcat NUMERIC(10) NOT NULL,
      descricao CHARACTER VARYING(100) NOT NULL,
      nivel CHARACTER VARYING(20) NOT NULL,
      tipo CHARACTER VARYING(25) NOT NULL,
      classe CHARACTER VARYING(30) NOT NULL,
      posicao NUMERIC(10,0) NOT NULL,
      ccusto CHARACTER VARYING(40),
      cad_data DATE,
      restricao NUMERIC(5,2) NOT NULL,
      caminho_cat TEXT NOT NULL,
      id_cliente INTEGER NOT NULL,
      id_filial INTEGER NOT NULL,
      id_sagi_cag_cdc INTEGER,
      id_sagi_senha INTEGER,
      CONSTRAINT pkey_sagi_cag_cat PRIMARY KEY (id),
      CONSTRAINT uq_sagi_cag_cat_cliente UNIQUE (codcat, id_cliente),
      CONSTRAINT fk_sagi_cag_cat_filiais FOREIGN KEY (id_filial)
        REFERENCES filiais (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
      CONSTRAINT fk_sagi_cag_cat_cliente FOREIGN KEY (id_cliente)
        REFERENCES cliente (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
      CONSTRAINT fk_sagi_cag_cat_sagi_cag_cdc FOREIGN KEY (id_sagi_cag_cdc)
        REFERENCES sagi_cag_cdc (id) MATCH FULL
        ON UPDATE NO ACTION
        ON DELETE CASCADE
    )
  */

  async getAll({ token }) {
    await this.db.query("SET client_encoding TO 'SQL_ASCII'");
    const result = await this.db.query(`
      SELECT a.codcat,
        tiraacento(trim(a.descricao)) as descricao,
        trim(a.nivel) as nivel,
        tiraacento(trim(a.tipo)) as tipo,
        tiraacento(trim(a.classe)) as classe,
        case when trim(a.empresa) <> '' then trim(a.empresa) else 'TODAS' end as filial,
        (select s.iduser from senha s where trim(a.cad_usuario) = trim(s.usuario) limit 1) as iduser,
        (select c.cag_cdc_id from cag_cdc c where trim(a.codcdc) = trim(c.codcdc) limit 1) as codcdc,
        a.posicao,
        tiraacento(trim(a.ccusto)) as ccusto,
        a.cad_data,
        a.restricao,
        tiraacento(trim(a.caminho_cat)) as caminho_cat
      FROM cag_cat a
      WHERE a.codcat not in (select b.codigo from sagi_isat_sinc b where b.tipo='CAG_CAT' and b.token = '${token}')
      ORDER BY a.codcat
    `);
    return result[1].rows;
  }
}

module.exports = CategoriaDeProdutosModel;
