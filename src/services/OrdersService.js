const moment = require("moment");

const Dados = require("../controllers/Dados");
const Ordens = require("../controllers/Ordens");

const api = require("../services/api");

class OrdersService {
  constructor(window, db) {
    this.dados = new Dados(db);

    this.ordens = new Ordens(db);

    this.window = window;
  }

  async execute({ tokens }) {
    try {
      this.writeLog(
        `(${new Date().toLocaleString()}) - Iniciando serviço ordens`
      );

      await Promise.all(
        tokens.map((token) => {
          return Promise.all([
            this.manageOrders(token),
            this.updateStatusOrders(token),
          ]);
        })
      );

      await this.ordens.updateForDelete2();

      this.writeLog(
        `(${new Date().toLocaleString()}) - Serviço ordens finalizado`
      );
    } catch (err) {
      this.writeLog(
        `(${new Date().toLocaleString()}) - Erro serviço ordens: ${err.message}`
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
      type: "orders",
    });
  }

  async manageOrders({ token, filial, data_inicial_sinc_isat }) {
    try {
      await this.ordens.updateForDelete({
        filial,
      });

      const del_orders_in_isat = [];
      const upd_orders_in_isat = [];
      const remove_from_upd_orders_in_isat = [];

      const ordens = await this.ordens.getOrdens({
        filial,
        data_inicial_sinc_isat,
      });

      ordens.forEach((ordem) => {
        if (ordem.acao.trim() !== "DELETE") {
          upd_orders_in_isat.push(ordem);
        } else {
          del_orders_in_isat.push(ordem);
        }
      });

      upd_orders_in_isat.forEach((uoi) => {
        const index = del_orders_in_isat.findIndex(
          (doi) => doi.ordem === uoi.ordem
        );
        if (index !== -1) {
          remove_from_upd_orders_in_isat.push(index);
        }
      });

      remove_from_upd_orders_in_isat.forEach((ruoi) =>
        upd_orders_in_isat.splice(ruoi, 1)
      );

      this.writeLog(
        `(${new Date().toLocaleString()} / ${filial}) - Ordens para deletar: ${
          del_orders_in_isat.length
        }`
      );
      while (del_orders_in_isat.length > 0) {
        const regs = upd_orders_in_isat.splice(0, 10);

        const data = {
          registros: regs.map((reg) => {
            return {
              ordem: reg.ordem,
              sr_recno: reg.sr_recno,
            };
          }),
        };

        const response = await api
          .post(`/v2/${token}/ordem_rastreio/delete`, data)
          .catch((err) =>
            this.writeLog(
              `(${new Date().toLocaleString()} / ${filial}) - Erro requisição Api Isat delete Ordens(DELETE): ${
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

          const concat_retornos = [];

          await Promise.all(
            retornos.map(async (retorno) => {
              if (!retorno.erro) {
                await this.ordens.delete({
                  sr_recno: retorno.registro.sr_recno,
                });
              }
              concat_retornos.push(
                `Ordem:${retorno.registro.ordem}:DELETE:${
                  !retorno.erro ? "OK" : `ERRO:${retorno.erro}`
                }`
              );
            })
          );

          this.writeLog(
            `(${new Date().toLocaleString()} / ${filial}) - Ordens para deletar = ${concat_retornos.join(
              ", "
            )}`
          );
        }

        await this.dados.setDados({
          datetime: moment().format("DD/MM/YYYY|HH:mm:ss"),
        });
        await this.sleep(500);
      }

      this.writeLog(
        `(${new Date().toLocaleString()} / ${filial}) - Ordens para sincronizar: ${
          upd_orders_in_isat.length
        }`
      );
      while (upd_orders_in_isat.length > 0) {
        const regs = upd_orders_in_isat.splice(0, 10);

        const data = {
          registros: regs.map((reg) => {
            return {
              ordem: reg.ordem,
              tipo: reg.tipo,
              placa: reg.placa,
              datasai: reg.datasai,
              codigo: parseInt(reg.codigo, 10),
              sequencia: parseInt(reg.sequencia, 10),
              horasai: reg.horasai,
              status: reg.status,
              num_col: parseInt(reg.num_col, 10),
              cnh: reg.cnh.replace(/\D/g, ""),
              filial: reg.filial,
              observacoes: reg.obs,
              sr_recno: reg.sr_recno,
            };
          }),
        };

        const response = await api
          .post(`/v2/${token}/ordem_rastreio`, data)
          .catch((err) =>
            this.writeLog(
              `(${new Date().toLocaleString()} / ${filial}) - Erro requisição Api Isat insert/update Ordens(UPDATE): ${
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

          const concat_retornos = [];

          await Promise.all(
            retornos.map(async (retorno) => {
              if (!retorno.erro) {
                await this.ordens.delete({
                  sr_recno: retorno.registro.sr_recno,
                });
              }
              concat_retornos.push(
                `Ordem:${retorno.registro.ordem}:INSERT/UPDATE:${
                  !retorno.erro ? "OK" : `ERRO:${retorno.erro}`
                }`
              );
            })
          );

          this.writeLog(
            `(${new Date().toLocaleString()} / ${filial}) - Ordens para sincronizar = ${concat_retornos.join(
              ", "
            )}`
          );
        }

        await this.dados.setDados({
          datetime: moment().format("DD/MM/YYYY|HH:mm:ss"),
        });
        await this.sleep(500);
      }

      this.writeLog(
        `(${new Date().toLocaleString()} / ${filial}) - Sincronismo Ordens finalizado`
      );
    } catch (err) {
      this.writeLog(
        `(${new Date().toLocaleString()} / ${filial}) - Erro inesperado no sincronismo das Ordens: ${
          err.message
        }`
      );
    } finally {
      await this.dados.setDados({
        datetime: moment().format("DD/MM/YYYY|HH:mm:ss"),
      });
    }
  }

  async updateStatusOrders({ token, filial, movimenta_cacamba }) {
    try {
      const ordens = await this.ordens.getOrdensForUpdateStatus({
        filial,
      });
      this.writeLog(
        `(${new Date().toLocaleString()} / ${filial}) - Status de Ordens para sincronizar: ${
          ordens.length
        }`
      );

      while (ordens.length > 0) {
        const regs = ordens.splice(0, 10);

        const data = regs.map((r) => r.ordem);

        const response = await api
          .post(`/v2/${token}/ordem_rastreio/status`, data)
          .catch((err) =>
            this.writeLog(
              `(${new Date().toLocaleString()} / ${filial}) - Erro requisição Api Isat Status das Ordens: ${
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

          const concat_retornos = [];

          await Promise.all(
            retornos.map(async (registro) => {
              const { ordem, situacao, checks, imprevistos, cacambas, kms } =
                registro;

              if (checks.length > 0) {
                await this.ordens.treatCheck({
                  ordem,
                  check: checks[0],
                });

                if (checks[1] !== undefined) {
                  await this.ordens.treatCheck({
                    ordem,
                    check: checks[1],
                  });
                }
              }

              if (imprevistos.length > 0) {
                await Promise.all(
                  imprevistos.map(
                    async (imprevisto) =>
                      await this.ordens.treatImprevisto({
                        ordem,
                        imprevisto,
                      })
                  )
                );
              }

              if (movimenta_cacamba) {
                if (cacambas && cacambas[0].numeros.length > 0) {
                  await this.ordens.treatCacamba({
                    ordem,
                    cacamba: cacambas[0],
                  });
                }
                if (cacambas && cacambas[1].numeros.length > 0) {
                  await this.ordens.treatCacamba({
                    ordem,
                    cacamba: cacambas[1],
                  });
                }
              }

              if (kms[0].valor) {
                await this.ordens.treatKm({
                  ordem,
                  km: kms[0],
                });
              }
              if (kms[1].valor) {
                await this.ordens.treatKm({
                  ordem,
                  km: kms[1],
                });
              }

              concat_retornos.push(`Status da Ordem:${ordem}:${situacao}`);
            })
          );

          this.writeLog(
            `(${new Date().toLocaleString()} / ${filial}) - Status das Ordens = ${concat_retornos.join(
              ", "
            )}`
          );
        }

        await this.dados.setDados({
          datetime: moment().format("DD/MM/YYYY|HH:mm:ss"),
        });
        await this.sleep(500);
      }

      this.writeLog(
        `(${new Date().toLocaleString()} / ${filial}) - Sincronismo Status das Ordens finalizado`
      );
    } catch (err) {
      this.writeLog(
        `(${new Date().toLocaleString()} / ${filial}) - Erro inesperado no sincronismo dos Status das Ordens: ${
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

module.exports = OrdersService;
