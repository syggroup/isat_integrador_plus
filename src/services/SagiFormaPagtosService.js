const moment = require("moment");

const Dados = require("../controllers/Dados");
const SagiFormaPagtos = require("../controllers/SagiFormaPagtos");
const SagiIsatSinc = require("../controllers/SagiIsatSinc");

const api = require("./api");

class SagiFormaPagtosService {
  constructor(window, db) {
    this.dados = new Dados(db);

    this.sagi_forma_pagamento = new SagiFormaPagtos(db);

    this.sagiIsatSinc = new SagiIsatSinc(db);

    this.window = window;
  }

  async execute({ token }) {
    try {
      await this.manageSagiFormaPagtos(token);
    } catch (err) {
      this.writeLog(
        `(${new Date().toLocaleString()}) - Erro serviço formas de pagamentos: ${
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
      type: "sagi_forma_pagtos",
    });
  }

  async manageSagiFormaPagtos({ token, idempresa }) {
    try {
      const sagi_forma_pagamentos = await this.sagi_forma_pagamento.getSagiFormaPagtos({ token });

      while (sagi_forma_pagamentos.length > 0) {
        const regs = sagi_forma_pagamentos.splice(0, 10);

        const data = {
          registros: regs.map((r) => {
            return {
              codigo: parseInt(r.codigo, 10),
              descricao: r.descricao,
              pagrec: r.pagrec,
              mostra_banc: r.mostra_banc,
              mostra_forma: r.mostra_forma,
              usa_dinheiro: r.usa_dinheiro,
              libera_credito: r.usa_dinheiro,
              status: r.status,
              eletronico: parseInt(r.eletronico, 10),
              forma_pix: r.forma_pix,
              lim_desc_perc: parseFloat(r.lim_desc_perc)
            };
          }),
        };

        const response = await api
          .post(`/v3/sagi_forma_pagto_v3/`, data, {
            headers: {
              'Authorization': `Basic ${Buffer.from(`${idempresa}:${token}`).toString('base64')}`
            }
          })
          .catch((err) =>
            this.writeLog(
              `(${new Date().toLocaleString()}) - Erro requisição Api Isat Formas de Pagamentos: ${
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
                  type: "SAGI_FORMA_PAGTO",
                  token,
                });
              } else {
                this.writeLog(
                  `(${new Date().toLocaleString()}) - Forma de Pagamento:${
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
        `(${new Date().toLocaleString()} / ${filial}) - Erro inesperado no sincronismo das Formas de Pagamentos: ${
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

module.exports = SagiFormaPagtosService;
