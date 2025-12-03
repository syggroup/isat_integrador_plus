const moment = require("moment");

const Dados = require("../controllers/Dados");
const Compradores = require("../controllers/Compradores");
const SagiIsatSinc = require("../controllers/SagiIsatSinc");

const api = require("../services/api");

class CompradoresService {
  constructor(window, db) {
    this.dados = new Dados(db);

    this.compradores = new Compradores(db);

    this.sagiIsatSinc = new SagiIsatSinc(db);

    this.window = window;
  }

  async execute({ token, filiais_isat }) {
    try {
      await this.manageCompradores(token, filiais_isat);
    } catch (err) {
      this.writeLog(
        `(${new Date().toLocaleString()}) - Erro serviço compradores: ${
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
      type: "compradores",
    });
  }

  getIdByFilial(filial, filiais_isat) {
    const item = filiais_isat.find(obj => obj.descricao_default === filial);
    return item ? item.id : null;
  }

  async manageCompradores({ token, idempresa }, filiais_isat) {
    try {
      const compradores = await this.compradores.getCompradores({ token });

      const compradores_com_filial = compradores
        .map(comprador => {
          const id = this.getIdByFilial(comprador.filial, filiais_isat);
          if (id !== null) {
            return {
              ...comprador,
              id_filial: id
            };
          }
          return null;
        })
        .filter(Boolean);

      while (compradores_com_filial.length > 0) {
        const regs = compradores_com_filial.splice(0, 10);

        const data = {
          registros: regs.map((r) => {
            return {
              codcom: parseInt(r.codcom, 10),
              comprador: r.comprador,
              fanta: r.fanta,
              fone: r.fone,
              fone2: r.fone2,
              cel: r.cel,
              nextel: r.nextel,
              ende: r.ende,
              bairro: r.bairro,
              cidade: r.cidade,
              uf: r.uf,
              ende1: r.ende1,
              bairro1: r.bairro1,
              cidade1: r.cidade1,
              uf1: r.uf1,
              cep: r.cep,
              cep1: r.cep1,
              cod_pais: parseInt(r.cod_pais, 10),
              cod_pais1: parseInt(r.cod_pais1, 10),
              tip: r.tip,
              cpf_cnpj: r.cpf_cnpj,
              iest: r.iest,
              rg: r.rg,
              banco: r.banco,
              conta: r.conta,
              agencia: r.agencia,
              email: r.email,
              site: r.site,
              prazo: parseInt(r.prazo, 10),
              data_cad: r.data_cad,
              obs: r.obs,
              numcid: r.numcid ? parseInt(r.numcid, 10) : null,
              id_sagi_regiao: r.regiao ? parseInt(r.regiao, 10) : null,
              id_sagi_cag_fun: r.codfun ? parseInt(r.codfun, 10) : null,
              percomis_min: parseFloat(r.percomis_min),
              percomis_max: parseFloat(r.percomis_max),
              id_sagi_cag_cre: r.codcre ? parseInt(r.codcre, 10) : null,
              id_sagi_cag_cdc: r.cag_cdc_id ? parseInt(r.cag_cdc_id, 10) : null,
              id_filial: parseInt(r.id_filial, 10),
              status: r.status,
              placa: r.placa,
              id_sagi_senha: r.iduser ? parseInt(r.iduser, 10) : null,
              backoffice: r.backoffice,
              vlr_comissao_visita: r.vlr_comissao_visita ? parseFloat(r.vlr_comissao_visita) : null,
              vlr_comissao_novos_for: r.vlr_comissao_novos_for ? parseFloat(r.vlr_comissao_novos_for) : null,
              comp_empresa: r.comp_empresa,
            };
          }),
        };

        const response = await api
          .post(`/v3/sagi_cag_ide_v3/`, data, {
            headers: {
              'Authorization': `Basic ${Buffer.from(`${idempresa}:${token}`).toString('base64')}`
            }
          })
          .catch((err) =>
            this.writeLog(
              `(${new Date().toLocaleString()}) - Erro requisição Api Isat Compradores: ${
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
                  codigo: retorno.registro.codcom,
                  type: "CAG_IDE",
                  token,
                });
              } else {
                this.writeLog(
                  `(${new Date().toLocaleString()}) - Comprador:${
                    retorno.registro.codcom
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
        `(${new Date().toLocaleString()}) - Erro inesperado no sincronismo dos compradores: ${
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

module.exports = CompradoresService;
