class ConcorrentesModel {
  constructor(db) {
    this.db = db;
  }

  async get({ token }) {
    await this.db.query("SET client_encoding TO 'SQL_ASCII'");
    const result = await this.db.query(`
      SELECT 'concorrente'::text as tipo,
        tiraacento(trim(a.nome)) as nome,
        tiraacento(trim(a.ende)) as endereco,
        tiraacento(trim(a.bairro)) as bairro,
        '' as numero,
        '' as complemento,
        trim(a.cep) as cep,
        '' as data_nasc,
        a.numcid as id_cidade,
        trim(a.email) as email,
        trim(a.latitude) as latitude,
        trim(a.longitude) as longitude,
        a.codcon as codigo,
        0 as num_col,
        'ATIVO' as status,
        regexp_replace(ltrim(trim(a.fone), '0'), '\D', '', 'g') as tel1,
        regexp_replace(ltrim(trim(a.fone2), '0'), '\D', '', 'g') as tel2
      FROM cag_conco a
      WHERE a.codcon not in (select b.codigo from sagi_isat_sinc b where b.tipo='CONCORRENTE' and b.token = '${token}')
      ORDER BY a.codcon
    `);
    return result[1].rows;
  }
}

module.exports = ConcorrentesModel;
