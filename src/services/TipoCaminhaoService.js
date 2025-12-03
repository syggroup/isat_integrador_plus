const moment = require("moment");

const Dados = require("../controllers/Dados");
const TipoCaminhao = require("../controllers/TipoCaminhao");
const SagiIsatSinc = require("../controllers/SagiIsatSinc");

const api = require("../services/api");

class TipoCaminhaoService {
  constructor(window, db) {
    this.dados = new Dados(db);

    this.tipoCaminhao = new TipoCaminhao(db);

    this.sagiIsatSinc = new SagiIsatSinc(db);

    this.window = window;
  }

  async execute({ token }) {
    try {
      await this.manageTipoCaminhao(token);
    } catch (err) {
      this.writeLog(
        `(${new Date().toLocaleString()}) - Erro serviço tipo caminhao: ${
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
      type: "tipo_caminhao",
    });
  }

  async manageTipoCaminhao({ token, idempresa }) {
    try {
      const tipos = await this.tipoCaminhao.getTipoCaminhao({ token });

      while (tipos.length > 0) {
        const regs = tipos.splice(0, 10);

        const data = {
          registros: regs.map((r) => {
            return {
              idnum: parseInt(r.idnum, 10),
              descricao: r.descricao,
              container: r.container,
              data: r.data,
              hora: r.hora,
              id_sagi_senha: r.iduser ? parseInt(r.iduser, 10) : null,
              obs: r.obs,
              peso_liq: parseFloat(r.peso_liq),
              tipo_licenc: r.tipo_licenc,
              peso_bruto: parseFloat(r.peso_bruto),
              qtd_placas: parseInt(r.qtd_placas, 10),
              peso_bruto_fab: parseFloat(r.peso_bruto_fab),
              qtd_eixos_t: parseInt(r.qtd_eixos_t, 10),
              qtd_eixos_l: parseInt(r.qtd_eixos_l, 10),
              nome_arq: r.nome_arq,
              arquivo: r.arquivo,
              agendamento_ordem_fixa: r.agendamento_ordem_fixa,
              qtd_pesagem: parseInt(r.qtd_pesagem, 10),
              status: r.status,
            };
          }),
        };

        const response = await api
          .post(`/v3/tipo_caminhao_v3/`, data, {
            headers: {
              'Authorization': `Basic ${Buffer.from(`${idempresa}:${token}`).toString('base64')}`
            }
          })
          .catch((err) =>
            this.writeLog(
              `(${new Date().toLocaleString()}) - Erro requisição Api Isat Tipo Caminhao: ${
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
                  codigo: retorno.registro.idnum,
                  type: "SAGI_CAMINHAO",
                  token,
                });
              } else {
                this.writeLog(
                  `(${new Date().toLocaleString()}) - Tipo Caminhao:${
                    retorno.registro.idnum
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
        `(${new Date().toLocaleString()}) - Erro inesperado no sincronismo dos tipos de caminhao: ${
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

module.exports = TipoCaminhaoService;
