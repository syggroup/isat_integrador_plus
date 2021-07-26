const moment = require("moment");

const Dados = require("../controllers/Dados");
const Veiculos = require("../controllers/Veiculos");

const api = require("../services/api");

class VehiclesService {
  constructor(window, db) {
    this.dados = new Dados(db);

    this.veiculos = new Veiculos(db);

    this.window = window;
  }

  async execute({ tokens }) {
    try {
      this.writeLog(
        `(${new Date().toLocaleString()}) - Iniciando serviço veículos`
      );

      await Promise.all(
        tokens.map(({ token, filial }) => {
          return Promise.all([this.manageVehicles(token, filial)]);
        })
      );

      this.writeLog(
        `(${new Date().toLocaleString()}) - Serviço veículos finalizado`
      );
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

  async manageVehicles(token, filial) {
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
            const count = await this.veiculos.update(registro);
            this.writeLog(
              `(${new Date().toLocaleString()} / ${filial}) - Veiculo:${
                registro.placa
              }:${
                count > 0 ? "OK" : "ERRO:Placa não encontrada na base de dados"
              }`
            );
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
