class VeiculosModel {
  constructor(db) {
    this.db = db;
  }

  async update(registro, altera_motorista) {
    await this.db.query("SET client_encoding TO 'UTF-8'");
    const result = await this.db.query(`
      UPDATE sagi_cad_ativo
      SET ativo_gps_ignicao=${registro.ignicao},
        ativo_gps_velocidade=${registro.velocidade},
        ativo_gps_latitude='${registro.latitude}',
        ativo_gps_longitude='${registro.longitude}',
        ativo_gps_endereco='${registro.endereco}',
        ativo_gps_ult_data=${registro.data !== null ? `'${registro.data}'` : null},
        ativo_gps_ult_hora='${registro.hora !== null ? registro.hora : ''}',
        ativo_rastreador='ISAT'${altera_motorista ? `,ativo_mot_codigo=${registro.codmot},ativo_mot_nome=(SELECT motorista FROM mot WHERE codmot = ${registro.codmot})` : ''}
      WHERE (ativo_rastreador<>'ISAT' OR ativo_rastreador='ISAT') AND ativo_placa = '${registro.placa}'
    `);
    await this.db.query("SET client_encoding TO 'SQL_ASCII'");
    return result[1].rowCount;
  }

  async notFindInIsatAndUpdate(data) {
    await this.db.query("SET client_encoding TO 'SQL_ASCII'");

    const result_ativos = await this.db.query(`
      SELECT a.ativo_id
      FROM sagi_cad_ativo a
      WHERE trim(a.ativo_rastreador)<>'NENHUM'
        AND trim(a.ativo_placa) not in('${data.join("','")}')
    `);

    const ativo_ids_update = [];
    for (const ativo of result_ativos[1].rows) {
      ativo_ids_update.push(ativo.ativo_id);
    }

    if (ativo_ids_update.length > 0) {
      const result_update = await this.db.query(`
        UPDATE sagi_cad_ativo
        SET ativo_rastreador='NENHUM'
        WHERE ativo_id in(${ativo_ids_update.join(",")})
      `);

      return result_update[1].rowCount;
    } else {
      return 0;
    }
  }
}

module.exports = VeiculosModel;
