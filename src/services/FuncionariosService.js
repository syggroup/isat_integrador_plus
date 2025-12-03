const moment = require("moment");

const Dados = require("../controllers/Dados");
const Funcionarios = require("../controllers/Funcionarios");
const SagiIsatSinc = require("../controllers/SagiIsatSinc");

const api = require("../services/api");

class FuncionariosService {
  constructor(window, db) {
    this.dados = new Dados(db);

    this.funcionarios = new Funcionarios(db);

    this.sagiIsatSinc = new SagiIsatSinc(db);

    this.window = window;
  }

  async execute({ token, filiais_isat }) {
    try {
      await this.manageFuncionarios(token, filiais_isat);
    } catch (err) {
      this.writeLog(
        `(${new Date().toLocaleString()}) - Erro serviço funcionários: ${
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
      type: "funcionarios",
    });
  }

  getIdByFilial(filial, filiais_isat) {
    const item = filiais_isat.find(obj => obj.descricao_default === filial);
    return item ? item.id : null;
  }

  async manageFuncionarios({ token, idempresa }, filiais_isat) {
    try {
      const funcionarios = await this.funcionarios.getFuncionarios({ token });

      const funcionarios_com_filial = funcionarios
        .map(funcionario => {
          const id = this.getIdByFilial(funcionario.filial, filiais_isat);
          if (id !== null) {
            return {
              ...funcionario,
              id_filial: id
            };
          }
          return null;
        })
        .filter(Boolean);

      while (funcionarios_com_filial.length > 0) {
        const regs = funcionarios_com_filial.splice(0, 10);

        const data = {
          registros: regs.map((r) => {
            return {
              cod: parseInt(r.cod, 10),
              nom: r.nom,
              status: r.status,
              id_sagi_senha: r.iduser ? parseInt(r.iduser, 10) : null,
              datacad: r.datacad,
              id_filial: parseInt(r.id_filial, 10)
            };
          }),
        };

        const response = await api
          .post(`/v3/sagi_cag_fun_v3/`, data, {
            headers: {
              'Authorization': `Basic ${Buffer.from(`${idempresa}:${token}`).toString('base64')}`
            }
          })
          .catch((err) =>
            this.writeLog(
              `(${new Date().toLocaleString()}) - Erro requisição Api Isat Funcionários: ${
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
                  codigo: retorno.registro.cod,
                  type: "CAG_FUN",
                  token,
                });
              } else {
                this.writeLog(
                  `(${new Date().toLocaleString()}) - Funcionário:${
                    retorno.registro.cod
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
        `(${new Date().toLocaleString()}) - Erro inesperado no sincronismo dos funcionários: ${
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

module.exports = FuncionariosService;
