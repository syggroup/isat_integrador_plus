class CredoresModel {
  constructor(db) {
    this.db = db;
  }

  /*
    alter table referencias add column id_sagi_classes integer default null
    alter table referencias add constraint fk_referencias_sagi_classes foreign key (id_sagi_classes) references sagi_classes (id)
  */

  async getAll({ token }) {
    await this.db.query("SET client_encoding TO 'SQL_ASCII'");

    // Verificar se as colunas existem
    const columnCheck = await this.db.query(`
      SELECT COUNT(CASE WHEN column_name = 'latitude' THEN 1 END) > 0 as has_latitude,
        COUNT(CASE WHEN column_name = 'longitude' THEN 1 END) > 0 as has_longitude
      FROM information_schema.columns
      WHERE table_name = 'cag_cre'
    `);

    const hasLatitude = columnCheck[1].rows[0].has_latitude;
    const hasLongitude = columnCheck[1].rows[0].has_longitude;

    const latitudeField = hasLatitude ? "COALESCE(trim(a.latitude), '') as latitude" : "'' as latitude";
    const longitudeField = hasLongitude ? "COALESCE(trim(a.longitude), '') as longitude" : "'' as longitude";

    const result = await this.db.query(`
      SELECT a.codcre,
        tiraacento(trim(a.credor)) as credor,
        tiraacento(trim(a.fanta)) as fanta,
        tiraacento(trim(a.ende)) as ende,
        tiraacento(trim(a.bairro)) as bairro,
        tiraacento(trim(a.numende)) as numende,
        tiraacento(trim(a.compl_ende)) as compl_ende,
        trim(a.cep) as cep,
        a.dat_nasc as dat_nasc,
        case when a.numcid = 0 then null else a.numcid end as numcid,
        trim(a.email) as email,
        regexp_replace(ltrim(trim(a.fone), '0'), '\\D', '', 'g') as fone,
        regexp_replace(ltrim(trim(a.fone2), '0'), '\\D', '', 'g') as fone2,
        trim(a.tip) as tip,
        case when trim(a.tip) = 'F' then regexp_replace(trim(a.cpf), '\\D', '', 'g') else regexp_replace(trim(a.cgc), '\\D', '', 'g') end as cpf_cnpj,
        trim(a.status) as status,
        (select classes.cod_clas from classes where trim(classes.classe) = trim(a.classe) limit 1) as id_sagi_classes,
        ${latitudeField},
        ${longitudeField}
      FROM cag_cre a
      WHERE a.codcre not in (select b.codigo from sagi_isat_sinc b where b.tipo='CAG_CRE' and b.token = '${token}')
      ORDER BY a.codcre
    `);
    return result[1].rows;
  }
}

module.exports = CredoresModel;
