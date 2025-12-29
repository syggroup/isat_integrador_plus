const moment = require("moment");
const { hostname, userInfo } = require("os");

const Dados = require("../controllers/Dados");
const Parametros = require("../controllers/Parametros");
const ReferencesService = require("./ReferencesService");
const VehiclesService = require("./VehiclesService");
const OrdersService = require("./OrdersService");
const ContainersService = require("./ContainersService");
const TicketsService = require("./TicketsService");
const WeighingsService = require("./WeighingsService");

const CategoriaDeFornecedoresService = require("./CategoriaDeFornecedoresService");
const SetoresService = require("./SetoresService");
const SagiUnidadesService = require("./SagiUnidadesService");
const ClassificadoresService = require("./ClassificadoresService");
const RegiaoService = require("./RegiaoService");
const FuncionariosService = require("./FuncionariosService");
const ChecklistService = require("./ChecklistService");
const ControladoresService = require("./ControladoresService");
const SagiFormaPagtosService = require("./SagiFormaPagtosService");
const CentroDeContasService = require("./CentroDeContasService");
const PrazosService = require("./PrazosService");
const CentroDeCustosService = require("./CentroDeCustosService");
const ClasseDeCredoresService = require("./ClasseDeCredoresService");
const CredoresService = require("./CredoresService");
const VendedoresService = require("./VendedoresService");
const CompradoresService = require("./CompradoresService");
const UsuariosService = require("./UsuariosService");
const CategoriaDeProdutosService = require("./CategoriaDeProdutosService");
const NcmService = require("./NcmService");
const TipoDeProdutosService = require("./TipoDeProdutosService");
const SagiListaOnuService = require("./SagiListaOnuService");
const ProdutosService = require("./ProdutosService");
const Produtos2Service = require("./Produtos2Service");
const TipoCaminhaoService = require("./TipoCaminhaoService");
const SagiCadAtivoService = require("./SagiCadAtivoService");
const ContratosServ3Service = require("./ContratosServ3Service");

const api = require("../services/api");

class StartService {
  constructor(window, db, app_version = null, isRunning = {}, filiais_isat = {}, quitApp = {}, alreadyExecutedToday = {}) {
    this.dados = new Dados(db);
    this.parametros = new Parametros(db);

    this.referencesService = new ReferencesService(window, db);
    this.vehiclesService = new VehiclesService(window, db);
    this.ordersService = new OrdersService(window, db);
    this.containersService = new ContainersService(window, db);
    this.ticketsService = new TicketsService(window, db);
    this.weighingsService = new WeighingsService(window, db);

    this.categoriaDeFornecedoresService = new CategoriaDeFornecedoresService(window, db);
    this.setoresService = new SetoresService(window, db);
    this.sagiUnidadesService = new SagiUnidadesService(window, db);
    this.classificadoresService = new ClassificadoresService(window, db);
    this.regiaoService = new RegiaoService(window, db);
    this.funcionariosService = new FuncionariosService(window, db);
    this.controladoresService = new ControladoresService(window, db);
    this.checklistService = new ChecklistService(window, db);
    this.sagiFormaPagtosService = new SagiFormaPagtosService(window, db);
    this.centroDeContasService = new CentroDeContasService(window, db);
    this.prazosService = new PrazosService(window, db);
    this.centroDeCustosService = new CentroDeCustosService(window, db);
    this.classeDeCredoresService = new ClasseDeCredoresService(window, db);
    this.credoresService = new CredoresService(window, db);
    this.vendedoresService = new VendedoresService(window, db);
    this.compradoresService = new CompradoresService(window, db);
    this.usuariosService = new UsuariosService(window, db);
    this.categoriaDeProdutosService = new CategoriaDeProdutosService(window, db);
    this.ncmService = new NcmService(window, db);
    this.tipoDeProdutosService = new TipoDeProdutosService(window, db);
    this.sagiListaOnuService = new SagiListaOnuService(window, db);
    this.produtosService = new ProdutosService(window, db);
    this.produtos2Service = new Produtos2Service(window, db);
    this.tipoCaminhaoService = new TipoCaminhaoService(window, db);
    this.sagiCadAtivoService = new SagiCadAtivoService(window, db);
    this.contratosServ3Service = new ContratosServ3Service(window, db);

    this.tokens = [];
    this.unique_tokens = [];
    this.window = window;
    this.app_version = app_version;
    this.isRunning = isRunning;
    this.filiais_isat = filiais_isat;
    this.quitApp = quitApp;
    this.alreadyExecutedToday = alreadyExecutedToday;
  }

  async start(sygecom_cloud) {
    try {
      const { gps_aberto, filiais, nomegeral, versao, hab_servicos_3, existe_pl_syg_crud_ordem_serv3 } = (await this.dados.getDados())[0];
      // const split_versao = versao.split(".");

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

          this.sendMachineDataToIsat(sygecom_cloud, versao);

          if (await this.checkUpdateSagi()) { this.quitApp.quit(); }
          await this.vehiclesService.execute({
            tokens: this.unique_tokens,
            filiais_isat:
            this.filiais_isat.get(),
          });
           if (await this.checkUpdateSagi()) { this.quitApp.quit(); }
          await this.containersService.execute({
            tokens: this.unique_tokens,
            nfiliais: filiais,
          });
          if (await this.checkUpdateSagi()) { this.quitApp.quit(); }
          await this.referencesService.execute({ tokens: this.unique_tokens });
          if (await this.checkUpdateSagi()) { this.quitApp.quit(); }
          await this.weighingsService.execute();

          /* if (
            versao.substr(0, 1).toUpperCase() === 'T' ||
            parseInt(split_versao[0], 10) > 9 ||
            (parseInt(split_versao[0], 10) == 9 && parseInt(split_versao[1], 10) > 6) ||
            (parseInt(split_versao[0], 10) == 9 && parseInt(split_versao[1], 10) == 6 && parseInt(split_versao[3], 10) >= 100834)
          ) { // 9.6.0.100834 && [ '9', '6', '0', '100834' ]
            if (await this.checkUpdateSagi()) { this.quitApp.quit(); }
            await this.ticketsService.execute({ tokens: this.tokens });
          } */

          if ( // se serviço 3.0 habilitado, se existe a pl syg_crud_ordem_serv3 e filiais no isat = filiais no sagi (-1 pq no isat tem a filial TODAS)
            [
              1094, // ORLANDI
              1000, // COMERCIAL
              804   // REPET
            ].includes(parseInt(nomegeral, 10))
              && hab_servicos_3
              && existe_pl_syg_crud_ordem_serv3
              && this.contarTokensUnicos(this.tokens) === 1
              && Object.keys(this.filiais_isat.get()).length === 1
              && (Object.values(this.filiais_isat.get())[0].filiais.length - 1) >= parseInt(filiais, 10)
          ) {
            const ms_ultima_vez_que_integrou = this.alreadyExecutedToday.get();

            if (ms_ultima_vez_que_integrou === null || moment().diff(moment(ms_ultima_vez_que_integrou), 'days') >= 1) { // ainda não executou hoje
              this.alreadyExecutedToday.set(moment());

              if (await this.checkUpdateSagi()) { this.quitApp.quit(); }
              await this.categoriaDeFornecedoresService.execute({ token: this.unique_tokens[0], filiais_isat: Object.values(this.filiais_isat.get())[0].filiais });
              console.log('Finalizei categor');

              if (await this.checkUpdateSagi()) { this.quitApp.quit(); }
              await this.sagiUnidadesService.execute({ token: this.unique_tokens[0], filiais_isat: Object.values(this.filiais_isat.get())[0].filiais });
              console.log('Finalizei sagi_unidade');

              if (await this.checkUpdateSagi()) { this.quitApp.quit(); }
              await this.setoresService.execute({ token: this.unique_tokens[0] });
              console.log('Finalizei setores');

              if (await this.checkUpdateSagi()) { this.quitApp.quit(); }
              await this.classificadoresService.execute({ token: this.unique_tokens[0], filiais_isat: Object.values(this.filiais_isat.get())[0].filiais });
              console.log('Finalizei classificadores');

              if (await this.checkUpdateSagi()) { this.quitApp.quit(); }
              await this.regiaoService.execute({ token: this.unique_tokens[0] });
              console.log('Finalizei regiao');

              if (await this.checkUpdateSagi()) { this.quitApp.quit(); }
              await this.funcionariosService.execute({ token: this.unique_tokens[0], filiais_isat: Object.values(this.filiais_isat.get())[0].filiais });
              console.log('Finalizei cag_fun');

              if (await this.checkUpdateSagi()) { this.quitApp.quit(); }
              await this.controladoresService.execute({ token: this.unique_tokens[0] });
              console.log('Finalizei controladores');

              if (await this.checkUpdateSagi()) { this.quitApp.quit(); }
              await this.checklistService.execute({ token: this.unique_tokens[0], filiais_isat: Object.values(this.filiais_isat.get())[0].filiais });
              console.log('Finalizei checklist');

              if (await this.checkUpdateSagi()) { this.quitApp.quit(); }
              await this.sagiFormaPagtosService.execute({ token: this.unique_tokens[0] });
              console.log('Finalizei sagi_forma_pagto');

              if (await this.checkUpdateSagi()) { this.quitApp.quit(); }
              await this.centroDeContasService.execute({ token: this.unique_tokens[0], filiais_isat: Object.values(this.filiais_isat.get())[0].filiais });
              console.log('Finalizei centro de contas');

              if (await this.checkUpdateSagi()) { this.quitApp.quit(); }
              await this.prazosService.execute({ token: this.unique_tokens[0] });
              console.log('Finalizei prazos');

              if (await this.checkUpdateSagi()) { this.quitApp.quit(); }
              await this.centroDeCustosService.execute({ token: this.unique_tokens[0], filiais_isat: Object.values(this.filiais_isat.get())[0].filiais });
              console.log('Finalizei centro de custos');

              if (await this.checkUpdateSagi()) { this.quitApp.quit(); }
              await this.classeDeCredoresService.execute({ token: this.unique_tokens[0] });
              console.log('Finalizei classde de credores');

              if (await this.checkUpdateSagi()) { this.quitApp.quit(); }
              await this.credoresService.execute({ token: this.unique_tokens[0] });
              console.log('Finalizei credores');

              if (await this.checkUpdateSagi()) { this.quitApp.quit(); }
              await this.vendedoresService.execute({ token: this.unique_tokens[0], filiais_isat: Object.values(this.filiais_isat.get())[0].filiais });
              console.log('Finalizei vendedores');

              if (await this.checkUpdateSagi()) { this.quitApp.quit(); }
              await this.compradoresService.execute({ token: this.unique_tokens[0], filiais_isat: Object.values(this.filiais_isat.get())[0].filiais });
              console.log('Finalizei compradores');

              if (await this.checkUpdateSagi()) { this.quitApp.quit(); }
              await this.usuariosService.execute({ token: this.unique_tokens[0], filiais_isat: Object.values(this.filiais_isat.get())[0].filiais });
              console.log('Finalizei usuarios');

              if (await this.checkUpdateSagi()) { this.quitApp.quit(); }
              await this.categoriaDeProdutosService.execute({ token: this.unique_tokens[0], filiais_isat: Object.values(this.filiais_isat.get())[0].filiais });
              console.log('Finalizei categoria de produtos');

              if (await this.checkUpdateSagi()) { this.quitApp.quit(); }
              await this.ncmService.execute({ token: this.unique_tokens[0] });
              console.log('Finalizei ncm');

              if (await this.checkUpdateSagi()) { this.quitApp.quit(); }
              await this.tipoDeProdutosService.execute({ token: this.unique_tokens[0] });
              console.log('Finalizei tipo de produtos');

              if (await this.checkUpdateSagi()) { this.quitApp.quit(); }
              await this.sagiListaOnuService.execute({ token: this.unique_tokens[0] });
              console.log('Finalizei sagi lista onu');

              if (await this.checkUpdateSagi()) { this.quitApp.quit(); }
              await this.produtosService.execute({ token: this.unique_tokens[0], filiais_isat: Object.values(this.filiais_isat.get())[0].filiais });
              console.log('Finalizei produtos');

              if (await this.checkUpdateSagi()) { this.quitApp.quit(); }
              await this.produtos2Service.execute({ token: this.unique_tokens[0] });
              console.log('Finalizei produtos2');

              if (await this.checkUpdateSagi()) { this.quitApp.quit(); }
              await this.tipoCaminhaoService.execute({ token: this.unique_tokens[0] });
              console.log('Finalizei tipo caminhao');

              if (await this.checkUpdateSagi()) { this.quitApp.quit(); }
              await this.sagiCadAtivoService.execute({ token: this.unique_tokens[0], filiais_isat: Object.values(this.filiais_isat.get())[0].filiais });
              console.log('Finalizei ativos');
            }

            if (await this.checkUpdateSagi()) { this.quitApp.quit(); }
            await this.contratosServ3Service.execute({ token: this.unique_tokens[0], filiais_isat: Object.values(this.filiais_isat.get())[0].filiais });
            console.log('Finalizei contratos');

            if (await this.checkUpdateSagi()) { this.quitApp.quit(); }
            await this.ordersService.execute({ tokens: this.tokens, filiais_isat: this.filiais_isat.get(), token: this.unique_tokens[0] });
          } else {
            if (await this.checkUpdateSagi()) { this.quitApp.quit(); }
            await this.ordersService.execute({ tokens: this.tokens, filiais_isat: this.filiais_isat.get() });
          }
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
    }
  }

  async verificaIntegracaoIsat() {
    try {
      const idempresa = await this.dados.getNomeGeral();
      const { filiais } = (await this.dados.getDados())[0];

      if (idempresa && idempresa.replace(/\D/g) % 1 === 0) {
        const response = await api
          .get(`/v2/bd9e6bc2c760d35bd8a70c818cece692/cliente/${idempresa}?filiais=${encodeURIComponent(JSON.stringify(this.generateBranches(filiais)))}`)
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

          const _filiais_isat = {};

          await Promise.all(
            registros.map(async ({ filial, token, motoristas_x_veiculos_sagi, data_hora_encerrar_atividade_no_sagi, finaliza_coleta_envio_sagi, finaliza_embarque_todos_sagi, filiais: array_filiais_isat }) => {
              if (filial) {
                await this.parametros.setToken({
                  filial,
                  token,
                  nfiliais: filiais,
                });

                _filiais_isat[filial] = { motoristas_x_veiculos_sagi, token, data_hora_encerrar_atividade_no_sagi, finaliza_coleta_envio_sagi, finaliza_embarque_todos_sagi, filiais: array_filiais_isat };
              }
            })
          );

          this.filiais_isat.set(_filiais_isat);

          this.writeLog(
            `(${new Date().toLocaleString()}) - Filiais isat: (${JSON.stringify(this.filiais_isat.get(), null, 2)})`
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

  async clearGpsAberto() {
    try {
      await this.dados.setDados({
        datetime: "",
      });
    } catch (err) {}
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

  async sendMachineDataToIsat(sygecom_cloud, versao) {
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
          sygecom_cloud,
          sagi_versao: versao,
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

  generateBranches(nfiliais) {
    let filiais = [];

    for (let i = 0; i < nfiliais; i++) {
      if (i === 0) {
        filiais.push("MATRIZ");
      } else {
        filiais.push(`FILIAL${i}`);
      }
    }

    return filiais;
  }

  contarTokensUnicos(array) {
    return new Set(array.map(obj => obj.token)).size;
  }
}

module.exports = StartService;
