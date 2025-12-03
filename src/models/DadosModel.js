class DadosModel {
  constructor(db) {
    this.db = db;
  }

  async get() {
    await this.db.query("SET client_encoding TO 'SQL_ASCII'");
    const result = await this.db.query(
      `
        SELECT trim(gps_aberto) as gps_aberto,
          filiais,
          nomegeral,
          coalesce(trim(versao), '0.0.0.0') as versao,
          (
            SELECT EXISTS (
              SELECT 1
              FROM sagi_parametros
              WHERE parametro_parametro = 'HAB_SERVICOS_3_0'
                AND coalesce(parametro_valor, '.F.') = '.T.'
            )
          ) as hab_servicos_3,
          (
            SELECT EXISTS (
              SELECT 1
              FROM pg_proc p
              JOIN pg_namespace n ON n.oid = p.pronamespace
              WHERE p.proname = 'syg_crud_ordem_serv3'
            )
          ) as existe_pl_syg_crud_ordem_serv3
        FROM dados
      `
    );
    return result[1].rows;
  }

  async set({ datetime }) {
    await this.db.query("SET client_encoding TO 'SQL_ASCII'");
    const result = await this.db.query(
      `UPDATE dados SET gps_aberto = '${datetime}'`
    );
    return result[1].rowCount;
  }

  async getForcaAtualizacao() {
    await this.db.query("SET client_encoding TO 'SQL_ASCII'");
    const result = await this.db.query("SELECT forca_atua FROM dados");
    return result[1].rows[0].forca_atua;
  }

  async getNomeGeral() {
    await this.db.query("SET client_encoding TO 'SQL_ASCII'");
    const result = await this.db.query("SELECT nomegeral FROM dados");
    return result[1].rows[0].nomegeral;
  }

  async getCountMenuPermissa(idfuncao) {
    await this.db.query("SET client_encoding TO 'SQL_ASCII'");
    const result = await this.db.query(`SELECT count(*) FROM permissa WHERE idfuncao = ${idfuncao}`);
    return result[1].rows[0].count;
  }

  async getFunctionExists(nome_funcao) {
    await this.db.query("SET client_encoding TO 'SQL_ASCII'");
    const result = await this.db.query(`select count(*) from pg_proc where proname = '${nome_funcao}'`);
    return result[1].rows[0].count;
  }
}

module.exports = DadosModel;
