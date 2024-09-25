const moment = require("moment");

const Dados = require("../controllers/Dados");
const Weighings = require("../controllers/Weighings");

const api = require("../services/api");

class WeighingsService {
  constructor(window, db) {
    this.dados = new Dados(db);

    this.weighings = new Weighings(db);

    this.window = window;
  }

  async execute() {
    try {
      await this.manageWeighings();
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
      type: "tickets",
    });
  }

  async manageWeighings() {
    try {
      const idempresa = await this.dados.getNomeGeral();

      const syg_create_pesagem_liquida2 = await this.dados.getFunctionExists('syg_create_pesagem_liquida2');

      const response = await api
        .get(`/v2/bd9e6bc2c760d35bd8a70c818cece692/pesagens_pendentes/${idempresa}`)
        .catch((err) =>
          this.writeLog(
            `(${new Date().toLocaleString()}) - Erro requisição consulta Pesagens: ${
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

        const inserts = registros.map(({ id, ordem, codfor, codmot, codtransp, unidade_negocio, placa, frete, filial, data, hora, produtos, habilita_preco }) => {
          return {
            insert: parseInt(syg_create_pesagem_liquida2, 10) === 0 ? `select * from syg_create_pesagem_liquida(
              ${ordem},
              ${codfor},
              ${codmot},
              ${codtransp},
              ${unidade_negocio},
              '${placa}',
              '${frete}',
              '${filial}',
              '${data}',
              '${hora}',
              '{${produtos
                .map(
                  p =>
                    `{${p.sr_recno},"",${p.liquido},${
                      p.desconto
                    },"${p.fotos.join('||')}"}`,
                )
                .join()}}'
            )` : `select * from syg_create_pesagem_liquida2(
              ${ordem},
              ${codfor},
              ${codmot},
              ${codtransp},
              ${unidade_negocio},
              '${placa}',
              '${frete}',
              '${filial}',
              '${data}',
              '${hora}',
              '{${produtos
                .map(
                  p =>
                    `{${p.sr_recno},${p.preco},${p.liquido},${
                      p.desconto
                    },"${p.fotos.join('||')}"}`,
                )
                .join()}}',
                '${habilita_preco}'
            )`,
            id,
          };
        });

        while (inserts.length > 0) {
          const reg = inserts.splice(0, 1);

          const try_insert = await this.weighings.insert(reg[0].insert);

          await api
            .put(`/v2/bd9e6bc2c760d35bd8a70c818cece692/set_status_pesagem`, {
              id: reg[0].id,
              sync: try_insert.error !== "" ? false : true,
              error_sync: try_insert.error,
              numbol: try_insert.numbol
            })
            .catch((err) =>
              this.writeLog(
                `(${new Date().toLocaleString()}) - Erro requisição atualiza status Pesagem: ${
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
    } catch (err) {
      this.writeLog(
        `(${new Date().toLocaleString()}) - Erro inesperado no sincronismo das Pesagens: ${
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

module.exports = WeighingsService;
