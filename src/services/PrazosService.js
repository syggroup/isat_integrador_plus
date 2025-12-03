const moment = require("moment");

const Dados = require("../controllers/Dados");
const Prazos = require("../controllers/Prazos");
const SagiIsatSinc = require("../controllers/SagiIsatSinc");

const api = require("../services/api");

class PrazosService {
  constructor(window, db) {
    this.dados = new Dados(db);

    this.prazos = new Prazos(db);

    this.sagiIsatSinc = new SagiIsatSinc(db);

    this.window = window;
  }

  async execute({ token }) {
    try {
      await this.managePrazos(token);
    } catch (err) {
      this.writeLog(
        `(${new Date().toLocaleString()}) - Erro serviço prazos: ${
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
      type: "prazos",
    });
  }

  async managePrazos({ token, idempresa }) {
    try {
      const prazos = await this.prazos.getPrazos({ token });

      while (prazos.length > 0) {
        const regs = prazos.splice(0, 10);

        const data = {
          registros: regs.map((r) => {
            return {
              prazo_id: parseInt(r.prazo_id, 10),
              prazo_descricao: r.prazo_descricao,
              prazo_parcelas: parseInt(r.prazo_parcelas, 10),
              prazo_vencimento: parseInt(r.prazo_vencimento, 10),
              prazo_vencto_regra: parseInt(r.prazo_vencto_regra, 10),
              prazo_diferenca: parseInt(r.prazo_diferenca, 10),
              prazo_dif_regra: parseInt(r.prazo_dif_regra, 10),
              prazo_juros: parseFloat(r.prazo_juros),
              prazo_tipo_pag: r.prazo_tipo_pag,
              parcela_dia_mes: r.parcela_dia_mes,
              prazo_seg: r.prazo_seg,
              prazo_ter: r.prazo_ter,
              prazo_qua: r.prazo_qua,
              prazo_qui: r.prazo_qui,
              prazo_sex: r.prazo_sex,
              prazo_sab: r.prazo_sab,
              prazo_dom: r.prazo_dom,
              prazo_prox_sem: r.prazo_prox_sem,
              prazo_fora_sem: r.prazo_fora_sem,
              prazo_fora_qui: r.prazo_fora_qui,
              prazo_fora_mes: r.prazo_fora_mes,
              prazo_dias: parseInt(r.prazo_dias, 10),
              prazo_dias_uteis: r.prazo_dias_uteis,
              prazo_dias_alter: r.prazo_dias_alter,
              prazo_tipo_par: r.prazo_tipo_par,
              prazo_dias2: parseInt(r.prazo_dias2, 10),
              przo_dias_vct_alt: r.przo_dias_vct_alt,
              przo_tp_feriado: parseInt(r.przo_tp_feriado, 10),
              przo_tp_prazo: parseInt(r.przo_tp_prazo, 10),
              przo_tp_person: parseInt(r.przo_tp_person, 10),
              cad_data: r.cad_data,
              prazo_status: r.prazo_status,
              id_sagi_senha: r.iduser ? parseInt(r.iduser, 10) : null,
              id_sagi_forma_pagto: r.prazo_codigo_forma ? parseInt(r.prazo_codigo_forma, 10) : null,
            };
          }),
        };

        const response = await api
          .post(`/v3/sagi_prazo_v3/`, data, {
            headers: {
              'Authorization': `Basic ${Buffer.from(`${idempresa}:${token}`).toString('base64')}`
            }
          })
          .catch((err) =>
            this.writeLog(
              `(${new Date().toLocaleString()}) - Erro requisição Api Isat Prazos: ${
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
                  codigo: retorno.registro.prazo_id,
                  type: "SAGI_PRAZO",
                  token,
                });
              } else {
                this.writeLog(
                  `(${new Date().toLocaleString()}) - Prazo:${
                    retorno.registro.prazo_id
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
        `(${new Date().toLocaleString()}) - Erro inesperado no sincronismo dos prazos: ${
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

module.exports = PrazosService;
