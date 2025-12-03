class ChecklistModel {
  constructor(db) {
    this.db = db;
  }

  /*
    CREATE TABLE IF NOT EXISTS sagi_amb_checklist_base
    (
      id BIGSERIAL,
      checklist_id NUMERIC(10) NOT NULL,
      tipo NUMERIC(1) NOT NULL,
      descricao CHARACTER VARYING(255) NOT NULL,
      id_sagi_senha INTEGER,
      data DATE NOT NULL,
      hora CHARACTER VARYING(8) NOT NULL,
      id_filial INTEGER NOT NULL,
      id_cliente INTEGER NOT NULL,
      CONSTRAINT pkey_sagi_amb_checklist_base PRIMARY KEY (id),
      CONSTRAINT uq_sagi_amb_checklist_base_cliente UNIQUE (checklist_id, id_cliente),
      CONSTRAINT fk_sagi_amb_checklist_base_filiais FOREIGN KEY (id_filial)
        REFERENCES filiais (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
      CONSTRAINT fk_sagi_amb_checklist_base_cliente FOREIGN KEY (id_cliente)
        REFERENCES cliente (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
    )
  */

  async getAll({ token }) {
    await this.db.query("SET client_encoding TO 'SQL_ASCII'");
    const result = await this.db.query(`
      SELECT a.id as checklist_id,
        a.tipo,
        tiraacento(trim(a.descricao)) as descricao,
        (select s.iduser from senha s where trim(a.usuario) = trim(s.usuario) limit 1) as iduser,
        a.data,
        trim(a.hora) as hora,
        case when trim(a.empresa) <> '' then trim(a.empresa) else 'TODAS' end as filial
      FROM sagi_amb_checklist_base a
      WHERE a.id not in (select b.codigo from sagi_isat_sinc b where b.tipo='SAGI_AMB_CHECKLIST_BASE' and b.token = '${token}')
      ORDER BY a.id
    `);
    return result[1].rows;
  }
}

module.exports = ChecklistModel;
