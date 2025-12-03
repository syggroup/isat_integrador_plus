const moment = require("moment");

const Dados = require("../controllers/Dados");
const Ncm = require("../controllers/Ncm");
const SagiIsatSinc = require("../controllers/SagiIsatSinc");

const api = require("../services/api");

class NcmService {
  constructor(window, db) {
    this.dados = new Dados(db);

    this.ncm = new Ncm(db);

    this.sagiIsatSinc = new SagiIsatSinc(db);

    this.window = window;
  }

  async execute({ token }) {
    try {
      await this.manageNcm(token);
    } catch (err) {
      this.writeLog(
        `(${new Date().toLocaleString()}) - Erro serviço ncm: ${
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
      type: "ncm",
    });
  }

  async manageNcm({ token, idempresa }) {
    try {
      const ncms = await this.ncm.getNcm({ token });

      while (ncms.length > 0) {
        const regs = ncms.splice(0, 500);

        const data = {
          registros: regs.map((r) => {
            return {
              cod_ncm: r.cod_ncm,
              nome_ncm: r.nome_ncm,
              un_utrib: r.un_utrib,
              sr_recno: r.sr_recno,
            };
          }),
        };

        const response = await api
          .post(`/v3/sagi_ncm_v3/`, data, {
            headers: {
              'Authorization': `Basic ${Buffer.from(`${idempresa}:${token}`).toString('base64')}`
            }
          })
          .catch((err) =>
            this.writeLog(
              `(${new Date().toLocaleString()}) - Erro requisição Api Isat NCM: ${
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
                  codigo: retorno.registro.sr_recno,
                  type: "NCM",
                  token,
                });
              } else {
                this.writeLog(
                  `(${new Date().toLocaleString()}) - NCM:${
                    retorno.registro.sr_recno
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
        `(${new Date().toLocaleString()}) - Erro inesperado no sincronismo dos ncm: ${
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

module.exports = NcmService;
