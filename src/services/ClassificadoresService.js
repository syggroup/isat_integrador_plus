const moment = require("moment");

const Dados = require("../controllers/Dados");
const Classificadores = require("../controllers/Classificadores");
const SagiIsatSinc = require("../controllers/SagiIsatSinc");

const api = require("../services/api");

class ClassificadoresService {
  constructor(window, db) {
    this.dados = new Dados(db);

    this.classificadores = new Classificadores(db);

    this.sagiIsatSinc = new SagiIsatSinc(db);

    this.window = window;
  }

  async execute({ token, filiais_isat }) {
    try {
      await this.manageClassificadores(token, filiais_isat);
    } catch (err) {
      this.writeLog(
        `(${new Date().toLocaleString()}) - Erro serviço classificadores: ${
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
      type: "classificadores",
    });
  }

  getIdByFilial(filial, filiais_isat) {
    const item = filiais_isat.find(obj => obj.descricao_default === filial);
    return item ? item.id : null;
  }

  async manageClassificadores({ token, idempresa }, filiais_isat) {
    try {
      const classificadores = await this.classificadores.getClassificadores({ token });

      const classificadores_com_filial = classificadores
        .map(classificador => {
          const id = this.getIdByFilial(classificador.filial, filiais_isat);
          if (id !== null) {
            return {
              ...classificador,
              id_filial: id
            };
          }
          return null;
        })
        .filter(Boolean);

      while (classificadores_com_filial.length > 0) {
        const regs = classificadores_com_filial.splice(0, 10);

        const data = {
          registros: regs.map((r) => {
            return {
              codigo: parseInt(r.codigo, 10),
              nome: r.nome,
              id_filial: parseInt(r.id_filial, 10),
              status: r.status,
              id_sagi_senha: r.iduser ? parseInt(r.iduser, 10) : null,
              cad_data: r.cad_data
            };
          }),
        };

        const response = await api
          .post(`/v3/sagi_classifica_v3/`, data, {
            headers: {
              'Authorization': `Basic ${Buffer.from(`${idempresa}:${token}`).toString('base64')}`
            }
          })
          .catch((err) =>
            this.writeLog(
              `(${new Date().toLocaleString()}) - Erro requisição Api Isat Classificadores: ${
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
                  codigo: retorno.registro.codigo,
                  type: "CLASSIFICA",
                  token,
                });
              } else {
                this.writeLog(
                  `(${new Date().toLocaleString()}) - Classificador:${
                    retorno.registro.codigo
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
        `(${new Date().toLocaleString()}) - Erro inesperado no sincronismo dos classificadores: ${
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

module.exports = ClassificadoresService;
