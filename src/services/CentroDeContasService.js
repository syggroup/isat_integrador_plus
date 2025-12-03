const moment = require("moment");

const Dados = require("../controllers/Dados");
const CentroDeContas = require("../controllers/CentroDeContas");
const SagiIsatSinc = require("../controllers/SagiIsatSinc");

const api = require("../services/api");

class CentroDeContasService {
  constructor(window, db) {
    this.dados = new Dados(db);

    this.centroDeContas = new CentroDeContas(db);

    this.sagiIsatSinc = new SagiIsatSinc(db);

    this.window = window;
  }

  async execute({ token, filiais_isat }) {
    try {
      await this.manageCentroDeContas(token, filiais_isat);
    } catch (err) {
      this.writeLog(
        `(${new Date().toLocaleString()}) - Erro serviço centro de contas: ${
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
      type: "centro_de_contas",
    });
  }

  getIdByFilial(filial, filiais_isat) {
    const item = filiais_isat.find(obj => obj.descricao_default === filial);
    return item ? item.id : null;
  }

  async manageCentroDeContas({ token, idempresa }, filiais_isat) {
    try {
      const centros_de_contas = await this.centroDeContas.getCentroDeContas({ token });

      const centros_de_contas_com_filial = centros_de_contas
        .map(centro_de_conta => {
          const id = this.getIdByFilial(centro_de_conta.filial, filiais_isat);
          if (id !== null) {
            return {
              ...centro_de_conta,
              id_filial: id
            };
          }
          return null;
        })
        .filter(Boolean);

      while (centros_de_contas_com_filial.length > 0) {
        const regs = centros_de_contas_com_filial.splice(0, 10);

        const data = {
          registros: regs.map((r) => {
            return {
              centro_id: parseInt(r.centro_id, 10),
              centro_codigo: parseInt(r.centro_codigo, 10),
              centro_descricao: r.descricao,
              centro_data: r.centro_data,
              codigo: r.codigo,
              caminho: r.caminho,
              status: r.status,
              centro_natureza: r.centro_natureza,
              responsavel: r.responsavel,
              classe: r.classe,
              id_filial: parseInt(r.id_filial, 10),
              nivel: parseInt(r.nivel, 10),
              tipo: r.tipo,
              nao_usar: r.nao_usar,
              id_sagi_senha: r.iduser ? parseInt(r.iduser, 10) : null
            };
          }),
        };

        const response = await api
          .post(`/v3/sagi_centro_v3/`, data, {
            headers: {
              'Authorization': `Basic ${Buffer.from(`${idempresa}:${token}`).toString('base64')}`
            }
          })
          .catch((err) =>
            this.writeLog(
              `(${new Date().toLocaleString()}) - Erro requisição Api Isat Centro de Contas: ${
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
                  codigo: retorno.registro.centro_id,
                  type: "SAGI_CENTRO",
                  token,
                });
              } else {
                this.writeLog(
                  `(${new Date().toLocaleString()}) - Categoria de Conta:${
                    retorno.registro.centro_id
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
        `(${new Date().toLocaleString()}) - Erro inesperado no sincronismo dos centro de contas: ${
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

module.exports = CentroDeContasService;
