const moment = require("moment");

const Dados = require("../controllers/Dados");
const Ordens = require("../controllers/Ordens");
const SagiIsatSinc = require("../controllers/SagiIsatSinc");

const api = require("../services/api");

class OrdersService {
  constructor(window, db) {
    this.dados = new Dados(db);

    this.ordens = new Ordens(db);

    this.sagiIsatSinc = new SagiIsatSinc(db);

    this.window = window;
  }

  async execute({ tokens, filiais_isat, token }) {
    try {
      if (token) {
        await this.manageOrders(token, true, Object.values(filiais_isat)[0].filiais);
        await this.updateStatusOrders(token, filiais_isat, true);
      } else {
        await Promise.all(
          tokens.map((token) => {
            return Promise.all([
              this.manageOrders(token, false, {}),
              this.updateStatusOrders(token, filiais_isat, false),
            ]);
          })
        );
      }

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

  getIdByFilial(filial, filiais_isat) {
    const item = filiais_isat.find(obj => obj.descricao_default === filial);
    return item ? item.id : null;
  }

  async manageOrders({ token, filial, data_inicial_sinc_isat, idempresa }, ordens_com_servico, filiais_isat) {
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
        ordens_com_servico,
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
              codigo_destino_final: parseInt(reg.codigo_destino_final, 10),
              cnh: reg.cnh.replace(/\D/g, ""),
              filial: reg.filial,
              observacoes: reg.obs,
              sr_recno: reg.sr_recno,
              tipo_retorno: reg.tipo_retorno.trim() != 'WEB' ? reg.tipo_retorno : 'TROCA',
              tipo_ordem: reg.tipo_ordem,
              tipo_cacamba: reg.tipo_cacamba,
              tipofre: reg.tipofre,
              comprador_vendedor: reg.comprador_vendedor ? reg.comprador_vendedor.replace(/['"]/g, '') : '',
              sagi_col_servico: ordens_com_servico && reg.coleta_servico ? reg.sagi_col_servico.map((sagi_col_servico) => {
                return {
                  servico_id: parseInt(sagi_col_servico.servico_id, 10),
                  servico_qtd: parseFloat(sagi_col_servico.servico_qtd),
                  servico_valor: parseFloat(sagi_col_servico.servico_valor),
                  mtr_id: parseInt(sagi_col_servico.mtr_id, 10),
                  id_sagi_cag_pro: parseInt(sagi_col_servico.id_sagi_cag_pro, 10),
                  cadri_prod_id: parseInt(sagi_col_servico.cadri_prod_id, 10),
                  serv_gestaoresiduo: sagi_col_servico.serv_gestaoresiduo,
                  serv_armazenagem: sagi_col_servico.serv_armazenagem,
                  serv_consultoria: sagi_col_servico.serv_consultoria,
                  serv_locacao: sagi_col_servico.serv_locacao,
                  id_sagi_item_contrato_serv3: parseInt(sagi_col_servico.id_sagi_item_contrato_serv3, 10),
                  sr_recno_cag_pr2: parseInt(sagi_col_servico.sr_recno_cag_pr2, 10),
                  ativos: sagi_col_servico.serv_locacao ? sagi_col_servico.ativos.map((ativo) => {
                    return {
                      ativo_id: parseInt(ativo.ativo_id, 10),
                    };
                  }) : [],
                  residuos: sagi_col_servico.serv_gestaoresiduo ? sagi_col_servico.residuos.map((residuo) => {
                    const id = this.getIdByFilial(residuo.filial, filiais_isat);
                    if (id !== null) {
                      return {
                        id_sagi_cag_pro: parseInt(residuo.id_sagi_cag_pro, 10),
                        id_sagi_cag_pro_des: parseInt(residuo.id_sagi_cag_pro_des, 10),
                        peso: parseFloat(residuo.peso),
                        peso_des: parseFloat(residuo.peso_des),
                        modnot: residuo.modnot,
                        num_nf: parseInt(residuo.num_nf, 10),
                        serie_nf: residuo.serie_nf,
                        num_brm: residuo.num_brm,
                        id_filial: id,
                        preco: parseFloat(residuo.preco),
                        est_fisico: residuo.est_fisico,
                        classe: residuo.classe,
                        acondiciona: residuo.acondiciona,
                        num_onu: parseInt(residuo.num_onu, 10),
                        num_risco: parseInt(residuo.num_risco, 10),
                        gru_emb: residuo.gru_emb,
                        ordem_endereco_descricao: residuo.ordem_endereco_descricao,
                      };
                    }
                    return null;
                  }).filter(Boolean) : [],
                };
              }) : [],
            };
          }).filter((reg) => {
            // se ordens_com_servico = false, passa
            if (!ordens_com_servico) return true;

            // se ordens_com_servico = true e coleta_servico = false passa
            if (!reg.coleta_servico) return true;

            // valida se sagi_col_servico existe e tem itens
            if (!reg.sagi_col_servico || reg.sagi_col_servico.length === 0) return false;

            // valida cada sagi_col_servico
            return reg.sagi_col_servico.every(servico => {
              // se serv_locacao = true, ativos deve ter itens
              if (servico.serv_locacao && (!servico.ativos || servico.ativos.length === 0)) {
                return false;
              }

              // se serv_gestaoresiduo = true, residuos deve ter itens
              if (servico.serv_gestaoresiduo && (!servico.residuos || servico.residuos.length === 0)) {
                return false;
              }

              return true;
            });
          }),
        };

        // regs não encontrados em data.registros excluir para limpar isat_ordem_temp
        await Promise.all(
          regs.filter(reg => {
            return !data.registros.some(dataReg => dataReg.sr_recno === reg.sr_recno);
          }).map(async (reg) => {
            await this.ordens.delete({
              sr_recno: reg.sr_recno
            });
          })
        );

        if(data.registros.length === 0) continue;

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
                  ((retorno.erro.indexOf("laca") !== -1 &&
                    retorno.erro.indexOf("encontrada") !== -1) ||
                   (retorno.erro.indexOf("ncia") !== -1))
                )
              ) {
                await this.ordens.delete({
                  sr_recno: retorno.registro.sr_recno,
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

  devePegarEncerrarAtividade(filiais_isat, filial) {
    if (filiais_isat.hasOwnProperty(filial)) {
      return filiais_isat[filial].data_hora_encerrar_atividade_no_sagi;
    } else if (filiais_isat.hasOwnProperty("TODAS")) {
      return filiais_isat["TODAS"].data_hora_encerrar_atividade_no_sagi;
    }

    return false;
  }

  checkFinalizaColetaEmbarque(filiais_isat, filial, parametro) {
    if (filiais_isat.hasOwnProperty(filial) && filiais_isat[filial].hasOwnProperty(parametro)) {
      return filiais_isat[filial][parametro];
    } else if (filiais_isat.hasOwnProperty("TODAS") && filiais_isat["TODAS"].hasOwnProperty(parametro)) {
      return filiais_isat["TODAS"][parametro];
    }

    return false;
  }

  async updateStatusOrders({
    token,
    filial,
    movimenta_cacamba,
    data_inicial_sinc_isat,
    idempresa,
  }, filiais_isat, ordens_com_servico) {
    try {
      const ordens = await this.ordens.getOrdensForUpdateStatus({
        filial,
        data_inicial_sinc_isat,
        ordens_com_servico,
      });

      while (ordens.length > 0) {
        const regs = ordens.splice(0, 50);

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
                encerra,
                tipo_ordem,
                tipo_retorno,
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
                  tot_cacambas: null,
                });

                if (checks[1] !== undefined) {
                  await this.ordens.treatCheck({
                    ordem,
                    check: checks[1],
                    tot_cacambas:
                      cacambas
                        && cacambas.length > 1
                        && cacambas[1].numeros
                          ? cacambas[1].numeros.length
                          : null,
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

              try {
                if (this.devePegarEncerrarAtividade(filiais_isat, filial) && encerra.date && encerra.time) {
                  await this.ordens.setCloseDateTime({
                    ordem,
                    date: encerra.date,
                    time: encerra.time,
                  });
                }
              } catch (err_encerra_atividade) {
                this.writeLog(
                  `(${new Date().toLocaleString()} / ${filial}) - Erro inesperado ao tentar salvar encerramento de atividade na Ordem (${ordem}): ${
                    err_encerra_atividade.message
                  }`
                );
              }

              try {
                if (
                    ((tipo_ordem == 'COLETA' && tipo_retorno == 'ENVIO') || (tipo_ordem == 'EMBARQUE'))
                    && (this.checkFinalizaColetaEmbarque(filiais_isat, filial, tipo_ordem == 'COLETA' ? 'finaliza_coleta_envio_sagi' : 'finaliza_embarque_todos_sagi') && encerra.date && encerra.time)
                  ) {
                  await this.ordens.setFinishOrder({
                    ordem,
                  });
                }
              } catch (err_finalizar_ordem) {
                this.writeLog(
                  `(${new Date().toLocaleString()} / ${filial}) - Erro inesperado ao tentar finalizar Ordem (${ordem}) por encerramento de atividade no driversat: ${
                    err_finalizar_ordem.message
                  }`
                );
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
