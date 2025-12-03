const moment = require("moment");

const Dados = require("../controllers/Dados");
const TipoDeProdutos = require("../controllers/TipoDeProdutos");
const SagiIsatSinc = require("../controllers/SagiIsatSinc");

const api = require("../services/api");

class TipoDeProdutosService {
  constructor(window, db) {
    this.dados = new Dados(db);

    this.tipoDeProdutos = new TipoDeProdutos(db);

    this.sagiIsatSinc = new SagiIsatSinc(db);

    this.window = window;
  }

  async execute({ token }) {
    try {
      await this.manageTipoDeProdutos(token);
    } catch (err) {
      this.writeLog(
        `(${new Date().toLocaleString()}) - Erro serviço tipo de produtos: ${
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
      type: "tipo_de_produtos",
    });
  }

  async manageTipoDeProdutos({ token, idempresa }) {
    try {
      const tipos = await this.tipoDeProdutos.getTipoDeProdutos({ token });

      while (tipos.length > 0) {
        const regs = tipos.splice(0, 10);

        const data = {
          registros: regs.map((r) => {
            return {
              id_tipo_pro: parseInt(r.id_tipo_pro, 10),
              codigo: r.codigo,
              descricao: r.descricao,
            };
          }),
        };

        const response = await api
          .post(`/v3/sagi_tipo_pro_v3/`, data, {
            headers: {
              'Authorization': `Basic ${Buffer.from(`${idempresa}:${token}`).toString('base64')}`
            }
          })
          .catch((err) =>
            this.writeLog(
              `(${new Date().toLocaleString()}) - Erro requisição Api Isat Tipo de Produtos: ${
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
                  codigo: retorno.registro.id_tipo_pro,
                  type: "SAGI_TIPO_PRO",
                  token,
                });
              } else {
                this.writeLog(
                  `(${new Date().toLocaleString()}) - Tipo de Produto:${
                    retorno.registro.id_tipo_pro
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
        `(${new Date().toLocaleString()}) - Erro inesperado no sincronismo dos tipos de produtos: ${
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

module.exports = TipoDeProdutosService;
