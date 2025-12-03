const moment = require("moment");

const Dados = require("../controllers/Dados");
const SagiListaOnu = require("../controllers/SagiListaOnu");
const SagiIsatSinc = require("../controllers/SagiIsatSinc");

const api = require("../services/api");

class SagiListaOnuService {
  constructor(window, db) {
    this.dados = new Dados(db);

    this.sagiListaOnu = new SagiListaOnu(db);

    this.sagiIsatSinc = new SagiIsatSinc(db);

    this.window = window;
  }

  async execute({ token }) {
    try {
      await this.manageSagiListaOnu(token);
    } catch (err) {
      this.writeLog(
        `(${new Date().toLocaleString()}) - Erro serviço sagi lista onu: ${
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
      type: "sagi_lista_onu",
    });
  }

  async manageSagiListaOnu({ token, idempresa }) {
    try {
      const listaOnu = await this.sagiListaOnu.getSagiListaOnu({ token });

      while (listaOnu.length > 0) {
        const regs = listaOnu.splice(0, 10);

        const data = {
          registros: regs.map((r) => {
            return {
              onu_id: parseInt(r.id, 10),
              codigo_onu: parseInt(r.codigo_onu, 10),
              classe_risco: r.classe_risco,
              numero_risco: parseInt(r.numero_risco, 10),
              descricao: r.descricao,
              gru_emb: r.gru_emb,
              id_sagi_senha: r.iduser ? parseInt(r.iduser, 10) : null,
              data: r.data,
              hora: r.hora,
            };
          }),
        };

        const response = await api
          .post(`/v3/sagi_lista_onu_v3/`, data, {
            headers: {
              'Authorization': `Basic ${Buffer.from(`${idempresa}:${token}`).toString('base64')}`
            }
          })
          .catch((err) =>
            this.writeLog(
              `(${new Date().toLocaleString()}) - Erro requisição Api Isat Sagi Lista ONU: ${
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
                  codigo: retorno.registro.onu_id,
                  type: "SAGI_LISTA_ONU",
                  token,
                });
              } else {
                this.writeLog(
                  `(${new Date().toLocaleString()}) - Sagi Lista ONU:${
                    retorno.registro.onu_id
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
        `(${new Date().toLocaleString()}) - Erro inesperado no sincronismo da sagi lista onu: ${
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

module.exports = SagiListaOnuService;
