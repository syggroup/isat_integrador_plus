class OrdensModel {
  constructor(db) {
    this.db = db;
  }

  async get({ filial, data_inicial_sinc_isat, limit }) {
    await this.db.query("SET client_encoding TO 'SQL_ASCII'");
    const result = await this.db.query(`
        SELECT * FROM (
          SELECT a.sr_recno,
            a.acao,
            case when b.cli_for='COLETA' then 'FORNECEDOR' else 'CLIENTE' end as tipo,
            a.ordem,
            b.datasai::text,
            case when d.ativo_rastreador='ISAT' then trim(b.placa) else '' end as placa,
            b.codfor as codigo,
            b.num_col,
            b.sequencia,
            trim(b.horaapa) as horasai,
            trim(b.status) as status,
            case when length(regexp_replace(c.numcnh, '\D', '', 'g')) = 11 then coalesce(trim(c.numcnh), '') else '' end as cnh,
            trim(b.obs1) as obs,
            trim(b.empresa) as filial,
            trim(b.tipo_ret) as tipo_retorno,
            case when b.servico then 'SERVICO' when b.cli_for='COLETA' then 'COLETA' else 'EMBARQUE' end as tipo_ordem,
            trim(b.cacamba) as tipo_cacamba
          FROM isat_ordem_temp a
          LEFT JOIN ordem b on a.ordem=b.ordem
          LEFT JOIN mot as c on c.codmot=b.codmot
          LEFT JOIN sagi_cad_ativo as d on d.ativo_placa=b.placa
          WHERE a.ordem>0
            and a.acao<>'DELETE'
            and (b.empresa='${filial}' or b.empresa='TODAS')
            ${
              data_inicial_sinc_isat
                ? ` AND b.datasai >= '${data_inicial_sinc_isat.split("/").reverse().join("-")}'`
                : " AND b.datasai >= current_date - 7 "
            }
          UNION ALL
          SELECT a.sr_recno,
            a.acao,
            '' as tipo,
            a.ordem,
            current_date::text,
            '' as placa,
            0 as codigo,
            0 as numcol,
            0 as sequencia,
            '' as horasai,
            '' as status,
            '' as cnh,
            '' as obs,
            '' as filial,
            '' as tipo_retorno,
            '' as tipo_ordem,
            '' as tipo_cacamba
          FROM isat_ordem_temp a
          WHERE a.ordem>0 AND a.acao='DELETE'
        ) z
        GROUP BY 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17
        ORDER BY 1 ASC
        LIMIT ${limit}
    `);
    return result[1].rows;
  }

  async getForUpdateStatus({ filial, data_inicial_sinc_isat }) {
    await this.db.query("SET client_encoding TO 'SQL_ASCII'");
    const result = await this.db.query(`
      SELECT ordem
      FROM ordem as a
      WHERE a.datasai>=current_date-60
        AND a.datasai<=current_date+1
        ${
          data_inicial_sinc_isat
            ? ` AND a.datasai >= '${data_inicial_sinc_isat.split("/").reverse().join("-")}'`
            : ""
        }
        AND a.ordem>0
        AND (a.empresa='TODAS' or a.empresa='${filial}')
        AND a.status<>'F'
      ORDER BY a.ordem DESC
    `);
    return result[1].rows;
  }

  /* async updateForDelete({ filial }) {
    await this.db.query("SET client_encoding TO 'SQL_ASCII'");
    const result = await this.db.query(`
      UPDATE isat_ordem_temp as a
      SET acao='DELETE'
      WHERE ordem IN(
        SELECT z.ordem FROM ordem as z
        LEFT JOIN isat_ordem_temp as x on x.ordem=z.ordem
        LEFT JOIN sagi_cad_ativo as d on d.ativo_placa=z.placa
        WHERE (CASE WHEN z.placa <> '' THEN d.ativo_rastreador<>'ISAT' ELSE false END)
          AND coalesce(x.ordem,0)>0
          AND (z.empresa='${filial}' or z.empresa='TODAS')
      )
    `);
    return result[1].rowCount;
  } */

  /* async updateForDelete2() {
    await this.db.query("SET client_encoding TO 'SQL_ASCII'");
    const result = await this.db.query(`
      DELETE FROM isat_ordem_temp as a
      WHERE a.ordem IN(
        SELECT z.ordem
        FROM isat_ordem_temp as z
        LEFT JOIN ordem as b on b.ordem=z.ordem
        LEFT JOIN mot as c on c.codmot=b.codmot
        LEFT JOIN sagi_cad_ativo as d on d.ativo_placa=b.placa
        WHERE z.acao<>'DELETE'
          AND (
            CASE WHEN trim(b.placa) <> '' THEN d.ativo_rastreador<>'ISAT' ELSE false END AND
            CASE WHEN trim(coalesce(c.numcnh,'')) <> '' THEN LENGTH(trim(coalesce(c.numcnh,'')))<>11 ELSE false END
          )
        GROUP BY 1
      )
    `);
    return result[1].rowCount;
  } */

  async delete({ sr_recno }) {
    await this.db.query("SET client_encoding TO 'SQL_ASCII'");
    const result = await this.db.query(
      `DELETE FROM isat_ordem_temp as a WHERE sr_recno = ${sr_recno}`
    );
    return result[1].rowCount;
  }

  async treatCheck({ ordem, check }) {
    await this.db.query("SET client_encoding TO 'SQL_ASCII'");

    const result_ordem = await this.db.query(`
      SELECT hrchefor, hrsaifor FROM ordem WHERE ordem=${ordem}
    `);

    if (result_ordem[1].rowCount > 0) {
      if (
        (result_ordem[1].rows[0].hrchefor !== check.hora &&
          check.tipo === "ENT") ||
        (result_ordem[1].rows[0].hrsaifor !== check.hora &&
          check.tipo === "SAI")
      ) {
        await this.db.query(`
          UPDATE ordem SET ${
            check.tipo === "ENT"
              ? `hrchefor='${check.hora}'`
              : `hrsaifor='${check.hora}'`
          } WHERE ordem=${ordem}
        `);

        const result_find_check = await this.db.query(`
          SELECT 1 FROM sagi_isat_imprevisto_ordem
          WHERE ordem=${ordem}
            AND coalesce(imprevisto,false)=false
            AND data='${check.data}'
            AND hora='${check.hora}'
        `);

        if (result_find_check[1].rowCount === 0) {
          await this.db.query(`
            INSERT INTO sagi_isat_imprevisto_ordem (
              ordem,
              data,
              hora,
              motivo,
              imprevisto,
              tem_foto,
              obs
            ) VALUES (
              ${ordem},
              '${check.data}',
              '${check.hora}',
              '${check.tipo === "ENT" ? "CHECK-IN" : "CHECK-OUT"}',
              false,
              ${check.tem_foto},
              ''
            )
          `);
        }
      }
    }

    return true;
  }

  async treatImprevisto({ ordem, imprevisto }) {
    await this.db.query("SET client_encoding TO 'SQL_ASCII'");

    const result_find_imprevisto = await this.db.query(`
      SELECT 1 FROM sagi_isat_imprevisto_ordem
      WHERE ordem=${ordem}
        AND coalesce(imprevisto,false)=true
        AND data='${imprevisto.data}'
        AND hora='${imprevisto.hora}'
    `);

    if (result_find_imprevisto[1].rowCount === 0) {
      await this.db.query("SET client_encoding TO 'UTF-8'");
      await this.db.query(`
        INSERT INTO sagi_isat_imprevisto_ordem (
           ordem,
           data,
           hora,
           motivo,
           imprevisto,
           tem_foto,
           obs,
           id_isat
        ) VALUES (
          ${ordem},
          '${imprevisto.data}',
          '${imprevisto.hora}',
          '${imprevisto.motivo}',
          true,
          ${imprevisto.tem_foto},
          '${imprevisto.obs}',
          ${imprevisto.id}
        )
      `);
      await this.db.query("SET client_encoding TO 'SQL_ASCII'");
    }

    return true;
  }

  async treatCacamba({ ordem, cacamba }) {
    await this.db.query("SET client_encoding TO 'SQL_ASCII'");

    const result_ordem = await this.db.query(`
      SELECT numero, numeroret FROM ordem WHERE ordem=${ordem}
    `);

    if (result_ordem[1].rowCount > 0) {
      if (
        (result_ordem[1].rows[0].numero !== `${cacamba.numeros.join(";")};` &&
          cacamba.tipo === "IDA") ||
        (result_ordem[1].rows[0].numeroret !==
          `${cacamba.numeros.join(";")};` &&
          cacamba.tipo === "VOLTA")
      ) {
        await this.db.query("SET client_encoding TO 'UTF-8'");
        const result = await this.db.query(`
          UPDATE ordem SET ${
            cacamba.tipo === "IDA" ? "numero" : "numeroret"
          }='${cacamba.numeros.join(";")};' WHERE ordem=${ordem}
        `);
        await this.db.query("SET client_encoding TO 'SQL_ASCII'");
        return result[1].rowCount;
      }
    }

    return 0;
  }

  async treatKm({ ordem, km }) {
    await this.db.query("SET client_encoding TO 'SQL_ASCII'");

    const result_ordem = await this.db.query(`
      SELECT coalesce(kmsai, 0.0) as kmsai,
        coalesce(kmchefor, 0.0) as kmchefor,
        coalesce(kmsaifor, 0.0) as kmsaifor,
        coalesce(kmche, 0.0) as kmche
      FROM ordem
      WHERE ordem=${ordem}
    `);

    if (result_ordem[1].rowCount > 0) {
      if (
        (result_ordem[1].rows[0].kmsai != parseFloat(km.valor).toFixed(1) &&
          km.tipo === "IDA") ||
        ((result_ordem[1].rows[0].kmchefor != parseFloat(km.valor).toFixed(1) ||
          result_ordem[1].rows[0].kmsaifor !=
            parseFloat(km.valor).toFixed(1)) &&
          km.tipo === "VOLTA") ||
        (result_ordem[1].rows[0].kmche != parseFloat(km.valor).toFixed(1) &&
          km.tipo === "ENCERRA")
      ) {
        const result = await this.db.query(`
          ${
            km.tipo === "IDA"
              ? `UPDATE ordem SET kmsai=${km.valor} WHERE ordem=${ordem}`
              : km.tipo === "VOLTA"
                ? `UPDATE ordem SET kmchefor=${km.valor}, kmsaifor=${km.valor} WHERE ordem=${ordem}`
                : `UPDATE ordem SET kmche=${km.valor} WHERE ordem=${ordem}`
          }
        `);

        if (km.tipo === "ENCERRA" && parseFloat(km.valor) > 0 && parseFloat(result_ordem[1].rows[0].kmsai) > 0) {
          await this.db.query(`UPDATE ordem SET kmtot=${km.valor - result_ordem[1].rows[0].kmsai} WHERE ordem=${ordem}`);
        }

        return result[1].rowCount;
      }
    }

    return 0;
  }

  async setInitialDateTime({ ordem, date, time }) {
    await this.db.query("SET client_encoding TO 'SQL_ASCII'");

    const result_ordem = await this.db.query(`
      SELECT datasai, horaapa FROM ordem WHERE ordem=${ordem}
    `);

    if (result_ordem[1].rowCount > 0) {
      if (
        result_ordem[1].rows[0].datasai !== date ||
        result_ordem[1].rows[0].horaapa !== time
      ) {
        const result = await this.db.query(
          `UPDATE ordem SET datasai='${date}', horaapa='${time}' WHERE ordem=${ordem}`
        );
        return result[1].rowCount;
      }
    }

    return 0;
  }

  async retornoIsat({ ordem, situacao, movimenta_cacamba }) {
    await this.db.query("SET client_encoding TO 'UTF-8'");

    const result_ordem = await this.db.query(`
      SELECT retorno_isat, trim(cli_for) as tipo FROM ordem WHERE ordem=${ordem}
    `);

    if (result_ordem[1].rowCount > 0) {
      if (result_ordem[1].rows[0].retorno_isat !== situacao) {
        await this.db.query(
          `UPDATE ordem SET retorno_isat='${situacao}' WHERE ordem=${ordem}`
        );

        if (movimenta_cacamba && result_ordem[1].rows[0].tipo === 'EMBARQUE' && situacao.trim() === 'ENCERRADA NO DRIVERSAT') {
          await this.db.query(
            `UPDATE ordem SET status='F', obs='FINALIZADO' WHERE ordem=${ordem}`
          );
        }
      }
    }

    await this.db.query("SET client_encoding TO 'SQL_ASCII'");

    return 0;
  }

  async setRoutingOrder({ ordem, placa, codigo, data }) {
    await this.db.query("SET client_encoding TO 'UTF-8'");

    const result_ordem = await this.db.query(`SELECT ordem FROM ordem WHERE ordem=${ordem} and status<>'F'`);

    if (result_ordem[1].rowCount === 0) {
      return 0;
    }

    const result_placa = await this.db.query(`SELECT ativo_placa FROM sagi_cad_ativo WHERE trim(ativo_placa)='${placa}'`);

    if (result_placa[1].rowCount === 0) {
      return 0;
    }

    const result_motorista = await this.db.query(`SELECT codmot, motorista FROM mot WHERE codmot=${codigo}`);

    if (result_motorista[1].rowCount === 0) {
      return 0;
    }

    await this.db.query(`
      UPDATE ordem
      SET status = 'A',
        obs = 'AGUARDANDO',
        codmot = ${codigo},
        motorista = '${result_motorista[1].rows[0].motorista}',
        placa = '${placa}',
        datasai = '${data}',
        sequencia = (select coalesce(max(sequencia), 0)+1 from ordem where datasai = '${data}' and placa = '${placa}')
      WHERE ordem = ${ordem}
    `);

    await this.db.query("SET client_encoding TO 'SQL_ASCII'");

    return 1;
  }

  async clearChecks({ ordem, type }) {
    await this.db.query("SET client_encoding TO 'SQL_ASCII'");

    if (type === 'all') {
      await this.db.query(`DELETE from sagi_isat_imprevisto_ordem WHERE ordem=${ordem} AND coalesce(imprevisto, false) = false`);
    } else {
      await this.db.query(`DELETE from sagi_isat_imprevisto_ordem WHERE ordem=${ordem} AND coalesce(imprevisto, false) = false AND motivo = 'CHECK-OUT'`);
    }

    return true;
  }

  async clearImprevistos({ ordem }) {
    await this.db.query("SET client_encoding TO 'SQL_ASCII'");

    await this.db.query(`DELETE from sagi_isat_imprevisto_ordem WHERE ordem=${ordem} AND coalesce(imprevisto, false) = true`);

    return true;
  }

  async clearCacambas({ ordem, type }) {
    await this.db.query(`UPDATE ordem SET ${type === "IDA" ? "numero" : "numeroret"}='' WHERE ordem=${ordem}`);

    return true;
  }
}

module.exports = OrdensModel;
