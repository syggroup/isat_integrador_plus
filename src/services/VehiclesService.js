const moment = require("moment");

const Dados = require("../controllers/Dados");
const Veiculos = require("../controllers/Veiculos");

const api = require("../services/api");

class VehiclesService {
  constructor(window, db) {
    this.dados = new Dados(db);

    this.veiculos = new Veiculos(db);

    this.window = window;

    this.placas_isat = [];
  }

  async execute({ tokens, filiais_isat }) {
    try {
      await Promise.all(
        tokens.map(({ token, filial }) => this.manageVehicles(token, filial, filiais_isat))
      );

      if (this.placas_isat.length > 0) {
        await this.veiculos.notFindInIsatAndUpdate(this.placas_isat);
      }
    } catch (err) {
      this.writeLog(
        `(${new Date().toLocaleString()}) - Erro serviço veículos: ${
          err.message
        }`
      );
    } finally {
      await this.dados.setDados({
        datetime: moment().format("DD/MM/YYYY|HH:mm:ss"),
      });
    }
  }

  writeLog(log) {
    this.window.webContents.send("log", {
      log,
      type: "vehicles",
    });
  }

  async manageVehicles(token, filial, filiais_isat) {
    try {
      const response = await api
        .get(`/v2/${token}/veiculo`)
        .catch((err) =>
          this.writeLog(
            `(${new Date().toLocaleString()} / ${filial}) - Erro requisição veículos Api Isat: ${
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

        await Promise.all(
          registros.map(async (registro) => {
            this.placas_isat.push(registro.placa);

            let altera_motorista = false;
            if (filiais_isat[filial] !== undefined && parseInt(registro.codmot, 10) > 0) {
              altera_motorista = filiais_isat[filial].motoristas_x_veiculos_sagi;
            }

            const count = await this.veiculos.update(registro, altera_motorista);

            if (count === 0) {
              this.writeLog(
                `(${new Date().toLocaleString()} / ${filial}) - Veiculo:${
                  registro.placa
                }:ERRO:Placa não encontrada na base de dados
                `
              );
            }
          })
        );
      }
    } catch (err) {
      this.writeLog(
        `(${new Date().toLocaleString()} / ${filial}) - Erro inesperado veículos Api Isat: ${
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

module.exports = VehiclesService;
