const moment = require("moment");
const { hostname, userInfo } = require("os");

const Dados = require("../controllers/Dados");
const Parametros = require("../controllers/Parametros");
const ReferencesService = require("./ReferencesService");
const VehiclesService = require("./VehiclesService");
const OrdersService = require("./OrdersService");
const ContainersService = require("./ContainersService");

const api = require("../services/api");

class StartService {
  constructor(window, db, app_version = null, isRunning = {}) {
    this.dados = new Dados(db);
    this.parametros = new Parametros(db);

    this.referencesService = new ReferencesService(window, db);
    this.vehiclesService = new VehiclesService(window, db);
    this.ordersService = new OrdersService(window, db);
    this.containersService = new ContainersService(window, db);

    this.tokens = [];
    this.unique_tokens = [];
    this.window = window;
    this.app_version = app_version;
    this.isRunning = isRunning;
  }

  async start() {
    try {
      const { gps_aberto, filiais } = (await this.dados.getDados())[0];

      const date_time = gps_aberto ? gps_aberto.replace("|", " ") : moment();

      const ms = moment(moment(), "DD/MM/YYYY HH:mm:ss").diff(
        moment(date_time, "DD/MM/YYYY HH:mm:ss")
      );

      this.tokens = await this.parametros.getTokens({
        filiais,
      });
      this.tokens.forEach((token) => {
        if (
          this.unique_tokens.findIndex((t) => t.token === token.token) === -1
        ) {
          this.unique_tokens.push(token);
        }
      });

      if (this.tokens.length > 0) {
        if (!gps_aberto || ms >= 1000 * 300 || this.isRunning.get()) {
          this.isRunning.set(true);

          await this.dados.setDados({
            datetime: moment().format("DD/MM/YYYY|HH:mm:ss"),
          });

          this.sendMachineDataToIsat();

          await this.vehiclesService.execute({ tokens: this.unique_tokens });

          await this.containersService.execute({
            tokens: this.unique_tokens,
            nfiliais: filiais,
          });

          await this.referencesService.execute({ tokens: this.unique_tokens });

          await this.ordersService.execute({ tokens: this.tokens });
        } else {
          this.writeLog(
            `(${new Date().toLocaleString()}) - Já tem um integrador aberto (${
              gps_aberto ? gps_aberto.replace("|", " ") : ""
            }). Por favor aguarde até 5 minutos!`
          );
        }
      } else {
        this.writeLog(
          `(${new Date().toLocaleString()}) - Sem tokens para sincronizar`
        );
      }
    } catch (err) {
      this.isRunning.set(false);
      await this.dados.setDados({
        datetime: "",
      });
      this.writeLog(
        `(${new Date().toLocaleString()}) - Erro serviço geral: ${err.message}`
      );
    } /* finally {
      clearTimeout(this.timeout);
      this.timeout = setTimeout(() => this.start(), 60000);
    } */
  }

  async verificaIntegracaoIsat() {
    try {
      const idempresa = await this.dados.getNomeGeral();
      const { filiais } = (await this.dados.getDados())[0];

      if (idempresa && idempresa.replace(/\D/g) % 1 === 0) {
        const response = await api
          .get(`/v2/bd9e6bc2c760d35bd8a70c818cece692/cliente/${idempresa}`)
          .catch((err) =>
            this.writeLog(
              `(${new Date().toLocaleString()}) - Erro requisição Api Isat integração: ${
                err.response
                  ? `${err.response.status} - ${JSON.stringify(
                      err.response.data
                    )}`
                  : err.message
              }`
            )
          );

        if (response) {
          const registros = response.data;

          const concat_retornos = [];

          await Promise.all(
            registros.map(async ({ filial, token }) => {
              if (filial) {
                await this.parametros.setToken({
                  filial,
                  token,
                  nfiliais: filiais,
                });

                concat_retornos.push(`${filial}:${token}`);
              } else {
                concat_retornos.push(
                  `Token sem filial definida no iSat:${token}`
                );
              }
            })
          );
        }
      } else {
        this.writeLog(
          `(${new Date().toLocaleString()}) - Idempresa inválido: (${idempresa})`
        );
      }
    } catch (err) {
      this.writeLog(
        `(${new Date().toLocaleString()}) - Erro verifica integração iSat: ${
          err.message
        }`
      );
    } finally {
      return true;
    }
  }

  async verificaDataInicialSincIsat() {
    try {
      await this.parametros.checkParameterDateStartSyncIsat();
    } catch (err) {
      this.writeLog(
        `(${new Date().toLocaleString()}) - Erro verifica data inicial sinc iSat: ${
          err.message
        }`
      );
    } finally {
      return true;
    }
  }

  async checkUpdateSagi() {
    let atualizacaoSagi = false;

    try {
      atualizacaoSagi = await this.dados.getForcaAtualizacao();

      if (!atualizacaoSagi) clearTimeout(this.timeoutRun);
    } catch (err) {
      this.writeLog(
        `(${new Date().toLocaleString()}) - Erro verifica atualização SAGI: ${
          err.message
        }`
      );
    }

    return atualizacaoSagi;
  }

  async getNomeGeral() {
    try {
      return await this.dados.getNomeGeral();
    } catch (err) {}
    return 0;
  }

  async getTokens() {
    try {
      const { filiais } = (await this.dados.getDados())[0];

      return await this.parametros.getTokens({
        filiais,
      });
    } catch (err) {}
    return null;
  }

  /* async odometer() {
    try {
      this.writeLog(
        `(${new Date().toLocaleString()}) - Iniciando serviço hodometro`,
        "odometers"
      );

      await this.parametros.checkParameterOdometer();

      this.writeLog(
        `(${new Date().toLocaleString()}) - Serviço hodometro finalizado`,
        "odometers"
      );
    } catch (err) {
      this.writeLog(
        `(${new Date().toLocaleString()}) - Erro serviço hodometro: ${
          err.message
        }`,
        "odometers"
      );
    }

    setTimeout(() => this.odometer(), 60000);
  } */

  async sendMachineDataToIsat() {
    try {
      const idempresa = await this.dados.getNomeGeral();
      const datetime = moment().format("YYYY-MM-DD HH:mm:ss");

      await api
        .post("/v2/bd9e6bc2c760d35bd8a70c818cece692/integrador", {
          idempresa,
          username: userInfo().username,
          hostname: hostname(),
          date: datetime.split(" ")[0],
          time: datetime.split(" ")[1],
          app_version: this.app_version,
        })
        .catch((err) =>
          this.writeLog(
            `(${new Date().toLocaleString()}) - Erro requisição Api Isat dados da máquina: ${
              err.response
                ? `${err.response.status} - ${JSON.stringify(
                    err.response.data
                  )}`
                : err.message
            }`
          )
        );
    } catch (err) {
      this.writeLog(
        `(${new Date().toLocaleString()}) - Erro enivar dados da máquina para o iSat: ${
          err.message
        }`,
        "generals"
      );
    }
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  writeLog(log, type = "generals") {
    this.window.webContents.send("log", {
      log,
      type,
    });
  }
}

module.exports = StartService;
