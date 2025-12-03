const moment = require("moment");

const Dados = require("../controllers/Dados");
const CategoriaDeProdutos = require("../controllers/CategoriaDeProdutos");
const SagiIsatSinc = require("../controllers/SagiIsatSinc");

const api = require("../services/api");

class CategoriaDeProdutosService {
  constructor(window, db) {
    this.dados = new Dados(db);

    this.categoriaDeProdutos = new CategoriaDeProdutos(db);

    this.sagiIsatSinc = new SagiIsatSinc(db);

    this.window = window;
  }

  async execute({ token, filiais_isat }) {
    try {
      await this.manageCategoriaDeProdutos(token, filiais_isat);
    } catch (err) {
      this.writeLog(
        `(${new Date().toLocaleString()}) - Erro serviço categoria de produtos: ${
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
      type: "categoria_de_produtos",
    });
  }

  getIdByFilial(filial, filiais_isat) {
    const item = filiais_isat.find(obj => obj.descricao_default === filial);
    return item ? item.id : null;
  }

  async manageCategoriaDeProdutos({ token, idempresa }, filiais_isat) {
    try {
      const categorias = await this.categoriaDeProdutos.getCategoriaDeProdutos({ token });

      const categorias_com_filial = categorias
        .map(categoria => {
          const id = this.getIdByFilial(categoria.filial, filiais_isat);
          if (id !== null) {
            return {
              ...categoria,
              id_filial: id
            };
          }
          return null;
        })
        .filter(Boolean);

      while (categorias_com_filial.length > 0) {
        const regs = categorias_com_filial.splice(0, 10);

        const data = {
          registros: regs.map((r) => {
            return {
              codcat: parseInt(r.codcat, 10),
              descricao: r.descricao,
              nivel: r.nivel,
              tipo: r.tipo,
              classe: r.classe,
              id_filial: parseInt(r.id_filial, 10),
              id_sagi_senha: r.iduser ? parseInt(r.iduser, 10) : null,
              id_sagi_cag_cdc: r.codcdc ? parseInt(r.codcdc, 10) : null,
              posicao: parseInt(r.posicao, 10),
              ccusto: r.ccusto,
              cad_data: r.cad_data,
              restricao: parseFloat(r.restricao),
              caminho_cat: r.caminho_cat,
            };
          }),
        };

        const response = await api
          .post(`/v3/sagi_cag_cat_v3/`, data, {
            headers: {
              'Authorization': `Basic ${Buffer.from(`${idempresa}:${token}`).toString('base64')}`
            }
          })
          .catch((err) =>
            this.writeLog(
              `(${new Date().toLocaleString()}) - Erro requisição Api Isat Categoria de Produtos: ${
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
                  codigo: retorno.registro.codcat,
                  type: "CAG_CAT",
                  token,
                });
              } else {
                this.writeLog(
                  `(${new Date().toLocaleString()}) - Categoria de Produto:${
                    retorno.registro.codcat
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
        `(${new Date().toLocaleString()}) - Erro inesperado no sincronismo das categorias de produtos: ${
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

module.exports = CategoriaDeProdutosService;
