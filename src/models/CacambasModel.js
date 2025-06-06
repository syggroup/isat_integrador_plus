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
            WHERE parametro_parametro = 'USA_ISAT' AND parametro_empresa = 'MATRIZ' LIMIT 1
          ) as usa,
          (
            SELECT parametro_valor
            FROM sagi_parametros
            WHERE parametro_parametro = 'TOKEN_ISAT' AND parametro_empresa = 'MATRIZ' LIMIT 1
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
              WHERE parametro_parametro = 'USA_ISAT' AND parametro_empresa = 'FILIAL${x}' LIMIT 1
            ) as usa,
            (
              SELECT parametro_valor
              FROM sagi_parametros
              WHERE parametro_parametro = 'TOKEN_ISAT' AND parametro_empresa = 'FILIAL${x}' LIMIT 1
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
      SELECT CASE WHEN forcli = 'F' THEN 'fornecedor' WHEN forcli = 'C' THEN 'cliente' ELSE '' END as tipo_referencia,
        a.codfor::text as codigo,
        0::text as num_col,
        trim(tiraacento(numero))::text as numero,
        b.id::text as tipo_cacamba,
        b.descricao as desc_tipo_cacamba,
        coalesce(c.sr_recno, 0) > 0 as atualizado,
        (
          SELECT EXISTS (
            SELECT 1
            FROM sagi_parametros
            WHERE parametro_parametro = 'INFORMA_CACAMBAS'
              AND substr(parametro_valor, 1, 1) = '5'
          )
        ) as movimenta_cacamba,
        case when trim(a.situacao) != 'INATIVA' then 'true' else 'false' end as status
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

    const result_old = await this.db.query(`SELECT codfor FROM containe WHERE trim(tiraacento(numero)) = '${data.placa}' LIMIT 1`);

    if (result_old[1].rows.length === 0) {
      return 0;
    }

    if (parseInt(result_old[1].rows[0].codfor, 10) === parseInt(data.codigo, 10)) {
      return 1;
    }

    let result = null;

    if (parseInt(data.codigo, 10) === 0) {
      result = await this.db.query(`
        UPDATE containe
        SET codfor=0,
          datasai = null,
          status = 'R',
          forcli = '',
				  fornecedor = '',
				  local = '',
          retorno = current_date,
          placa = '',
				  motorista = ''
        WHERE trim(tiraacento(numero)) = '${data.placa}'
      `);
    } else {
      result = await this.db.query(`
        UPDATE containe
        SET codfor=${data.codigo},
          datasai = ${data.data ? `'${data.data}'` : 'null'},
          status = 'F',
				  forcli = '${data.tipo_referencia.substr(0, 1)}',
				  fornecedor = (select ${data.tipo_referencia.substr(0, 1) === 'F' ? 'fornecedor' : 'cliente'} from ${data.tipo_referencia.substr(0, 1) === 'F' ? 'cag_for' : 'cag_cli'} where ${data.tipo_referencia.substr(0, 1) === 'F' ? 'codfor' : 'codcli'} = ${data.codigo} limit 1),
          retorno = null
        WHERE trim(tiraacento(numero)) = '${data.placa}'
      `);
    }

    if (parseInt(data.numero_ordem, 10) !== 0 && data.placa_veiculo && data.for_cli && data.filial && data.hcont && data.observa) {
      await this.db.query(`
        INSERT INTO sagi_his_containe (
          hcont_numero,
          hcont_tipo,
          hcont_observacao,
          hcont_forcli,
          hcont_codfor,
          hcont_ordem,
          hcont_placa,
          hcont_data,
          hcont_hora,
          hcont_usuario,
          hcont_empresa
        ) VALUES (
          (select numero from containe WHERE trim(tiraacento(numero)) = '${data.placa}' limit 1),
          '${data.hcont}',
          '${data.observa}'||' NA ORDEM DE COLETA NO DIA '||'${data.data}',
          '${data.for_cli}',
          ${parseInt(data.codigo, 10)},
          '${data.numero_ordem}',
          '${data.placa_veiculo}',
          '${data.data}',
          '${data.hora}',
          'DRIVERSAT',
          '${data.filial}'
        );
      `);
    }

    return result[1].rowCount;
  }

  async getWithChr13OrChr10() {
    await this.db.query("SET client_encoding TO 'SQL_ASCII'");
    const result = await this.db.query(`SELECT count(*) FROM containe WHERE POSITION(chr(10) IN numero) > 0 OR POSITION(chr(13) IN numero) > 0 OR POSITION('"' IN numero) > 0`);
    return result[1].rows[0].count;
  }

  async updateWithChr13OrChr10() {
    await this.db.query("SET client_encoding TO 'SQL_ASCII'");
    const result_u_1 = await this.db.query(`UPDATE containe SET numero=REPLACE(numero, chr(10), '') WHERE POSITION(chr(10) IN numero) > 0`);
    const result_u_2 = await this.db.query(`UPDATE containe SET numero=REPLACE(numero, chr(13), '') WHERE POSITION(chr(13) IN numero) > 0`);
    const result_u_3 = await this.db.query(`UPDATE containe SET numero=REPLACE(numero, '"', '') WHERE POSITION('"' IN numero) > 0`);
    return result_u_1[1].rowCount + result_u_2[1].rowCount + result_u_3[1].rowCount;
  }
}

module.exports = CacambasModel;
