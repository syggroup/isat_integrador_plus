const moment = require("moment");

const Dados = require("../controllers/Dados");
const SagiIsatSinc = require("../controllers/SagiIsatSinc");
const TipoCacambas = require("../controllers/TipoCacambas");
const Cacambas = require("../controllers/Cacambas");

const api = require("../services/api");

class ContainersService {
  constructor(window, db) {
    this.dados = new Dados(db);

    this.sagiIsatSinc = new SagiIsatSinc(db);
    this.tipo_cacambas = new TipoCacambas(db);
    this.cacambas = new Cacambas(db);

    this.window = window;
  }

  async execute({ tokens, nfiliais }) {
    try {
      await Promise.all(
        tokens.map((token) => this.manageTypeContainers(token))
      );

      const count = await this.cacambas.getCacambasWithChr13OrChr10();

      if (count > 0) {
        await this.cacambas.updateCacambasWithChr13OrChr10();
      }

      await Promise.all(
        tokens.map((token) => this.manageContainers(token, nfiliais))
      );
    } catch (err) {
      this.writeLog(
        `(${new Date().toLocaleString()}) - Erro serviço tipo_caçambas/caçambas: ${
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
      type: "containers",
    });
  }

  async manageTypeContainers({ token, filial }) {
    try {
      const del_tipo_cacambas_in_isat = [];
      const upd_tipo_cacambas_in_isat = [];

      const tipo_cacambas_isat = [];
      const tipo_cacambas_sagi = await this.tipo_cacambas.getTipoCacambas({
        token,
      });

      const cacambasHabilitadas = await this.dados.getCountMenuPermissa(64);

      const response = await api
        .get(`/v2/${token}/tipo_cacamba`)
        .catch((err) =>
          this.writeLog(
            `(${new Date().toLocaleString()} / ${filial}) - Erro requisição consulta Tipo_Caçambas Api Isat: ${
              err.response
                ? `${err.response.status} - ${JSON.stringify(
                    err.response.data
                  )}`
                : err.message
            }`
          )
        );

      if (response && response.status === 200) {
        const registros = response.data;

        registros.forEach((reg) => {
          if (reg._id) {
            tipo_cacambas_isat.push(reg._id);
          }
        });

        tipo_cacambas_isat.forEach((tci) => {
          if (
            tipo_cacambas_sagi.findIndex(
              (tcs) => parseInt(tcs.id, 10) === tci
            ) === -1
          ) {
            del_tipo_cacambas_in_isat.push({ _id: tci });
          }
        });

        if (del_tipo_cacambas_in_isat.length > 0 && parseInt(cacambasHabilitadas, 10) > 0) {
          const response = await api
            .post(`/v2/${token}/tipo_cacamba/delete`, {
              registros: del_tipo_cacambas_in_isat,
            })
            .catch((err) =>
              this.writeLog(
                `(${new Date().toLocaleString()} / ${filial}) - Erro requisição deleta Tipo_Caçambas Api Isat: ${
                  err.response
                    ? `${err.response.status} - ${JSON.stringify(
                        err.response.data
                      )}`
                    : err.message
                }`
              )
            );

          if (response && response.status === 200) {
            const registros = response.data;

            registros.forEach((reg) => {
              if (reg.erro) {
                this.writeLog(
                  `(${new Date().toLocaleString()} / ${filial}) - Tipo_Caçamba:${
                    reg.registro._id
                  }:DELETE:ERRO:${reg.erro}`
                );
              }
            });
          }
        }
      }

      tipo_cacambas_sagi.forEach((tcs) => {
        if (!tcs.atualizado) {
          upd_tipo_cacambas_in_isat.push({
            _id: parseInt(tcs.id, 10),
            descricao: tcs.descricao,
          });
        }
      });

      if (upd_tipo_cacambas_in_isat.length > 0) {
        const response = await api
          .post(`/v2/${token}/tipo_cacamba`, {
            registros: upd_tipo_cacambas_in_isat,
          })
          .catch((err) =>
            this.writeLog(
              `(${new Date().toLocaleString()} / ${filial}) - Erro requisição cadastra Tipo_Caçambas Api Isat: ${
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
                  codigo: retorno.registro._id,
                  type: "SAGI_TIPO_CONTAINER",
                  token,
                });
              } else {
                this.writeLog(
                  `(${new Date().toLocaleString()} / ${filial}) - Tipo_Caçamba:${
                    retorno.registro._id
                  }:ERRO:${retorno.erro}`
                );
              }
            })
          );
        }
      }
    } catch (err) {
      this.writeLog(
        `(${new Date().toLocaleString()} / ${filial}) - Erro inesperado no sincronismo dos Tipo_Caçambas: ${
          err.message
        }`
      );
    } finally {
      await this.dados.setDados({
        datetime: moment().format("DD/MM/YYYY|HH:mm:ss"),
      });
    }
  }

  async manageContainers({ token, movimenta_cacamba, filial }, nfiliais) {
    try {
      const del_cacambas_in_isat = [];
      const upd_cacambas_in_isat = [];

      const cacambas_isat = [];
      const cacambas_sagi = await this.cacambas.getCacambas({
        token,
        nfiliais,
      });

      const cacambasHabilitadas = await this.dados.getCountMenuPermissa(64);

      const response = await api
        .get(`/v2/${token}/cacamba`)
        .catch((err) =>
          this.writeLog(
            `(${new Date().toLocaleString()} / ${filial}) - Erro requisição consulta Caçambas Api Isat: ${
              err.response
                ? `${err.response.status} - ${JSON.stringify(
                    err.response.data
                  )}`
                : err.message
            }`
          )
        );

      if (response && response.status === 200) {
        const registros = response.data;

        registros.forEach((reg) => cacambas_isat.push(reg));

        cacambas_isat.forEach((ci) => {
          if (
            !ci.rastreada &&
            cacambas_sagi.findIndex((cs) => cs.numero === ci.placa) === -1
          ) {
            del_cacambas_in_isat.push({ placa: ci.placa });
          }
        });

        while (del_cacambas_in_isat.length > 0  && parseInt(cacambasHabilitadas, 10) > 0) {
          const regs = del_cacambas_in_isat.splice(0, 100);

          const response = await api
            .post(`/v2/${token}/cacamba/delete`, {
              registros: regs,
            })
            .catch((err) =>
              this.writeLog(
                `(${new Date().toLocaleString()} / ${filial}) - Erro requisição deleta Caçambas Api Isat: ${
                  err.response
                    ? `${err.response.status} - ${JSON.stringify(
                        err.response.data
                      )}`
                    : err.message
                }`
              )
            );

          if (response && response.status === 200) {
            const registros = response.data;

            registros.forEach((reg) => {
              if (reg.erro) {
                this.writeLog(
                  `(${new Date().toLocaleString()} / ${filial}) - Caçamba:${
                    reg.registro.placa
                  }:DELETE:ERRO:${reg.erro}`
                );
              }
            });
          }
        }
      }

      if (movimenta_cacamba) {
        await Promise.all(
          cacambas_isat.map(async (registro) => {
            const count = await this.cacambas.update(registro);

            if (count === 0) {
              this.writeLog(
                `(${new Date().toLocaleString()} / ${filial}) - Caçamba:${
                  registro.placa
                }:ERRO:Caçamba não encontrada na base de dados
                `
              );
            }
          })
        );
      }

      cacambas_sagi.forEach((cs) => {
        if (!cs.atualizado) {
          upd_cacambas_in_isat.push({
            tipo_referencia: cs.tipo_referencia,
            codigo:
              parseInt(cs.codigo, 10) === 0 ? null : parseInt(cs.codigo, 10),
            num_col: parseInt(cs.num_col, 10),
            placa: cs.numero,
            tipo_cacamba: parseInt(cs.tipo_cacamba, 10),
            desc_tipo_cacamba: cs.desc_tipo_cacamba,
          });
        }
      });

      if (upd_cacambas_in_isat.length > 0) {
        const response = await api
          .post(`/v2/${token}/cacamba`, {
            registros: upd_cacambas_in_isat,
          })
          .catch((err) =>
            this.writeLog(
              `(${new Date().toLocaleString()} / ${filial}) - Erro requisição cadastra Caçambas Api Isat: ${
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
                  codigo: retorno.registro.placa,
                  type: "CONTAINE",
                  token,
                });
              } else {
                this.writeLog(
                  `(${new Date().toLocaleString()} / ${filial}) - Caçamba:${
                    retorno.registro.placa
                  }:ERRO:${retorno.erro}`
                );
              }
            })
          );
        }
      }
    } catch (err) {
      this.writeLog(
        `(${new Date().toLocaleString()} / ${filial}) - Erro inesperado no sincronismo das Caçambas: ${
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

module.exports = ContainersService;
