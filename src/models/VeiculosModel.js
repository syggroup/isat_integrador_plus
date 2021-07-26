class VeiculosModel {
  constructor(db) {
    this.db = db;
  }

  async update(data) {
    await this.db.query("SET client_encoding TO 'UTF-8'");
    const result = await this.db.query(`
      UPDATE sagi_cad_ativo
      SET ativo_gps_ignicao=${data.ignicao},
        ativo_gps_velocidade=${data.velocidade},
        ativo_gps_latitude='${data.latitude}',
        ativo_gps_longitude='${data.longitude}',
        ativo_gps_endereco='${data.endereco}',
        ativo_gps_ult_data='${data.data}',
        ativo_gps_ult_hora='${data.hora}',
        ativo_rastreador='ISAT'
      WHERE (ativo_rastreador<>'ISAT' OR ativo_rastreador='ISAT') AND ativo_placa = '${data.placa}'
    `);
    await this.db.query("SET client_encoding TO 'SQL_ASCII'");
    return result[1].rowCount;
  }
}

module.exports = VeiculosModel;
