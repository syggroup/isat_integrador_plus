class ClientesModel {
  constructor(db) {
    this.db = db;
  }

  async getAll({ token }) {
    await this.db.query("SET client_encoding TO 'SQL_ASCII'");
    const result = await this.db.query(`
      SELECT 'cliente'::text as tipo,
        tiraacento(trim(a.cliente)) as nome,
        tiraacento(trim(a.fantasia)) as apelido,
        tiraacento(trim(a.ende)) as endereco,
        tiraacento(trim(a.bairro)) as bairro,
        tiraacento(trim(a.numende)) as numero,
        tiraacento(trim(a.compl_ende)) as complemento,
        trim(a.cep) as cep,
        a.dat_nasc as data_nasc,
        a.numcid as id_cidade,
        trim(a.email) as email,
        trim(a.latitude) as latitude,
        trim(a.longitude) as longitude,
        a.codcli as codigo,
        0 as num_col,
        trim(a.status) as status,
        regexp_replace(ltrim(trim(a.fone), '0'), '\\D', '', 'g') as tel1,
        regexp_replace(ltrim(trim(a.fone2), '0'), '\\D', '', 'g') as tel2,
        trim(a.tipojf) as tp,
        case when trim(a.tipojf) = 'F' then regexp_replace(trim(a.cpf), '\\D', '', 'g') else regexp_replace(trim(a.cgc), '\\D', '', 'g') end as cpf_cnpj
      FROM cag_cli a
      WHERE a.codcli not in (select b.codigo from sagi_isat_sinc b where b.tipo='CLIENTE' and b.token = '${token}')
      ORDER BY a.codcli
    `);
    return result[1].rows;
  }

  async get({ codigo }) {
    await this.db.query("SET client_encoding TO 'SQL_ASCII'");
    const result = await this.db.query(`
      SELECT 'cliente'::text as tipo,
        tiraacento(trim(a.cliente)) as nome,
        tiraacento(trim(a.fantasia)) as apelido,
        tiraacento(trim(a.ende)) as endereco,
        tiraacento(trim(a.bairro)) as bairro,
        tiraacento(trim(a.numende)) as numero,
        tiraacento(trim(a.compl_ende)) as complemento,
        trim(a.cep) as cep,
        a.dat_nasc as data_nasc,
        a.numcid as id_cidade,
        trim(a.email) as email,
        trim(a.latitude) as latitude,
        trim(a.longitude) as longitude,
        a.codcli as codigo,
        0 as num_col,
        trim(a.status) as status,
        regexp_replace(ltrim(trim(a.fone), '0'), '\\D', '', 'g') as tel1,
        regexp_replace(ltrim(trim(a.fone2), '0'), '\\D', '', 'g') as tel2,
        trim(a.tipojf) as tp,
        case when trim(a.tipojf) = 'F' then regexp_replace(trim(a.cpf), '\\D', '', 'g') else regexp_replace(trim(a.cgc), '\\D', '', 'g') end as cpf_cnpj
      FROM cag_cli a
      WHERE a.codcli = ${codigo}
    `);
    return result[1].rows;
  }
}

module.exports = ClientesModel;
