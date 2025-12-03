const moment = require("moment");

const Dados = require("../controllers/Dados");
const Credores = require("../controllers/Credores");
const SagiIsatSinc = require("../controllers/SagiIsatSinc");

const api = require("../services/api");

class CredoresService {
  constructor(window, db) {
    this.dados = new Dados(db);

    this.credores = new Credores(db);

    this.sagiIsatSinc = new SagiIsatSinc(db);

    this.window = window;
  }

  async execute({ token }) {
    try {
      await this.manageCredores(token);
    } catch (err) {
      this.writeLog(
        `(${new Date().toLocaleString()}) - Erro serviço credores: ${
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
      type: "credores",
    });
  }

  async manageCredores({ token, idempresa }) {
    try {
      const credores = await this.credores.getCredores({ token });

      while (credores.length > 0) {
        const regs = credores.splice(0, 100);

        const data = {
          registros: regs.map((r) => {
            return {
              codcre: parseInt(r.codcre, 10),
              credor: r.credor,
              fanta: r.fanta,
              ende: r.ende,
              bairro: r.bairro,
              numende: r.numende,
              compl_ende: r.compl_ende,
              cep: r.cep,
              dat_nasc: r.dat_nasc,
              numcid: r.numcid ? parseInt(r.numcid, 10) : null,
              email: r.email,
              fone: r.fone,
              fone2: r.fone2,
              tip: r.tip,
              cpf_cnpj: r.cpf_cnpj,
              status: r.status,
              id_sagi_classes: r.id_sagi_classes ? parseInt(r.id_sagi_classes, 10) : null,
              latitude: r.latitude,
              longitude: r.longitude
            };
          }),
        };

        const response = await api
          .post(`/v3/sagi_cag_cre_v3/`, data, {
            headers: {
              'Authorization': `Basic ${Buffer.from(`${idempresa}:${token}`).toString('base64')}`
            }
          })
          .catch((err) =>
            this.writeLog(
              `(${new Date().toLocaleString()}) - Erro requisição Api Isat Credores: ${
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
                  codigo: retorno.registro.codcre,
                  type: "CAG_CRE",
                  token,
                });
              } else {
                this.writeLog(
                  `(${new Date().toLocaleString()}) - Credor:${
                    retorno.registro.codcre
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
        `(${new Date().toLocaleString()}) - Erro inesperado no sincronismo dos credores: ${
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

module.exports = CredoresService;
