const moment = require("moment");

const Dados = require("../controllers/Dados");
const veículos = require("../controllers/Veiculos");

const api = require("../services/api");

class veículosService {
  constructor(window, db) {
    this.dados = new Dados(db);

    this.veiculos = new veículos(db);

    this.window = window;
  }

  async execute({ tokens }) {
    try {
      this.writeLog(
        `(${new Date().toLocaleString()}) - Iniciando serviço veículos`
      );

      await Promise.all(
        tokens.map(({ token }) => {
          return Promise.all([this.manageVehicles(token)]);
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

  async manageVehicles(token) {
    try {
      const response = await api
        .get(`/${token}/veiculo`)
        .catch((err) =>
          this.writeLog(
            `(${new Date().toLocaleString()}) - Erro requisição veículos Api Isat: ${
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
          const registros = response.data.dados.retorno.registros;

          await Promise.all(
            registros.map(async (registro) => {
              const count = await this.veiculos.update(registro);
              this.writeLog(
                `(${new Date().toLocaleString()}) - Veiculo:${registro.placa}:${
                  count > 0
                    ? "OK"
                    : "ERRO:Placa não encontrada na base de dados"
                }`
              );
            })
          );
        } else {
          this.writeLog(
            `(${new Date().toLocaleString()}) - Erro retorno veículos Api Isat: ${
              response.data.dados.retorno[0].erro.mensagem
            }`
          );
        }
      } else if (response && "data" in response) {
        this.writeLog(
          `(${new Date().toLocaleString()}) - Retorno inesperado veículos Api Isat: ${
            response.data
          }`
        );
      }
    } catch (err) {
      this.writeLog(
        `(${new Date().toLocaleString()}) - Erro inesperado veículos Api Isat: ${
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

module.exports = veículosService;
