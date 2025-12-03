const moment = require("moment");

const Dados = require("../controllers/Dados");
const Vendedores = require("../controllers/Vendedores");
const SagiIsatSinc = require("../controllers/SagiIsatSinc");

const api = require("../services/api");

class VendedoresService {
  constructor(window, db) {
    this.dados = new Dados(db);

    this.vendedores = new Vendedores(db);

    this.sagiIsatSinc = new SagiIsatSinc(db);

    this.window = window;
  }

  async execute({ token, filiais_isat }) {
    try {
      await this.manageVendedores(token, filiais_isat);
    } catch (err) {
      this.writeLog(
        `(${new Date().toLocaleString()}) - Erro serviço vendedores: ${
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
      type: "vendedores",
    });
  }

  getIdByFilial(filial, filiais_isat) {
    const item = filiais_isat.find(obj => obj.descricao_default === filial);
    return item ? item.id : null;
  }

  async manageVendedores({ token, idempresa }, filiais_isat) {
    try {
      const vendedores = await this.vendedores.getVendedores({ token });

      const vendedores_com_filial = vendedores
        .map(vendedor => {
          const id = this.getIdByFilial(vendedor.filial, filiais_isat);
          if (id !== null) {
            return {
              ...vendedor,
              id_filial: id
            };
          }
          return null;
        })
        .filter(Boolean);

      while (vendedores_com_filial.length > 0) {
        const regs = vendedores_com_filial.splice(0, 10);

        const data = {
          registros: regs.map((r) => {
            return {
              codvnd: parseInt(r.codvnd, 10),
              vendedor: r.vendedor,
              apelido: r.apelido,
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
              id_sagi_senha: r.iduser ? parseInt(r.iduser, 10) : null,
              obs: r.obs,
              numcid: r.numcid ? parseInt(r.numcid, 10) : null,
              fpg_comiss: parseInt(r.fpg_comiss, 10),
              tp_comiss: r.tp_comiss,
              percomis_min: parseFloat(r.percomis_min),
              percomis_max: parseFloat(r.percomis_max),
              id_sagi_cag_cre: r.codcre ? parseInt(r.codcre, 10) : null,
              id_sagi_cag_cdc: r.codcdc ? parseInt(r.codcdc, 10) : null,
              id_filial: parseInt(r.id_filial, 10),
              status: r.status,
              cod_pais: parseInt(r.cod_pais, 10),
              cod_pais1: parseInt(r.cod_pais1, 10),
              gerar_comissao_nao_recebida: r.gerar_comissao_nao_recebida,
            };
          }),
        };

        const response = await api
          .post(`/v3/sagi_cag_vnd_v3/`, data, {
            headers: {
              'Authorization': `Basic ${Buffer.from(`${idempresa}:${token}`).toString('base64')}`
            }
          })
          .catch((err) =>
            this.writeLog(
              `(${new Date().toLocaleString()}) - Erro requisição Api Isat Vendedores: ${
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
                  codigo: retorno.registro.codvnd,
                  type: "CAG_VND",
                  token,
                });
              } else {
                this.writeLog(
                  `(${new Date().toLocaleString()}) - Vendedor:${
                    retorno.registro.codvnd
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
        `(${new Date().toLocaleString()}) - Erro inesperado no sincronismo dos vendedores: ${
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

module.exports = VendedoresService;
