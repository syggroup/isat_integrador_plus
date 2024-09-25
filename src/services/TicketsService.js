const moment = require("moment");

const Dados = require("../controllers/Dados");
const Tickets = require("../controllers/Tickets");

const api = require("../services/api");

class TicketsService {
  constructor(window, db) {
    this.dados = new Dados(db);

    this.tickets = new Tickets(db);

    this.window = window;
  }

  async execute({ tokens }) {
    try {
      await this.tickets.deleteAllDeleteAfterInsert();

      await this.manageTickets(tokens);
    } catch (err) {
      this.writeLog(
        `(${new Date().toLocaleString()}) - Erro serviço tickets: ${err.message}`
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
      type: "tickets",
    });
  }

  async manageTickets(tokens) {
    try {
      const tickets = await this.tickets.getTickets(tokens.map(t => { return { filial: t.filial, token: t.token }; }));

      const sr_recnos_delete = [];

      while (tickets.length > 0) {
        const regs = tickets.splice(0, 10);

        await Promise.all(
          regs.map(async (reg) => {
            const token = tokens.filter(t => t.filial === reg.filial)[0].token;

            if (reg.acao === 'ENTRADA' || reg.acao === 'SAIDA') {
              const data = {
                "ordem": parseInt(reg.produtos[0].num_coleta, 10),
                "tipo": reg.acao === 'ENTRADA' ? "FORNECEDOR" : "CLIENTE",
                "placa": reg.produtos[0].placa,
                "datasai": reg.produtos[0].data,
                "codigo": parseInt(reg.produtos[0].codigo, 10),
                "num_col": parseInt(reg.produtos[0].num_col, 10),
                "numbol": parseInt(reg.produtos[0].boleto, 10),
                "produtos": reg.produtos.map(produto => {
                  return {
                    "codpro": produto.codpro,
                    "subcod": produto.subcod,
                    "produto": produto.produto,
                    "un": produto.unidade,
                    "peso_liquido": parseFloat(produto.peso_liquido),
                    "desconto": parseFloat(produto.desconto),
                    "preco": parseFloat(produto.preco),
                    "valor_total": parseFloat(produto.valor_total)
                  }
                })
              };

              const response = await api
                .post(`/v2/${token}/boleto`, data)
                .catch((err) => {
                  this.writeLog(
                    `(${new Date().toLocaleString()} / ${reg.filial}) - Erro requisição Api Isat insert/update Ticket(${parseInt(reg.produtos[0].boleto, 10)}): ${
                      err.response
                        ? `${err.response.status} - ${JSON.stringify(
                            err.response.data
                          )}`
                        : err.message
                    }`
                  );

                  if (err.response && err.response.data && err.response.data.erro && err.response.data.erro.indexOf("encontra") !== -1) {
                    sr_recnos_delete.push(reg.sr_recno);
                  }
                });

              if (response && response.status === 200) {
                sr_recnos_delete.push(reg.sr_recno);
              }
            } else {
              const response = await api
                .delete(`/v2/${token}/boleto/${reg.numbol}/${reg.acao === 'ENTRADA' ? "FORNECEDOR" : "CLIENTE"}`)
                .catch((err) => {
                  this.writeLog(
                    `(${new Date().toLocaleString()} / ${reg.filial}) - Erro requisição Api Isat delete Ticket(${parseInt(reg.produtos[0].boleto, 10)}): ${
                      err.response
                        ? `${err.response.status} - ${JSON.stringify(
                            err.response.data
                          )}`
                        : err.message
                    }`
                  );

                  if (err.response && err.response.data && err.response.data.erro && err.response.data.erro.indexOf("encontra") !== -1) {
                    sr_recnos_delete.push(reg.sr_recno);
                  }
                });

              if (response && response.status === 200) {
                sr_recnos_delete.push(reg.sr_recno);
              }
            }
          })
        );

        if (sr_recnos_delete.length > 0) {
          await this.tickets.deleteBySrRecno(sr_recnos_delete);

          while(sr_recnos_delete.length > 0) {
            sr_recnos_delete.pop();
          }
        }

        await this.dados.setDados({
          datetime: moment().format("DD/MM/YYYY|HH:mm:ss"),
        });
        await this.sleep(500);
      }
    } catch (err) {
      this.writeLog(
        `(${new Date().toLocaleString()}) - Erro inesperado no sincronismo dos Tickets: ${
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

module.exports = TicketsService;
