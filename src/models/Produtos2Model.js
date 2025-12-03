class Produtos2Model {
  constructor(db) {
    this.db = db;
  }

  /*
    CREATE TABLE IF NOT EXISTS sagi_cag_pr2 (
      id BIGSERIAL,
      sr_recno INTEGER NOT NULL,
      id_referencia_codfor INTEGER NOT NULL,
      id_sagi_cag_pro INTEGER NOT NULL,
      produto_forcli CHARACTER VARYING(50),
      preco NUMERIC(15,5) NOT NULL,
      precof NUMERIC(15,5) NOT NULL,
      precos NUMERIC(15,5) NOT NULL,
      precofs NUMERIC(15,5) NOT NULL,
      dtatual DATE,
      id_sagi_senha_usuario INTEGER,
      validade DATE,
      peso_acima NUMERIC(18,3) NOT NULL,
      prc_acima NUMERIC(15,5) NOT NULL,
      peso_ac2 NUMERIC(18,3) NOT NULL,
      prc_ac2 NUMERIC(15,5) NOT NULL,
      peso_baixo NUMERIC(18,3) NOT NULL,
      prc_baixo NUMERIC(15,5) NOT NULL,
      bloqueado BOOLEAN NOT NULL,
      preco_nf NUMERIC(15,5) NOT NULL,
      id_sagi_senha_usuario_autoriza INTEGER,
      taxa_conv NUMERIC(6,2) NOT NULL,
      dest_direta BOOLEAN NOT NULL,
      id_cliente INTEGER NOT NULL,
      CONSTRAINT pkey_sagi_cag_pr2 PRIMARY KEY (id),
      CONSTRAINT uq_sagi_cag_pr2_cliente UNIQUE (sr_recno, id_cliente),
      CONSTRAINT fk_sagi_cag_pr2_cliente FOREIGN KEY (id_cliente)
        REFERENCES cliente (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
      CONSTRAINT fk_sagi_cag_pr2_referencia_codfor FOREIGN KEY (id_referencia_codfor)
        REFERENCES referencias (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
      CONSTRAINT fk_sagi_cag_pr2_sagi_cag_pro FOREIGN KEY (id_sagi_cag_pro)
        REFERENCES sagi_cag_pro (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
    )
  */

  async getAll({ token }) {
    await this.db.query("SET client_encoding TO 'SQL_ASCII'");
    const result = await this.db.query(`
      SELECT a.sr_recno,
        a.codfor as id_referencia_codfor,
        (select cp.sr_recno from cag_pro cp where trim(cp.codpro) = trim(a.codpro) and trim(cp.subcod) = trim(a.subcod) limit 1) as id_sagi_cag_pro,
        tiraacento(trim(a.produto_forcli)) as produto_forcli,
        a.preco,
        a.precof,
        a.precos,
        a.precofs,
        a.dtatual,
        (select s.iduser from senha s where trim(a.usuario) = trim(s.usuario) limit 1) as id_sagi_senha_usuario,
        a.validade,
        a.peso_acima,
        a.prc_acima,
        a.peso_ac2,
        a.prc_ac2,
        a.peso_baixo,
        a.prc_baixo,
        coalesce(a.bloqueado, false) as bloqueado,
        a.preco_nf,
        (select s.iduser from senha s where trim(a.usuario_autoriza) = trim(s.usuario) limit 1) as id_sagi_senha_usuario_autoriza,
        a.taxa_conv,
        coalesce(a.dest_direta, false) as dest_direta
      FROM cag_pr2 a
      WHERE a.sr_recno not in (select b.codigo from sagi_isat_sinc b where b.tipo='CAG_PR2' and b.token = '${token}')
      ORDER BY a.sr_recno
    `);
    return result[1].rows;
  }
}

module.exports = Produtos2Model;
