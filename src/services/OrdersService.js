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
        `(${new Date().toLocaleString()}) - Iniciando servico ordens`
      );

      await Promise.all(
        tokens.map((token) => {
          return Promise.all([
            this.manageOrders(token),
            this.updateStatusOrders(token),
          ]);
        })
      );

      this.writeLog(
        `(${new Date().toLocaleString()}) - Servico ordens finalizado`
      );
    } catch (err) {
      this.writeLog(
        `(${new Date().toLocaleString()}) - Erro servico ordens: ${err.message}`
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

      const ordens = await this.ordens.getOrdens({
        filial,
        data_inicial_sinc_isat,
      });
      this.writeLog(
        `(${new Date().toLocaleString()}) - Ordens para sincronizar: ${
          ordens.length
        }`
      );

      while (ordens.length > 0) {
        const reg = ordens.splice(0, 1)[0];

        const data = {
          registros: [
            {
              ordem: reg.ordem,
              ...(reg.acao.trim() !== "DELETE" && { tipo: reg.tipo }),
              ...(reg.acao.trim() !== "DELETE" && { placa: reg.placa }),
              ...(reg.acao.trim() !== "DELETE" && { datasai: reg.datasai }),
              ...(reg.acao.trim() !== "DELETE" && {
                codigo: parseInt(reg.codigo, 10),
              }),
              ...(reg.acao.trim() !== "DELETE" && {
                sequencia: parseInt(reg.sequencia, 10),
              }),
              ...(reg.acao.trim() !== "DELETE" && { horasai: reg.horasai }),
              ...(reg.acao.trim() !== "DELETE" && { status: reg.status }),
              ...(reg.acao.trim() !== "DELETE" && {
                num_col: parseInt(reg.num_col, 10),
              }),
              ...(reg.acao.trim() !== "DELETE" && {
                cnh: reg.cnh.replace(/\D/g, ""),
              }),
              ...(reg.acao.trim() !== "DELETE" && { filial: reg.filial }),
              ...(reg.acao.trim() !== "DELETE" &&
                reg.observacoes && { observacoes: reg.obs }),
            },
          ],
        };

        const response = await api
          .post(
            `/${token}/ordem_rastreio${
              reg.acao.trim() === "DELETE" ? "/delete" : ""
            }`,
            data
          )
          .catch((err) =>
            this.writeLog(
              `(${new Date().toLocaleString()}) - Erro requisição Api Isat Ordens(${reg.acao.trim()}): ${
                err.response
                  ? `${err.response.status} - ${JSON.stringify(
                      err.response.data
                    )}`
                  : err.message
              }`
            )
          );

        if (response && "data" in response && "dados" in response.data) {
          if (response.data.dados.status === "OK") {
            const retorno = response.data.dados.retorno[0];

            if (
              (retorno.status === "OK" && reg.acao.trim() === "DELETE") ||
              (retorno.status === "OK" &&
                reg.acao.trim() !== "DELETE" &&
                (retorno.cadastrou === "SIM" || retorno.atualizou === "SIM")) ||
              (retorno.status === "ERRO" &&
                reg.acao.trim() === "DELETE" &&
                retorno.mensagem.search("encontrada") !== -1)
            ) {
              await this.ordens.delete({
                sr_recno: reg.sr_recno,
              });
            }
            this.writeLog(
              `(${new Date().toLocaleString()}) - Ordem:${
                retorno.registro.ordem
              }:${reg.acao.trim()}:${
                reg.acao.trim() === "DELETE"
                  ? retorno.status === "OK"
                    ? "OK"
                    : `ERRO:${
                        retorno.mensagem
                          ? retorno.mensagem
                          : retorno.erro.mensagem
                      }`
                  : retorno.status === "OK"
                  ? retorno.cadastrou === "SIM" || retorno.atualizou === "SIM"
                    ? "OK"
                    : `ERRO:${retorno.mensagem}`
                  : `ERRO:${retorno.erro.mensagem}`
              }`
            );
          } else {
            this.writeLog(
              `(${new Date().toLocaleString()}) - Erro retorno Api Isat Ordens${reg.acao.trim()}: ${
                reg.acao.trim() === "DELETE"
                  ? response.data.dados.retorno[0].mensagem
                  : response.data.dados.retorno[0].erro.mensagem
              }`
            );
          }
        } else if (response && "data" in response) {
          this.writeLog(
            `(${new Date().toLocaleString()}) - Retorno inesperado Api Isat Ordens(${reg.acao.trim()}): ${
              response.data
            }`
          );
        }

        await this.dados.setDados({
          datetime: moment().format("DD/MM/YYYY|HH:mm:ss"),
        });
        await this.sleep(50);
      }

      await this.ordens.updateForDelete2();

      this.writeLog(
        `(${new Date().toLocaleString()}) - Sincronismo Ordens finalizado`
      );
    } catch (err) {
      this.writeLog(
        `(${new Date().toLocaleString()}) - Erro inesperado no sincronismo das Ordens: ${
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
        `(${new Date().toLocaleString()}) - Status de Ordens para sincronizar: ${
          ordens.length
        }`
      );

      while (ordens.length > 0) {
        const regs = ordens.splice(0, 10);

        const data = regs.map((r) => r.ordem);

        const response = await api
          .post(`/${token}/ordem_rastreio/status`, data)
          .catch((err) =>
            this.writeLog(
              `(${new Date().toLocaleString()}) - Erro requisição Api Isat Status das Ordens: ${
                err.response
                  ? `${err.response.status} - ${JSON.stringify(
                      err.response.data
                    )}`
                  : err.message
              }`
            )
          );

        if (response && "data" in response && "dados" in response.data) {
          if (response.data.dados.status === "OK") {
            const retornos = response.data.dados.retorno;

            if (typeof retornos === "object") {
              const concat_retornos = [];

              await Promise.all(
                retornos.registros.map(async (registro) => {
                  const {
                    ordem,
                    situacao,
                    checks,
                    imprevistos,
                    cacambas,
                    kms,
                  } = registro;

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

                  /* this.writeLog(
                    `(${new Date().toLocaleString()}) - Status das Ordens:${ordem}:${situacao}`
                  ); */
                  concat_retornos.push(`Status da Ordem:${ordem}:${situacao}`);
                })
              );

              this.writeLog(
                `(${new Date().toLocaleString()}) - Status das Ordens = ${concat_retornos.join(
                  ", "
                )}`
              );
            }
          } else {
            this.writeLog(
              `(${new Date().toLocaleString()}) - Erro retorno Api Isat Status das Ordens: ${
                response.data.dados.retorno[0].erro.mensagem
              }`
            );
          }
        } else if (response && "data" in response) {
          this.writeLog(
            `(${new Date().toLocaleString()}) - Retorno inesperado Api Isat Status das Ordens: ${
              response.data
            }`
          );
        }

        await this.dados.setDados({
          datetime: moment().format("DD/MM/YYYY|HH:mm:ss"),
        });
        await this.sleep(500);
      }

      this.writeLog(
        `(${new Date().toLocaleString()}) - Sincronismo Status das Ordens finalizado`
      );
    } catch (err) {
      this.writeLog(
        `(${new Date().toLocaleString()}) - Erro inesperado no sincronismo dos Status das Ordens: ${
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
