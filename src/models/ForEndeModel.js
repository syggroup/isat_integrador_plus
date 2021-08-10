class ForEndeModel {
  constructor(db) {
    this.db = db;
  }

  async getAll({ token }) {
    await this.db.query("SET client_encoding TO 'SQL_ASCII'");
    const result = await this.db.query(`
      SELECT 'fornecedor'::text as tipo,
        tiraacento(trim(e.nome_col)) as nome,
        tiraacento(trim(e.ende)) as endereco,
        tiraacento(trim(e.bairro)) as bairro,
        '' as numero,
        '' as complemento,
        trim(e.cep) as cep,
        b.dat_nasc as data_nasc,
        (select trim(cidade_codigo_ibge) from sagi_cidades_brazil where trim(cidade_uf) = trim(e.uf) and trim(cidade_cidade) = trim(e.cidade) limit 1) as id_cidade,
        trim(b.email) as email,
        trim(e.latitude) as latitude,
        trim(e.longitude) as longitude,
        e.codfor as codigo,
        e.num_col,
        trim(e.status) as status,
        regexp_replace(ltrim(trim(b.fone), '0'), '\D', '', 'g') as tel1,
        regexp_replace(ltrim(trim(b.tel2), '0'), '\D', '', 'g') as tel2
      FROM for_ende e
      LEFT JOIN cag_for b ON e.codfor = b.codfor
      WHERE e.codfor in (
        SELECT a.codfor
        FROM cag_for a
        WHERE a.codfor not in (select b.codigo from sagi_isat_sinc b where b.tipo='FORNECEDOR' and b.token = '${token}')
      )
      ORDER BY e.codfor
    `);
    return result[1].rows;
  }

  async get({ codigo, num_col }) {
    await this.db.query("SET client_encoding TO 'SQL_ASCII'");
    const result = await this.db.query(`
      SELECT 'fornecedor'::text as tipo,
        tiraacento(trim(e.nome_col)) as nome,
        tiraacento(trim(e.ende)) as endereco,
        tiraacento(trim(e.bairro)) as bairro,
        '' as numero,
        '' as complemento,
        trim(e.cep) as cep,
        b.dat_nasc as data_nasc,
        (select trim(cidade_codigo_ibge) from sagi_cidades_brazil where trim(cidade_uf) = trim(e.uf) and trim(cidade_cidade) = trim(e.cidade) limit 1) as id_cidade,
        trim(b.email) as email,
        trim(e.latitude) as latitude,
        trim(e.longitude) as longitude,
        e.codfor as codigo,
        e.num_col,
        trim(e.status) as status,
        regexp_replace(ltrim(trim(b.fone), '0'), '\D', '', 'g') as tel1,
        regexp_replace(ltrim(trim(b.tel2), '0'), '\D', '', 'g') as tel2
      FROM for_ende e
      LEFT JOIN cag_for b ON e.codfor = b.codfor
      WHERE e.codfor = ${codigo} and e.num_col = ${num_col}
    `);
    return result[1].rows;
  }
}

module.exports = ForEndeModel;
