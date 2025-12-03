const moment = require("moment");

const Dados = require("../controllers/Dados");
const Regiao = require("../controllers/Regiao");
const SagiIsatSinc = require("../controllers/SagiIsatSinc");

const api = require("../services/api");

class RegiaoService {
  constructor(window, db) {
    this.dados = new Dados(db);

    this.regiao = new Regiao(db);

    this.sagiIsatSinc = new SagiIsatSinc(db);

    this.window = window;
  }

  async execute({ token }) {
    try {
      await this.manageRegiao(token);
    } catch (err) {
      this.writeLog(
        `(${new Date().toLocaleString()}) - Erro serviço região: ${
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
      type: "regiao",
    });
  }

  async manageRegiao({ token, idempresa }) {
    try {
      const regiao = await this.regiao.getRegiao({ token });

      while (regiao.length > 0) {
        const regs = regiao.splice(0, 10);

        const data = {
          registros: regs.map((r) => {
            return {
              codreg: parseInt(r.codreg, 10),
              nome: r.nome,
              nivel: r.nivel,
              id_sagi_senha: r.iduser ? parseInt(r.iduser, 10) : null,
              cad_data: r.cad_data
            };
          }),
        };

        const response = await api
          .post(`/v3/sagi_regiao_v3/`, data, {
            headers: {
              'Authorization': `Basic ${Buffer.from(`${idempresa}:${token}`).toString('base64')}`
            }
          })
          .catch((err) =>
            this.writeLog(
              `(${new Date().toLocaleString()}) - Erro requisição Api Isat Regiao: ${
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
                  codigo: retorno.registro.codreg,
                  type: "REGIAO",
                  token,
                });
              } else {
                this.writeLog(
                  `(${new Date().toLocaleString()}) - Região:${
                    retorno.registro.codreg
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
        `(${new Date().toLocaleString()}) - Erro inesperado no sincronismo de regiao: ${
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

module.exports = RegiaoService;
