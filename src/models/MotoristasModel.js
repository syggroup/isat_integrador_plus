class MotoristasModel {
  constructor(db) {
    this.db = db;
  }

  async get({ token }) {
    await this.db.query("SET client_encoding TO 'SQL_ASCII'");
    const result = await this.db.query(`
      SELECT 'motorista'::text as tipo,
        tiraacento(trim(a.motorista)) as nome,
        tiraacento(trim(a.ende)) as endereco,
        tiraacento(trim(a.bairro)) as bairro,
        tiraacento(trim(a.numende)) as numero,
        tiraacento(trim(a.compl_ende)) as complemento,
        trim(a.cep) as cep,
        '' as data_nasc,
        (select trim(cidade_codigo_ibge) from sagi_cidades_brazil where trim(cidade_uf) = trim(a.uf) and trim(cidade_cidade) = trim(a.cidade) limit 1) as id_cidade,
        '' as email,
        trim(a.latitude) as latitude,
        trim(a.longitude) as longitude,
        a.codmot as codigo,
        0 as num_col,
        trim(a.status) as status,
        regexp_replace(ltrim(trim(a.fone), '0'), '\\D', '', 'g') as tel1,
        '' as tel2,
        trim(a.numcnh) as cnh,
        a.vencnh as cnh_validade,
        trim(a.cpf) as cpf,
        coalesce(terceiro, false) as terceiro
      FROM mot a
      WHERE a.codmot not in (select b.codigo from sagi_isat_sinc b where b.tipo='MOTORISTA' and b.token = '${token}')
      ORDER BY a.codmot
    `);
    return result[1].rows;
  }
}

module.exports = MotoristasModel;
