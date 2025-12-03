const moment = require("moment");

const Notas = require("../controllers/Notas");
const SagiIsatSinc = require("../controllers/SagiIsatSinc");

class NotasService {
  constructor(window, db) {
    this.notas = new Notas(db);

    this.sagiIsatSinc = new SagiIsatSinc(db);

    this.window = window;
  }

  async execute({ tokens, nfiliais }) {
    try {
      await Promise.all(
        tokens.map((token) => this.manageNotas(token, nfiliais))
      );
    } catch (err) {
      this.writeLog(
        `(${new Date().toLocaleString()}) - Erro serviço notas: ${
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
      type: "notas",
    });
  }

  async manageNotas({ token, filial }, nfiliais) {
    try {
      // continuar fazendo aqui
    } catch (err) {
      this.writeLog(
        `(${new Date().toLocaleString()} / ${filial}) - Erro inesperado no sincronismo das notas: ${
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

module.exports = NotasService;
