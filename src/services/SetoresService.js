const moment = require("moment");

const Dados = require("../controllers/Dados");
const Setores = require("../controllers/Setores");
const SagiIsatSinc = require("../controllers/SagiIsatSinc");

const api = require("../services/api");

class SetoresService {
  constructor(window, db) {
    this.dados = new Dados(db);

    this.setores = new Setores(db);

    this.sagiIsatSinc = new SagiIsatSinc(db);

    this.window = window;
  }

  async execute({ token }) {
    try {
      await this.manageSetores(token);
    } catch (err) {
      this.writeLog(
        `(${new Date().toLocaleString()}) - Erro serviço setores: ${
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
      type: "setores",
    });
  }

  async manageSetores({ token, idempresa }) {
    try {
      const setores = await this.setores.getSetores({ token });

      while (setores.length > 0) {
        const regs = setores.splice(0, 10);

        const data = {
          registros: regs.map((r) => {
            return {
              codset: parseInt(r.codset, 10),
              setor: r.setor,
              bloquear_preco_orcamento: r.bloquear_preco_orcamento,
              id_sagi_senha: r.iduser ? parseInt(r.iduser, 10) : null,
              cad_data: r.cad_data,
              init_ped_ven_bloq: r.init_ped_ven_bloq,
              status: r.status,
              id_sagi_unidade: r.unidade_principal ? parseInt(r.unidade_principal, 10) : null
            };
          }),
        };

        const response = await api
          .post(`/v3/sagi_setor_v3/`, data, {
            headers: {
              'Authorization': `Basic ${Buffer.from(`${idempresa}:${token}`).toString('base64')}`
            }
          })
          .catch((err) =>
            this.writeLog(
              `(${new Date().toLocaleString()}) - Erro requisição Api Isat Setores: ${
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
                  codigo: retorno.registro.codset,
                  type: "SETOR",
                  token,
                });
              } else {
                this.writeLog(
                  `(${new Date().toLocaleString()}) - Setor:${
                    retorno.registro.codset
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
        `(${new Date().toLocaleString()}) - Erro inesperado no sincronismo dos setores: ${
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

module.exports = SetoresService;
