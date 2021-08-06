class ParametrosModel {
  constructor(db) {
    this.db = db;
  }

  async getTokens({ filiais }) {
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
          (
            SELECT parametro_valor
            FROM sagi_parametros
            WHERE parametro_parametro = 'DATA_INICIAL_SINC_ISAT' AND parametro_empresa = 'MATRIZ'
          ) as data_inicial_sinc_isat,
          (
            SELECT case when substr(parametro_valor, 1, 1) = '5' then true else false end
            FROM sagi_parametros
            WHERE parametro_parametro = 'INFORMA_CACAMBAS' AND parametro_empresa = 'MATRIZ'
          ) as movimenta_cacamba,
          (select 'MATRIZ')::text as filial
      )
    `;

    for (let x = 1; x < filiais; x++) {
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
            (
              SELECT parametro_valor
              FROM sagi_parametros
              WHERE parametro_parametro = 'DATA_INICIAL_SINC_ISAT' AND parametro_empresa = 'FILIAL${x}'
            ) as data_inicial_sinc_isat,
            (
              SELECT case when substr(parametro_valor, 1, 1) = '5' then true else false end
              FROM sagi_parametros
              WHERE parametro_parametro = 'INFORMA_CACAMBAS' AND parametro_empresa = 'FILIAL${x}'
            ) as movimenta_cacamba,
            (select 'FILIAL${x}')::text as filial
        )
      `;
    }

    const result = await this.db.query(sql);

    return result[1].rows;
  }

  async setToken({ filial, token }) {
    await this.db.query("SET client_encoding TO 'SQL_ASCII'");
    const result = await this.db.query(`
      SELECT
        (
          SELECT parametro_valor
          FROM sagi_parametros
          WHERE parametro_parametro = 'USA_ISAT' AND parametro_empresa = '${filial}'
        ) as usa,
        (
          SELECT parametro_valor
          FROM sagi_parametros
          WHERE parametro_parametro = 'TOKEN_ISAT' AND parametro_empresa = '${filial}'
        ) as token
    `);

    if (!result[1].rows[0].token) {
      await this.db.query(`
        UPDATE sagi_parametros
        SET parametro_valor = '.T.'
        WHERE parametro_parametro = 'USA_ISAT' AND parametro_empresa = '${filial}'
      `);
    }

    await this.db.query(`
      UPDATE sagi_parametros
      SET parametro_valor = '${token}'
      WHERE parametro_parametro = 'TOKEN_ISAT' AND parametro_empresa = '${filial}'
    `);

    return;
  }

  async setAllTokens({ token, nfiliais }) {
    await this.db.query("SET client_encoding TO 'SQL_ASCII'");

    await Promise.all(
      [...Array(parseInt(nfiliais, 10)).keys()].map(async (nfilial) => {
        const filial = nfilial > 0 ? `FILIAL${nfilial}` : "MATRIZ";

        const result = await this.db.query(`
          SELECT
            (
              SELECT parametro_valor
              FROM sagi_parametros
              WHERE parametro_parametro = 'USA_ISAT' AND parametro_empresa = '${filial}'
            ) as usa,
            (
              SELECT parametro_valor
              FROM sagi_parametros
              WHERE parametro_parametro = 'TOKEN_ISAT' AND parametro_empresa = '${filial}'
            ) as token
        `);

        if (!result[1].rows[0].token) {
          await this.db.query(`
            UPDATE sagi_parametros
            SET parametro_valor = '.T.'
            WHERE parametro_parametro = 'USA_ISAT' AND parametro_empresa = '${filial}'
          `);
        }

        await this.db.query(`
          UPDATE sagi_parametros
          SET parametro_valor = '${token}'
          WHERE parametro_parametro = 'TOKEN_ISAT' AND parametro_empresa = '${filial}'
        `);
      })
    );

    return;
  }

  async checkParameterDateStartSyncIsat() {
    await this.db.query("SET client_encoding TO 'SQL_ASCII'");

    const result = await this.db.query(`
      SELECT parametro_valor, parametro_empresa
      FROM sagi_parametros
      WHERE parametro_parametro = 'DATA_INICIAL_SINC_ISAT'
    `);

    await Promise.all(
      result[1].rows.map(async (parameter) => {
        if (!parameter.parametro_valor) {
          await this.db.query(`
          UPDATE sagi_parametros
          SET parametro_valor = to_char(current_date - 7, 'DD/MM/YYYY')
          WHERE parametro_parametro = 'DATA_INICIAL_SINC_ISAT' AND parametro_empresa = '${parameter.parametro_empresa}'
        `);
        }
      })
    );

    return;
  }

  /* async checkParameterOdometer() {
    await this.db.query("SET client_encoding TO 'SQL_ASCII'");
    const result = await this.db.query(`
      SELECT parametro_valor
      FROM sagi_parametros
      WHERE parametro_parametro = 'SERVICO_HODOMETRO_ISAT' AND parametro_empresa = 'TODAS'
    `);
    return result[1].rows;
  }

  async createParameterOdometer() {
    await this.db.query("SET client_encoding TO 'SQL_ASCII'");
    await this.db.query(`
      insert into sagi_parametros(parametro_empresa,
        parametro_modulo,
        parametro_sub_modulo,
        parametro_parametro,
        parametro_tipo,
        parametro_tamanho,
        parametro_decimais,
        parametro_descricao,
        parametro_combobox,
        parametro_mascara,
        parametro_busca,
        parametro_validacao,
        parametro_pre_valid,
        parametro_funcao,
        parametro_exibe,
        parametro_link,
        parametro_valor,
        parametro_todas)
      values('TODAS',
        'GPS',
        'ISAT',
        'SERVICO_HODOMETRO_ISAT',
        'C',
        19,
        0,
        'Não vai mostrar no browse',
        0,
        '',
        0,
        0,
        0,
        0,
        false,
        0,
        '',
        true)
    `);
    return [{ parametro_valor: "" }];
  } */
}

module.exports = ParametrosModel;
