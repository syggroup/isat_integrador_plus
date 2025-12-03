const moment = require("moment");

const Dados = require("../controllers/Dados");
const ClasseDeCredores = require("../controllers/ClasseDeCredores");
const SagiIsatSinc = require("../controllers/SagiIsatSinc");

const api = require("../services/api");

class ClasseDeCredoresService {
  constructor(window, db) {
    this.dados = new Dados(db);

    this.classeDeCredores = new ClasseDeCredores(db);

    this.sagiIsatSinc = new SagiIsatSinc(db);

    this.window = window;
  }

  async execute({ token }) {
    try {
      await this.manageClasseDeCredores(token);
    } catch (err) {
      this.writeLog(
        `(${new Date().toLocaleString()}) - Erro serviço classe de credores: ${
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
      type: "classe_de_credores",
    });
  }

  async manageClasseDeCredores({ token, idempresa }) {
    try {
      const classes = await this.classeDeCredores.getClasseDeCredores({ token });

      while (classes.length > 0) {
        const regs = classes.splice(0, 10);

        const data = {
          registros: regs.map((r) => {
            return {
              cod_clas: parseInt(r.cod_clas, 10),
              classe: r.classe,
              cad_aut_class: r.cad_aut_class,
            };
          }),
        };

        const response = await api
          .post(`/v3/sagi_classes_v3/`, data, {
            headers: {
              'Authorization': `Basic ${Buffer.from(`${idempresa}:${token}`).toString('base64')}`
            }
          })
          .catch((err) =>
            this.writeLog(
              `(${new Date().toLocaleString()}) - Erro requisição Api Isat Classe de Credores: ${
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
                  codigo: retorno.registro.cod_clas,
                  type: "CLASSES",
                  token,
                });
              } else {
                this.writeLog(
                  `(${new Date().toLocaleString()}) - Classe de Credor:${
                    retorno.registro.cod_clas
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
        `(${new Date().toLocaleString()}) - Erro inesperado no sincronismo das classes de credores: ${
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

module.exports = ClasseDeCredoresService;
