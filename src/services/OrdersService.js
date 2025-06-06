const moment = require("moment");

const Dados = require("../controllers/Dados");
const Ordens = require("../controllers/Ordens");
const SagiIsatSinc = require("../controllers/SagiIsatSinc");
const Fornecedores = require("../controllers/Fornecedores");
const ForEnde = require("../controllers/ForEnde");
const Clientes = require("../controllers/Clientes");

const api = require("../services/api");

class OrdersService {
  constructor(window, db) {
    this.dados = new Dados(db);

    this.ordens = new Ordens(db);

    this.sagiIsatSinc = new SagiIsatSinc(db);
    this.fornecedores = new Fornecedores(db);
    this.forEnde = new ForEnde(db);
    this.clientes = new Clientes(db);

    this.window = window;
  }

  async execute({ tokens }) {
    try {
      await Promise.all(
        tokens.map((token) => {
          return Promise.all([
            this.manageOrders(token),
            this.updateStatusOrders(token),
          ]);
        })
      );

      await Promise.all(
        tokens.map((token) => {
          return Promise.all([
            this.getOrdersWithRouting(token),
          ]);
        })
      );

      //await this.ordens.updateForDelete2();
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

  async manageOrders({ token, filial, data_inicial_sinc_isat, idempresa }) {
    try {
      //await this.ordens.updateForDelete({
      //  filial,
      //});

      const del_orders_in_isat = [];
      const upd_orders_in_isat = [];
      const remove_from_upd_orders_in_isat = [];

      const ordens = await this.ordens.getOrdens({
        filial,
        data_inicial_sinc_isat,
        limit: token === 'a9391a16800f5dabe0e0160b9bed9daa' ? 50 : 1000,
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

      while (del_orders_in_isat.length > 0) {
        const regs = del_orders_in_isat.splice(0, token === 'a9391a16800f5dabe0e0160b9bed9daa' ? 1 : 10);

        const data = {
          registros: regs.map((reg) => {
            return {
              ordem: reg.ordem,
              sr_recno: reg.sr_recno,
            };
          }),
        };

        const response = await api
          .post('/v3/ordem_rastreio_v3/delete', data, {
            headers: {
              'Authorization': `Basic ${Buffer.from(`${idempresa}:${token}`).toString('base64')}`
            }
          })
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

          await Promise.all(
            retornos.map(async (retorno) => {
              if (!retorno.erro || retorno.erro.indexOf("encontrada") !== -1) {
                await this.ordens.delete({
                  sr_recno: retorno.registro.sr_recno,
                });
              } else {
                this.writeLog(
                  `(${new Date().toLocaleString()} / ${filial}) - Ordem:${
                    retorno.registro.ordem
                  }:DELETE:ERRO:${retorno.erro}`
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

      while (upd_orders_in_isat.length > 0) {
        const regs = upd_orders_in_isat.splice(0, token === 'a9391a16800f5dabe0e0160b9bed9daa' ? 1 : 10);

        const data = {
          registros: regs.map((reg) => {
            return {
              ordem: reg.ordem,
              tipo: reg.tipo,
              placa: reg.placa,
              datasai: reg.datasai,
              codigo: parseInt(reg.codigo, 10),
              sequencia: parseInt(reg.sequencia, 10)||1,
              horasai: reg.horasai,
              status: reg.status,
              num_col: parseInt(reg.num_col, 10),
              cnh: reg.cnh.replace(/\D/g, ""),
              filial: reg.filial,
              observacoes: reg.obs,
              sr_recno: reg.sr_recno,
              tipo_retorno: reg.tipo_retorno,
              tipo_ordem: reg.tipo_ordem,
              tipo_cacamba: reg.tipo_cacamba,
            };
          }),
        };

        const response = await api
          .post('/v3/ordem_rastreio_v3', data, {
            headers: {
              'Authorization': `Basic ${Buffer.from(`${idempresa}:${token}`).toString('base64')}`
            }
          })
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

          await Promise.all(
            retornos.map(async (retorno) => {
              if (retorno.erro) {
                await this.ordens.retornoIsat({
                  ordem: retorno.registro.ordem,
                  situacao: retorno.erro.substr(0, 30),
                });
              }

              if (
                !retorno.erro ||
                (retorno.erro &&
                  retorno.erro.indexOf("laca") !== -1 &&
                  retorno.erro.indexOf("encontrada") !== -1)
              ) {
                await this.ordens.delete({
                  sr_recno: retorno.registro.sr_recno,
                });
              } else if (retorno.erro && retorno.erro.indexOf("ncia") !== -1) {
                await this.checkRefAndTrySendOrderAgain({
                  registro: retorno.registro,
                  token,
                  filial,
                  idempresa,
                });
              } else {
                this.writeLog(
                  `(${new Date().toLocaleString()} / ${filial}) - Ordem:${
                    retorno.registro.ordem
                  }:INSERT/UPDATE:ERRO:${retorno.erro}`
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

  async checkRefAndTrySendOrderAgain({
    registro: {
      ordem,
      tipo,
      placa,
      datasai,
      codigo,
      sequencia,
      horasai,
      status,
      num_col,
      cnh,
      filial: filial_ordem,
      observacoes,
      sr_recno,
      tipo_retorno,
      tipo_ordem,
      tipo_cacamba,
    },
    token,
    filial,
    idempresa,
  }) {
    try {
      let referencia = [];

      if (tipo === "CLIENTE") {
        referencia = await this.clientes.getCliente({
          codigo: parseInt(codigo, 10),
        });
      } else {
        if (parseInt(num_col, 10)) {
          referencia = await this.forEnde.getForEnde({
            codigo: parseInt(codigo, 10),
            num_col: parseInt(num_col, 10),
          });
        } else {
          referencia = await this.fornecedores.getFornecedor({
            codigo: parseInt(codigo, 10),
          });
        }
      }

      if (referencia.length > 0) {
        const data = {
          registros: [
            {
              tipo: referencia[0].tipo,
              nome: referencia[0].nome,
              apelido: referencia[0].apelido,
              id_cidade: parseInt(referencia[0].id_cidade, 10),
              latitude: parseFloat(referencia[0].latitude),
              longitude: parseFloat(referencia[0].longitude),
              codigo: parseInt(referencia[0].codigo, 10),
              status: referencia[0].status,
              cpf_cnpj: referencia[0].cpf_cnpj,
              tp: referencia[0].tp,
              ...(referencia[0].endereco && {
                endereco: referencia[0].endereco,
              }),
              ...(referencia[0].bairro && { bairro: referencia[0].bairro }),
              ...(referencia[0].numero && { numero: referencia[0].numero }),
              ...(referencia[0].complemento && {
                complemento: referencia[0].complemento,
              }),
              ...(referencia[0].cep && {
                cep: parseInt(referencia[0].cep, 10),
              }),
              ...(referencia[0].data_nasc && {
                data_nasc: referencia[0].data_nasc,
              }),
              ...(referencia[0].email && { email: referencia[0].email }),
              ...(referencia[0].num_col && {
                num_col: parseInt(referencia[0].num_col, 10),
              }),
              ...(referencia[0].tel1 && { tel1: referencia[0].tel1 }),
              ...(referencia[0].tel2 && { tel2: referencia[0].tel2 }),
            },
          ],
        };

        const response = await api
          .post(`/v2/${token}/referencia`, data)
          .catch((err) =>
            this.writeLog(
              `(${new Date().toLocaleString()} / ${filial}) - Erro requisição Api Isat Referência da Ordem: ${
                err.response
                  ? `${err.response.status} - ${JSON.stringify(
                      err.response.data
                    )}`
                  : err.message
              }`
            )
          );

        if (response && response.status === 200) {
          const retorno_ref = response.data[0];

          if (!retorno_ref.erro) {
            await this.sagiIsatSinc.insert({
              codigo: parseInt(num_col, 10) === 0 ? parseInt(referencia[0].codigo, 10) : referencia[0].sr_recno,
              type: parseInt(num_col, 10) === 0 ? referencia[0].tipo : 'FORNECEDOR-ENDE',
              token,
            });

            const data = {
              registros: [
                {
                  ordem,
                  tipo,
                  placa,
                  datasai,
                  codigo,
                  sequencia,
                  horasai,
                  status,
                  num_col,
                  cnh,
                  filial: filial_ordem,
                  observacoes,
                  sr_recno,
                  tipo_retorno,
                  tipo_ordem,
                  tipo_cacamba,
                },
              ],
            };

            const response = await api
              .post(`/v3/ordem_rastreio_v3`, data, {
                headers: {
                  'Authorization': `Basic ${Buffer.from(`${idempresa}:${token}`).toString('base64')}`
                }
              })
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
              const retorno_ord = response.data[0];

              if (
                !retorno_ord.erro ||
                retorno_ord.erro.indexOf("ncia") === -1
              ) {
                await this.ordens.delete({
                  sr_recno: retorno_ord.registro.sr_recno,
                });
              } else {
                this.writeLog(
                  `(${new Date().toLocaleString()} / ${filial}) - Ordem:${
                    retorno_ord.registro.ordem
                  }:INSERT/UPDATE:ERRO:${retorno_ord.erro}`
                );
              }
            }
          } else {
            await this.ordens.delete({
              sr_recno,
            });
          }
        } else {
          await this.ordens.delete({
            sr_recno,
          });
        }
      } else {
        await this.ordens.delete({
          sr_recno,
        });
      }
    } catch (err) {
      await this.ordens.delete({
        sr_recno,
      });

      this.writeLog(
        `(${new Date().toLocaleString()} / ${filial}) - Erro inesperado no sincronismo das Ordens: ${
          err.message
        }`
      );
    }
  }

  async updateStatusOrders({
    token,
    filial,
    movimenta_cacamba,
    data_inicial_sinc_isat,
    idempresa,
  }) {
    try {
      const ordens = await this.ordens.getOrdensForUpdateStatus({
        filial,
        data_inicial_sinc_isat,
      });

      while (ordens.length > 0) {
        const regs = ordens.splice(0, 10);

        const data = regs.map((r) => r.ordem);

        const response = await api
          .post(`/v3/ordem_rastreio_v3/status`, data, {
            headers: {
              'Authorization': `Basic ${Buffer.from(`${idempresa}:${token}`).toString('base64')}`
            }
          })
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

          await Promise.all(
            retornos.map(async (registro) => {
              const {
                ordem,
                situacao,
                checks,
                imprevistos,
                cacambas,
                kms,
                first_iter,
              } = registro;

              await this.ordens.retornoIsat({
                ordem,
                situacao: situacao.substr(0, 30),
                movimenta_cacamba,
              });

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
                } else {
                  await this.ordens.clearChecks({
                    ordem,
                    type: 'check-out',
                  });
                }
              } else {
                await this.ordens.clearChecks({
                  ordem,
                  type: 'all',
                });
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
              } else {
                await this.ordens.clearImprevistos({
                  ordem,
                });
              }

              if (movimenta_cacamba) {
                if (cacambas && cacambas[0].numeros.length > 0) {
                  await this.ordens.treatCacamba({
                    ordem,
                    cacamba: cacambas[0],
                  });
                } else {
                  await this.ordens.clearCacambas({
                    ordem,
                    type: 'IDA',
                  });
                }
                if (cacambas && cacambas[1].numeros.length > 0) {
                  await this.ordens.treatCacamba({
                    ordem,
                    cacamba: cacambas[1],
                  });
                } else {
                  await this.ordens.clearCacambas({
                    ordem,
                    type: 'VOLTA',
                  });
                }
              }

              if (kms[0].valor) {
                await this.ordens.treatKm({
                  ordem,
                  km: kms[0],
                });
              } else {
                await this.ordens.treatKm({
                  ordem,
                  km: { tipo: 'IDA', valor: 0 },
                });
              }
              if (kms[1].valor) {
                await this.ordens.treatKm({
                  ordem,
                  km: kms[1],
                });
              } else {
                await this.ordens.treatKm({
                  ordem,
                  km: { tipo: 'VOLTA', valor: 0 },
                });
              }
              if (kms.length === 3 && kms[2].valor) {
                await this.ordens.treatKm({
                  ordem,
                  km: kms[2],
                });
              } else {
                await this.ordens.treatKm({
                  ordem,
                  km: { tipo: 'ENCERRA', valor: 0 },
                });
              }

              if (first_iter.date && first_iter.time) {
                await this.ordens.setInitialDateTime({
                  ordem,
                  date: first_iter.date,
                  time: first_iter.time,
                });
              }

              // if (situacao.indexOf("ENCONTRADA") !== -1) {
              //  this.writeLog(
              //    `(${new Date().toLocaleString()} / ${filial}) - Status da Ordem:${ordem}:${situacao}`
              //  );
              // }
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

  async getOrdersWithRouting({
    token,
    filial,
    idempresa,
  }) {
    try {
      const response = await api
        .get(`/v3/ordem_rastreio_v3/orders-with-routing`, {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${idempresa}:${token}`).toString('base64')}`
          }
        })
        .catch((err) =>
          this.writeLog(
            `(${new Date().toLocaleString()} / ${filial}) - Erro requisição Api Isat Ordens roteirizadas: ${
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

        while (retornos.length > 0) {
          const {
            id,
            ordem,
            placa,
            codigo,
            data,
          } = (retornos.splice(0, 1))[0];

          if(await this.ordens.setRoutingOrder({
            ordem,
            placa,
            codigo,
            data,
          })) {
            await api
              .delete(`/v3/ordem_rastreio_v3/orders-with-routing/delete?id=${id}`, {
                headers: {
                  'Authorization': `Basic ${Buffer.from(`${idempresa}:${token}`).toString('base64')}`
                }
              })
              .catch((err) =>
                this.writeLog(
                  `(${new Date().toLocaleString()} / ${filial}) - Erro requisição Api Isat Ordens roteirizadas(DELETE): ${
                    err.response
                      ? `${err.response.status} - ${JSON.stringify(
                          err.response.data
                        )}`
                      : err.message
                  }`
                )
              );
          }
        }
      }

      await this.dados.setDados({
        datetime: moment().format("DD/MM/YYYY|HH:mm:ss"),
      });
    } catch (err) {
      this.writeLog(
        `(${new Date().toLocaleString()} / ${filial}) - Erro inesperado no sincronismo das Ordens roteirizadas: ${
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
