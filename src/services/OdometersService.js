/* const moment = require("moment");

const Dados = require("../controllers/Dados");

class OdometersService {
  constructor(window, db) {
    this.dados = new Dados(db);

    this.window = window;
  }

  async execute() {
    try {
      this.writeLog(
        `(${new Date().toLocaleString()}) - Iniciando serviço hodometro veículos`
      );

      this.writeLog(
        `(${new Date().toLocaleString()}) - Serviço hodometro veículos finalizado`
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
}

module.exports = OdometersService; */
