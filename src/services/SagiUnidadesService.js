const moment = require("moment");

const Dados = require("../controllers/Dados");
const SagiUnidades = require("../controllers/SagiUnidades");
const SagiIsatSinc = require("../controllers/SagiIsatSinc");

const api = require("../services/api");

class SagiUnidadesService {
  constructor(window, db) {
    this.dados = new Dados(db);

    this.sagiUnidades = new SagiUnidades(db);

    this.sagiIsatSinc = new SagiIsatSinc(db);

    this.window = window;
  }

  async execute({ token, filiais_isat }) {
    try {
      await this.manageSagiUnidades(token, filiais_isat);
    } catch (err) {
      this.writeLog(
        `(${new Date().toLocaleString()}) - Erro serviço sagi unidades: ${
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
      type: "sagi_unidades",
    });
  }

  getIdByFilial(filial, filiais_isat) {
    const item = filiais_isat.find(obj => obj.descricao_default === filial);
    return item ? item.id : null;
  }

  async manageSagiUnidades({ token, idempresa }, filiais_isat) {
    try {
      const unidades = await this.sagiUnidades.getSagiUnidades({ token });

      const unidades_com_filial = unidades
        .map(unidade => {
          const id = this.getIdByFilial(unidade.filial, filiais_isat);
          if (id !== null) {
            return {
              ...unidade,
              id_filial: id
            };
          }
          return null;
        })
        .filter(Boolean);

      while (unidades_com_filial.length > 0) {
        const regs = unidades_com_filial.splice(0, 10);

        const data = {
          registros: regs.map((r) => {
            return {
              unidade_id: parseInt(r.unidade_id, 10),
              unidade_descricao: r.unidade_descricao,
              principal: r.principal,
              naoexigeimagem: r.naoexigeimagem,
              naobloq_nfsai: r.naobloq_nfsai,
              naobloq_ordem_placa: r.naobloq_ordem_placa,
              naobloq_ordem_placa_emb: r.naobloq_ordem_placa_emb,
              bloq_emis_bol_retro_und: r.bloq_emis_bol_retro_und ? parseInt(r.bloq_emis_bol_retro_und, 10) : 0,
              naoexibir_palm: r.naoexibir_palm,
              id_filial: parseInt(r.id_filial, 10),
            };
          }),
        };

        const response = await api
          .post(`/v3/sagi_unidade_v3/`, data, {
            headers: {
              'Authorization': `Basic ${Buffer.from(`${idempresa}:${token}`).toString('base64')}`
            }
          })
          .catch((err) =>
            this.writeLog(
              `(${new Date().toLocaleString()}) - Erro requisição Api Isat Sagi Unidades: ${
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
                  codigo: retorno.registro.unidade_id,
                  type: "SAGI_UNIDADE",
                  token,
                });
              } else {
                this.writeLog(
                  `(${new Date().toLocaleString()}) - Sagi Unidade:${
                    retorno.registro.unidade_id
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
        `(${new Date().toLocaleString()}) - Erro inesperado no sincronismo das sagi unidades: ${
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

module.exports = SagiUnidadesService;
