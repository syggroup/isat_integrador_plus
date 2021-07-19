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
}

module.exports = ParametrosModel;
