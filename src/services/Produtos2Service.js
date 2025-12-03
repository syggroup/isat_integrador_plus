const moment = require("moment");

const Dados = require("../controllers/Dados");
const Produtos2 = require("../controllers/Produtos2");
const SagiIsatSinc = require("../controllers/SagiIsatSinc");

const api = require("../services/api");

class Produtos2Service {
  constructor(window, db) {
    this.dados = new Dados(db);

    this.produtos2 = new Produtos2(db);

    this.sagiIsatSinc = new SagiIsatSinc(db);

    this.window = window;
  }

  async execute({ token }) {
    try {
      await this.manageProdutos2(token);
    } catch (err) {
      this.writeLog(
        `(${new Date().toLocaleString()}) - Erro serviço produtos2: ${
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
      type: "produtos2",
    });
  }

  async manageProdutos2({ token, idempresa }) {
    try {
      const produtos2 = await this.produtos2.getProdutos2({ token });

      while (produtos2.length > 0) {
        const regs = produtos2.splice(0, 10);

        const data = {
          registros: regs.map((r) => {
            return {
              sr_recno: parseInt(r.sr_recno, 10),
              id_referencia_codfor: parseInt(r.id_referencia_codfor, 10),
              id_sagi_cag_pro: r.id_sagi_cag_pro ? parseInt(r.id_sagi_cag_pro, 10) : null,
              produto_forcli: r.produto_forcli,
              preco: parseFloat(r.preco),
              precof: parseFloat(r.precof),
              precos: parseFloat(r.precos),
              precofs: parseFloat(r.precofs),
              dtatual: r.dtatual,
              id_sagi_senha_usuario: r.id_sagi_senha_usuario ? parseInt(r.id_sagi_senha_usuario, 10) : null,
              validade: r.validade,
              peso_acima: parseFloat(r.peso_acima),
              prc_acima: parseFloat(r.prc_acima),
              peso_ac2: parseFloat(r.peso_ac2),
              prc_ac2: parseFloat(r.prc_ac2),
              peso_baixo: parseFloat(r.peso_baixo),
              prc_baixo: parseFloat(r.prc_baixo),
              bloqueado: r.bloqueado,
              preco_nf: parseFloat(r.preco_nf),
              id_sagi_senha_usuario_autoriza: r.id_sagi_senha_usuario_autoriza ? parseInt(r.id_sagi_senha_usuario_autoriza, 10) : null,
              taxa_conv: parseFloat(r.taxa_conv),
              dest_direta: r.dest_direta,
            };
          }),
        };

        const response = await api
          .post(`/v3/sagi_cag_pr2_v3/`, data, {
            headers: {
              'Authorization': `Basic ${Buffer.from(`${idempresa}:${token}`).toString('base64')}`
            }
          })
          .catch((err) =>
            this.writeLog(
              `(${new Date().toLocaleString()}) - Erro requisição Api Isat Produtos2: ${
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
                  codigo: retorno.registro.sr_recno,
                  type: "CAG_PR2",
                  token,
                });
              } else {
                this.writeLog(
                  `(${new Date().toLocaleString()}) - Produto2:${
                    retorno.registro.sr_recno
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
        `(${new Date().toLocaleString()}) - Erro inesperado no sincronismo dos produtos2: ${
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

module.exports = Produtos2Service;
