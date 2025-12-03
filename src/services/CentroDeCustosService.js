const moment = require("moment");

const Dados = require("../controllers/Dados");
const CentroDeCustos = require("../controllers/CentroDeCustos");
const SagiIsatSinc = require("../controllers/SagiIsatSinc");

const api = require("../services/api");

class CentroDeCustosService {
  constructor(window, db) {
    this.dados = new Dados(db);

    this.centroDeCustos = new CentroDeCustos(db);

    this.sagiIsatSinc = new SagiIsatSinc(db);

    this.window = window;
  }

  async execute({ token, filiais_isat }) {
    try {
      await this.manageCentroDeCustos(token, filiais_isat);
    } catch (err) {
      this.writeLog(
        `(${new Date().toLocaleString()}) - Erro serviço centro de custos: ${
          err.message
        }`
      );
    } finally {
      await this.dados.setDados({
        datetime: moment().format("DD/MM/YYYY|HH:mm:ss"),
      });
    }
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  writeLog(log) {
    this.window.webContents.send("log", {
      log,
      type: "centro_de_custos",
    });
  }

  getIdByFilial(filial, filiais_isat) {
    const item = filiais_isat.find(obj => obj.descricao_default === filial);
    return item ? item.id : null;
  }

  async manageCentroDeCustos({ token, idempresa }, filiais_isat) {
    try {
      const centros_de_custos = await this.centroDeCustos.getCentroDeCustos({ token });

      const centros_de_custos_com_filial = centros_de_custos
        .map(centro_de_custo => {
          const id = this.getIdByFilial(centro_de_custo.filial, filiais_isat);
          if (id !== null) {
            return {
              ...centro_de_custo,
              id_filial: id
            };
          }
          return null;
        })
        .filter(Boolean);

      while (centros_de_custos_com_filial.length > 0) {
        const regs = centros_de_custos_com_filial.splice(0, 10);

        const data = {
          registros: regs.map((r) => {
            return {
              cag_cdc_id: parseInt(r.cag_cdc_id, 10),
              codcdc: r.codcdc,
              descdc: r.descdc,
              caminho_cdc: r.caminho_cdc,
              tipcdc: r.tipcdc,
              percdc: parseFloat(r.percdc),
              obscdc: r.obscdc,
              id_filial: parseInt(r.id_filial, 10),
              id_sagi_senha: r.iduser ? parseInt(r.iduser, 10) : null,
              datcdc: r.datcdc,
              horcdc: r.horcdc,
              bcacdc: parseFloat(r.bcacdc),
              psbcdc: parseFloat(r.psbcdc),
              principal: r.principal,
              ativo: r.ativo,
              pro001: r.pro001,
              bca001: parseFloat(r.bca001),
              pro002: r.pro002,
              bca002: parseFloat(r.bca002),
              pro003: r.pro003,
              bca003: parseFloat(r.bca003),
              pro004: r.pro004,
              bca004: parseFloat(r.bca004),
              pro005: r.pro005,
              bca005: parseFloat(r.bca005),
              pro006: r.pro006,
              bca006: parseFloat(r.bca006),
              pro007: r.pro007,
              bca007: parseFloat(r.bca007),
              pro008: r.pro008,
              bca008: parseFloat(r.bca008),
              pro009: r.pro009,
              bca009: parseFloat(r.bca009),
              pro010: r.pro010,
              bca010: parseFloat(r.bca010),
              pro011: r.pro011,
              bca011: parseFloat(r.bca011),
              pro012: r.pro012,
              bca012: parseFloat(r.bca012),
              habilita: r.habilita,
              alterdata: r.alterdata,
              cod_dtc: parseInt(r.cod_dtc, 10),
              flag_orca: r.flag_orca,
              oculta_dre: r.oculta_dre,
              usa_imobilizado: r.usa_imobilizado,
              ret_socio: r.ret_socio,
              cdc_validade_inicio: r.cdc_validade_inicio,
              cdc_validade_fim: r.cdc_validade_fim,
              cdc_codigo_gov: r.cdc_codigo_gov,
              fixa_var: r.fixa_var,
              posicao: parseInt(r.posicao, 10),
              oculta_fortes: r.oculta_fortes,
              cdc_usa_fantasia: r.cdc_usa_fantasia,
              cdc_fantasia: r.cdc_fantasia,
            };
          }),
        };

        const response = await api
          .post(`/v3/sagi_cag_cdc_v3/`, data, {
            headers: {
              'Authorization': `Basic ${Buffer.from(`${idempresa}:${token}`).toString('base64')}`
            }
          })
          .catch((err) =>
            this.writeLog(
              `(${new Date().toLocaleString()}) - Erro requisição Api Isat Centro de Custos: ${
                err.response
                  ? `${err.response.status} - ${JSON.stringify(
                      err.response.data
                    )}`
                  : err.message
              }`
            )
          );

        if (response && response.status === 200) {
          const retornos = response.data;

          await Promise.all(
            retornos.map(async (retorno) => {
              if (!retorno.erro) {
                await this.sagiIsatSinc.insert({
                  codigo: retorno.registro.cag_cdc_id,
                  type: "CAG_CDC",
                  token,
                });
              } else {
                this.writeLog(
                  `(${new Date().toLocaleString()}) - Centro de Custo:${
                    retorno.registro.cag_cdc_id
                  }:ERRO:${retorno.erro}`
                );
              }
            })
          );
        }

        await this.dados.setDados({
          datetime: moment().format("DD/MM/YYYY|HH:mm:ss"),
        });
        await this.sleep(500);
      }
    } catch (err) {
      this.writeLog(
        `(${new Date().toLocaleString()}) - Erro inesperado no sincronismo dos centro de custos: ${
          err.message
        }`
      );
    } finally {
      await this.dados.setDados({
        datetime: moment().format("DD/MM/YYYY|HH:mm:ss"),
      });
    }
  }
}

module.exports = CentroDeCustosService;
