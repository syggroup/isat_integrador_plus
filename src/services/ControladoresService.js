const moment = require("moment");

const Dados = require("../controllers/Dados");
const Controladores = require("../controllers/Controladores");
const SagiIsatSinc = require("../controllers/SagiIsatSinc");

const api = require("../services/api");

class ControladoresService {
  constructor(window, db) {
    this.dados = new Dados(db);

    this.controladores = new Controladores(db);

    this.sagiIsatSinc = new SagiIsatSinc(db);

    this.window = window;
  }

  async execute({ token }) {
    try {
      await this.manageControladores(token);
    } catch (err) {
      this.writeLog(
        `(${new Date().toLocaleString()}) - Erro serviço controladores: ${
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
      type: "controladores",
    });
  }

  async manageControladores({ token, idempresa }) {
    try {
      const controladores = await this.controladores.getControladores({ token });

      while (controladores.length > 0) {
        const regs = controladores.splice(0, 10);

        const data = {
          registros: regs.map((r) => {
            return {
              orgao_ambiental_id: parseInt(r.orgao_ambiental_id, 10),
              descricao: r.descricao,
              id_sagi_senha: r.iduser ? parseInt(r.iduser, 10) : null,
              data: r.data,
              hora: r.hora
            };
          }),
        };

        const response = await api
          .post(`/v3/sagi_orgao_ambiental_v3/`, data, {
            headers: {
              'Authorization': `Basic ${Buffer.from(`${idempresa}:${token}`).toString('base64')}`
            }
          })
          .catch((err) =>
            this.writeLog(
              `(${new Date().toLocaleString()}) - Erro requisição Api Isat Controladores: ${
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
                  codigo: retorno.registro.orgao_ambiental_id,
                  type: "SAGI_ORGAO_AMBIENTAL",
                  token,
                });
              } else {
                this.writeLog(
                  `(${new Date().toLocaleString()}) - Controlador:${
                    retorno.registro.orgao_ambiental_id
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
        `(${new Date().toLocaleString()} / ${filial}) - Erro inesperado no sincronismo dos controladores: ${
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

module.exports = ControladoresService;
