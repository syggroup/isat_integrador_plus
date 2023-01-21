class CacambasModel {
  constructor(db) {
    this.db = db;
  }

  async getBranchesWithTheSameToken(token, nfiliais) {
    await this.db.query("SET client_encoding TO 'SQL_ASCII'");
    let sql = `
      (
        SELECT
          (
            SELECT parametro_valor
            FROM sagi_parametros
            WHERE parametro_parametro = 'USA_ISAT' AND parametro_empresa = 'MATRIZ'
          ) as usa,
          (
            SELECT parametro_valor
            FROM sagi_parametros
            WHERE parametro_parametro = 'TOKEN_ISAT' AND parametro_empresa = 'MATRIZ'
          ) as token,
          (select 'MATRIZ')::text as filial
      )
    `;
    for (let x = 1; x < nfiliais; x++) {
      sql += `
        UNION ALL
        (
          SELECT
            (
              SELECT parametro_valor
              FROM sagi_parametros
              WHERE parametro_parametro = 'USA_ISAT' AND parametro_empresa = 'FILIAL${x}'
            ) as usa,
            (
              SELECT parametro_valor
              FROM sagi_parametros
              WHERE parametro_parametro = 'TOKEN_ISAT' AND parametro_empresa = 'FILIAL${x}'
            ) as token,
            (select 'FILIAL${x}')::text as filial
        )
      `;
    }
    const result = await this.db.query(sql);
    const branches = ["TODAS"];
    result[1].rows.forEach((reg) => {
      if (reg.usa === ".T." && reg.token === token) {
        branches.push(reg.filial);
      }
    });
    return branches;
  }

  async get({ token, nfiliais }) {
    await this.db.query("SET client_encoding TO 'SQL_ASCII'");
    const branches = await this.getBranchesWithTheSameToken(token, nfiliais);
    const result = await this.db.query(`
      SELECT CASE WHEN forcli = 'F' THEN 'fornecedor' WHEN forcli = 'C' THEN 'cliete' ELSE '' END as tipo_referencia,
        a.codfor::text as codigo,
        0::text as num_col,
        trim(numero)::text as numero,
        b.id::text as tipo_cacamba,
        b.descricao as desc_tipo_cacamba,
        coalesce(c.sr_recno, 0) > 0 as atualizado
      FROM containe a
      LEFT JOIN sagi_isat_sinc c ON c.tipo='CONTAINE'
        AND c.codigo=a.sr_recno
        AND c.token = '${token}'
      LEFT JOIN sagi_tipo_container b ON trim(a.tipo) = trim(b.descricao) ${
        " WHERE a.empresa in ('" + branches.join("','") + "')"
      }
    `);
    return result[1].rows;
  }

  async update(data) {
    await this.db.query("SET client_encoding TO 'SQL_ASCII'");

    if (parseInt(data.codigo, 10) === 0) {
      const result = await this.db.query(`
        UPDATE containe
        SET codfor=${data.codigo},
          datasai = null,
          status = 'R',
          forcli = '',
				  fornecedor = '',
				  local = '',
          retorno = current_date,
          placa = '',
				  motorista = ''
        WHERE trim(numero) = '${data.placa}'
      `);
      return result[1].rowCount;
    } else {
      const result2 = await this.db.query(`
        UPDATE containe
        SET codfor=${data.codigo},
          datasai = ${data.data ? `'${data.data}'` : 'null'},
          status = 'F',
				  forcli = '${data.tipo_referencia.substr(0, 1)}',
				  fornecedor = (select ${data.tipo_referencia.substr(0, 1) === 'F' ? 'fornecedor' : 'cliente'} from ${data.tipo_referencia.substr(0, 1) === 'F' ? 'cag_for' : 'cag_cli'} where ${data.tipo_referencia.substr(0, 1) === 'F' ? 'codfor' : 'codcli'} = ${data.codigo} limit 1),
          retorno = null
        WHERE trim(numero) = '${data.placa}'
      `);
      return result2[1].rowCount;
    }
  }
}

module.exports = CacambasModel;
