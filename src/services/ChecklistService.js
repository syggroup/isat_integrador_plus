const moment = require("moment");

const Dados = require("../controllers/Dados");
const Checklist = require("../controllers/Checklist");
const SagiIsatSinc = require("../controllers/SagiIsatSinc");

const api = require("./api");

class ChecklistService {
  constructor(window, db) {
    this.dados = new Dados(db);

    this.checklist = new Checklist(db);

    this.sagiIsatSinc = new SagiIsatSinc(db);

    this.window = window;
  }

  async execute({ token, filiais_isat }) {
    try {
      await this.manageChecklist(token, filiais_isat);
    } catch (err) {
      this.writeLog(
        `(${new Date().toLocaleString()}) - Erro serviço checklist: ${
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
      type: "checklist",
    });
  }

  getIdByFilial(filial, filiais_isat) {
    const item = filiais_isat.find(obj => obj.descricao_default === filial);
    return item ? item.id : null;
  }

  async manageChecklist({ token, idempresa }, filiais_isat) {
    try {
      const checklists = await this.checklist.getChecklist({ token });

      const checklists_com_filial = checklists
        .map(checklist => {
          const id = this.getIdByFilial(checklist.filial, filiais_isat);
          if (id !== null) {
            return {
              ...checklist,
              id_filial: id
            };
          }
          return null;
        })
        .filter(Boolean);

      while (checklists_com_filial.length > 0) {
        const regs = checklists_com_filial.splice(0, 10);

        const data = {
          registros: regs.map((r) => {
            return {
              checklist_id: parseInt(r.checklist_id, 10),
              tipo: parseInt(r.tipo, 10),
              descricao: r.descricao,
              id_sagi_senha: r.iduser ? parseInt(r.iduser, 10) : null,
              id_filial: parseInt(r.id_filial, 10),
              data: r.data,
              hora: r.hora
            };
          }),
        };

        const response = await api
          .post(`/v3/sagi_amb_checklist_base_v3/`, data, {
            headers: {
              'Authorization': `Basic ${Buffer.from(`${idempresa}:${token}`).toString('base64')}`
            }
          })
          .catch((err) =>
            this.writeLog(
              `(${new Date().toLocaleString()}) - Erro requisição Api Isat Checklist: ${
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
                  codigo: retorno.registro.checklist_id,
                  type: "SAGI_AMB_CHECKLIST_BASE",
                  token,
                });
              } else {
                this.writeLog(
                  `(${new Date().toLocaleString()}) - Checklist:${
                    retorno.registro.checklist_id
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
        `(${new Date().toLocaleString()} / ${filial}) - Erro inesperado no sincronismo dos checklist: ${
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

module.exports = ChecklistService;
