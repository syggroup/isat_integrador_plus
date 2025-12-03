class OrdensModel {
  constructor(db) {
    this.db = db;
  }

  /*
    CREATE TABLE IF NOT EXISTS sagi_col_servico
    (
      id BIGSERIAL,
      servico_id NUMERIC(10) NOT NULL,
      servico_qtd NUMERIC(19,3) NOT NULL,
      servico_valor NUMERIC(19,5) NOT NULL,
      mtr_id NUMERIC(10),
      cadri_prod_id NUMERIC(10),
      serv_gestaoresiduo BOOLEAN NOT NULL,
      serv_armazenagem BOOLEAN NOT NULL,
      serv_consultoria BOOLEAN NOT NULL,
      serv_locacao BOOLEAN NOT NULL,
      id_sagi_cag_pr2 INTEGER,
      id_sagi_item_contrato_serv3 INTEGER NOT NULL,
      id_sagi_cag_pro INTEGER NOT NULL,
      id_ordem_rastreio INTEGER NOT NULL,
      id_cliente INTEGER NOT NULL,
      CONSTRAINT pkey_sagi_col_servico PRIMARY KEY (id),
      CONSTRAINT uq_sagi_col_servico_cliente UNIQUE (servico_id, id_cliente),
      CONSTRAINT fk_sagi_col_servico_cliente FOREIGN KEY (id_cliente)
        REFERENCES cliente (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
      CONSTRAINT fk_sagi_col_servico_id_ordem_rastreio FOREIGN KEY (id_ordem_rastreio)
        REFERENCES ordem_rastreio (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
      CONSTRAINT fk_sagi_col_servico_sagi_cag_pro FOREIGN KEY (id_sagi_cag_pro)
        REFERENCES sagi_cag_pro (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
      CONSTRAINT fk_sagi_col_servico_sagi_item_contrato_serv3 FOREIGN KEY (id_sagi_item_contrato_serv3)
        REFERENCES sagi_item_contrato_serv3 (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
      CONSTRAINT fk_sagi_col_servico_sagi_cag_pr2 FOREIGN KEY (id_sagi_cag_pr2)
        REFERENCES sagi_cag_pr2 (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sagi_ativo_loc_col_serv3
    (
      id BIGSERIAL,
      id_sagi_cad_ativo INTEGER NOT NULL,
      id_sagi_col_servico INTEGER NOT NULL,
      id_cliente INTEGER NOT NULL,
      CONSTRAINT pkey_sagi_ativo_loc_col_serv3 PRIMARY KEY (id),
      CONSTRAINT uq_sagi_ativo_loc_col_serv3_cliente UNIQUE (id_sagi_cad_ativo, id_sagi_col_servico, id_cliente),
      CONSTRAINT fk_sagi_ativo_loc_col_serv3_cliente FOREIGN KEY (id_cliente)
        REFERENCES cliente (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
      CONSTRAINT fk_sagi_ativo_loc_col_serv3_sagi_cad_ativo FOREIGN KEY (id_sagi_cad_ativo)
        REFERENCES sagi_cad_ativo (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
      CONSTRAINT fk_sagi_ativo_loc_col_serv3_sagi_col_servico FOREIGN KEY (id_sagi_col_servico)
        REFERENCES sagi_col_servico (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ordem_pro
    (
      id BIGSERIAL,
      id_ordem_rastreio INTEGER NOT NULL,
      id_sagi_cag_pro INTEGER NOT NULL,
      id_sagi_cag_pro_des INTEGER,
      peso NUMERIC(18,3) NOT NULL,
      peso_des NUMERIC(18,3) NOT NULL,
      modnot CHARACTER VARYING(2),
      num_nf NUMERIC(10) NOT NULL,
      serie_nf CHARACTER VARYING(3),
      num_brm CHARACTER VARYING(10),
      preco NUMERIC(15,5),
      est_fisico CHARACTER VARYING(20),
      classe CHARACTER VARYING(15),
      acondiciona CHARACTER VARYING(10),
      num_onu NUMERIC(10),
      num_risco NUMERIC(10),
      gru_emb CHARACTER VARYING(20),
      ordem_endereco_descricao CHARACTER VARYING(100),
      id_cliente INTEGER NOT NULL,
      id_filial INTEGER NOT NULL,
      CONSTRAINT pkey_ordem_pro PRIMARY KEY (id),
      CONSTRAINT uq_ordem_pro_cliente UNIQUE (id_ordem_rastreio, id_sagi_cag_pro, id_sagi_cag_pro_des, id_cliente),
      CONSTRAINT fk_ordem_pro_filiais FOREIGN KEY (id_filial)
        REFERENCES filiais (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
      CONSTRAINT fk_ordem_pro_cliente FOREIGN KEY (id_cliente)
        REFERENCES cliente (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
      CONSTRAINT fk_ordem_pro_ordem_rastreio FOREIGN KEY (id_ordem_rastreio)
        REFERENCES ordem_rastreio (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
      CONSTRAINT fk_ordem_pro_sagi_cag_pro FOREIGN KEY (id_sagi_cag_pro)
        REFERENCES sagi_cag_pro (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
      CONSTRAINT fk_ordem_pro_sagi_cag_pro_des FOREIGN KEY (id_sagi_cag_pro_des)
        REFERENCES sagi_cag_pro (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
    );
  */

  async get({ filial, data_inicial_sinc_isat, limit, ordens_com_servico }) {
    await this.db.query("SET client_encoding TO 'SQL_ASCII'");
    const result = await this.db.query(`
        SELECT * FROM (
          SELECT a.sr_recno,
            trim(a.acao) as acao,
            case when b.cli_for='COLETA' then 'FORNECEDOR' else 'CLIENTE' end as tipo,
            a.ordem,
            b.datasai::text as datasai,
            case when d.ativo_rastreador='ISAT' then trim(b.placa) else '' end as placa,
            b.codfor as codigo,
            b.num_col,
            coalesce(b.cli_des, 0) as codigo_destino_final,
            b.sequencia,
            trim(b.horaapa) as horasai,
            trim(b.status) as status,
            case when length(regexp_replace(c.numcnh, '\\D', '', 'g')) = 11 then coalesce(trim(c.numcnh), '') else '' end as cnh,
            trim(b.obs1) as obs,
            trim(b.empresa) as filial,
            trim(b.tipo_ret) as tipo_retorno,
            case when b.servico then 'SERVICO' when b.cli_for='COLETA' then 'COLETA' else 'EMBARQUE' end as tipo_ordem,
            trim(b.cacamba) as tipo_cacamba,
            coalesce(b.servico, false) as coleta_servico
          FROM isat_ordem_temp a
          LEFT JOIN ordem b on a.ordem=b.ordem
          LEFT JOIN mot as c on c.codmot=b.codmot
          LEFT JOIN sagi_cad_ativo as d on d.ativo_placa=b.placa
          WHERE a.ordem>0
            and a.acao<>'DELETE'
            ${!ordens_com_servico ? `and (b.empresa='${filial}' or b.empresa='TODAS')` : ''}
            ${
              data_inicial_sinc_isat
                ? ` AND b.datasai >= '${data_inicial_sinc_isat.split("/").reverse().join("-")}'`
                : " AND b.datasai >= current_date - 7 "
            }
          UNION ALL
          SELECT a.sr_recno,
            trim(a.acao) as acao,
            '' as tipo,
            a.ordem,
            current_date::text as datasai,
            '' as placa,
            0 as codigo,
            0 as num_col,
            0 as codigo_destino_final,
            0 as sequencia,
            '' as horasai,
            '' as status,
            '' as cnh,
            '' as obs,
            '' as filial,
            '' as tipo_retorno,
            '' as tipo_ordem,
            '' as tipo_cacamba,
            false as coleta_servico
          FROM isat_ordem_temp a
          WHERE a.ordem>0 AND a.acao='DELETE'
        ) z
        GROUP BY 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19
        ORDER BY 1 ASC
        LIMIT ${limit}
    `);

    const ordens = result[1].rows;

    if (ordens_com_servico) {
      for (const ordem of ordens) {
        const { acao, tipo_ordem, ordem: numero_ordem } = ordem;

        ordem.sagi_col_servico = [];

        if (acao !== 'DELETE' && tipo_ordem === 'SERVICO') {
          const result_2 = await this.db.query(`
            SELECT a.servico_id,
              a.servico_qtd,
              a.servico_valor,
              a.mtr_id,
              coalesce((select cp.sr_recno from cag_pro cp where trim(cp.codpro) = trim(a.servico_codpro) and trim(cp.subcod) = trim(a.servico_subcod) limit 1), 0) as id_sagi_cag_pro,
              a.cadri_prod_id,
              coalesce(a.serv_gestaoresiduo, false) as serv_gestaoresiduo,
              coalesce(a.serv_armazenagem, false) as serv_armazenagem,
              coalesce(a.serv_consultoria, false) as serv_consultoria,
              coalesce(a.serv_locacao, false) as serv_locacao,
              a.contrato_item_id as id_sagi_item_contrato_serv3,
              a.sr_recno_cag_pr2,
              a.sr_recno
            FROM sagi_col_servico a
            WHERE a.servico_ordem = ${numero_ordem}
            ORDER BY a.servico_id
          `);

          for (const sagi_col_servico of result_2[1].rows) {
            const new_sagi_col_servico = sagi_col_servico;

            new_sagi_col_servico.ativos = [];

            //serviço do tipo locação
            if (sagi_col_servico.serv_locacao) {
              const result_3 = await this.db.query(`
                SELECT a.ativo_id
                FROM sagi_ativo_loc_col_serv3 a
                WHERE a.sr_recno_serv_col = ${sagi_col_servico.sr_recno}
                ORDER BY a.id
              `);

              new_sagi_col_servico.ativos = result_3[1].rows;
            }

            new_sagi_col_servico.residuos = [];

            //serviço do tipo gestão resíduo
            if (sagi_col_servico.serv_gestaoresiduo) {
              const result_4 = await this.db.query(`
                SELECT coalesce((select cp.sr_recno from cag_pro cp where trim(cp.codpro) = trim(a.codpro) and trim(cp.subcod) = trim(a.subcod) limit 1), 0) as id_sagi_cag_pro,
                  coalesce((select cp.sr_recno from cag_pro cp where trim(cp.codpro) = trim(a.codpro_des) and trim(cp.subcod) = trim(a.subcod_des) limit 1), 0) as id_sagi_cag_pro_des,
                  coalesce(a.peso, 0) as peso,
                  coalesce(a.peso_des, 0) as peso_des,
                  trim(a.modnot) as modnot,
                  a.num_nf,
                  trim(a.serie_nf) as serie_nf,
                  trim(a.num_brm) as num_brm,
                  case when trim(a.empresa) <> '' then trim(a.empresa) else 'TODAS' end as filial,
                  a.preco,
                  trim(a.est_fisico) as est_fisico,
                  trim(classe) as classe,
                  trim(acondiciona) as acondiciona,
                  a.num_onu,
                  a.num_risco,
                  trim(a.gru_emb) as gru_emb,
                  trim(ordem_endereco_descricao) as ordem_endereco_descricao
                FROM ordem_pro a
                WHERE a.ordem = ${numero_ordem}
                ORDER BY a.sr_recno
              `);

              new_sagi_col_servico.residuos = result_4[1].rows;
            }

            ordem.sagi_col_servico.push(new_sagi_col_servico);
          }
        }
      }
    }

    return ordens;
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

  async setCloseDateTime({ ordem, date, time }) {
    await this.db.query("SET client_encoding TO 'SQL_ASCII'");

    const result_ordem = await this.db.query(`
      SELECT datache, horache FROM ordem WHERE ordem=${ordem}
    `);

    if (result_ordem[1].rowCount > 0) {
      if (
        result_ordem[1].rows[0].datache !== date ||
        result_ordem[1].rows[0].horache !== time
      ) {
        const result = await this.db.query(
          `UPDATE ordem SET datache='${date}', horache='${time}' WHERE ordem=${ordem}`
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
