const moment = require("moment");

const Dados = require("../controllers/Dados");
const Produtos = require("../controllers/Produtos");
const SagiIsatSinc = require("../controllers/SagiIsatSinc");

const api = require("../services/api");

class ProdutosService {
  constructor(window, db) {
    this.dados = new Dados(db);

    this.produtos = new Produtos(db);

    this.sagiIsatSinc = new SagiIsatSinc(db);

    this.window = window;
  }

  async execute({ token, filiais_isat }) {
    try {
      await this.manageProdutos(token, filiais_isat);
    } catch (err) {
      this.writeLog(
        `(${new Date().toLocaleString()}) - Erro serviço produtos: ${
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
      type: "produtos",
    });
  }

  getIdByFilial(filial, filiais_isat) {
    const item = filiais_isat.find(obj => obj.descricao_default === filial);
    return item ? item.id : null;
  }

  async manageProdutos({ token, idempresa }, filiais_isat) {
    try {
      const produtos = await this.produtos.getProdutos({ token });

      const produtos_com_filial = produtos
        .map(produto => {
          const id = this.getIdByFilial(produto.filial.trim().split("|")[0], filiais_isat);
          if (id !== null) {
            return {
              ...produto,
              id_filial: id
            };
          }
          return null;
        })
        .filter(Boolean);

      while (produtos_com_filial.length > 0) {
        const regs = produtos_com_filial.splice(0, 100);

        const data = {
          registros: regs.map((r) => {
            return {
              codpro: r.codpro,
              produto: r.produto,
              produto_complemento: r.produto_complemento,
              subcod: r.subcod,
              subprod: r.subprod,
              un: r.un,
              id_sagi_cag_cat: r.codcat ? parseInt(r.codcat, 10) : null,
              nomeest: r.nomeest,
              comrec: r.comrec,
              codref1: r.codref1,
              codref2: r.codref2,
              codref3: r.codref3,
              codref4: r.codref4,
              codref5: r.codref5,
              ncm: r.ncm,
              peso_pro: r.peso_pro ? parseFloat(r.peso_pro) : null,
              peso_teorico: r.peso_teorico ? parseFloat(r.peso_teorico) : null,
              id_sagi_tipo_pro: r.tp_prod ? parseInt(r.tp_prod, 10) : null,
              md_precom: r.md_precom ? parseFloat(r.md_precom) : null,
              md_preven: r.md_preven ? parseFloat(r.md_preven) : null,
              bonus_prc: r.bonus_prc ? parseFloat(r.bonus_prc) : null,
              lotpad: r.lotpad ? parseFloat(r.lotpad) : null,
              taxa_conv: r.taxa_conv ? parseFloat(r.taxa_conv) : null,
              altura: r.altura ? parseFloat(r.altura) : null,
              comprimento: r.comprimento ? parseFloat(r.comprimento) : null,
              largura: r.largura ? parseFloat(r.largura) : null,
              preco_min1: r.preco_min1 ? parseFloat(r.preco_min1) : null,
              preco_max1: r.preco_max1 ? parseFloat(r.preco_max1) : null,
              preco_min2: r.preco_min2 ? parseFloat(r.preco_min2) : null,
              preco_max2: r.preco_max2 ? parseFloat(r.preco_max2) : null,
              preco_min3: r.preco_min3 ? parseFloat(r.preco_min3) : null,
              preco_max3: r.preco_max3 ? parseFloat(r.preco_max3) : null,
              preco_min4: r.preco_min4 ? parseFloat(r.preco_min4) : null,
              preco_max4: r.preco_max4 ? parseFloat(r.preco_max4) : null,
              peso_acima: r.peso_acima ? parseFloat(r.peso_acima) : null,
              prc_acima: r.prc_acima ? parseFloat(r.prc_acima) : null,
              peso_ac2: r.peso_ac2 ? parseFloat(r.peso_ac2) : null,
              prc_ac2: r.prc_ac2 ? parseFloat(r.prc_ac2) : null,
              peso_baixo: r.peso_baixo ? parseFloat(r.peso_baixo) : null,
              prc_baixo: r.prc_baixo ? parseFloat(r.prc_baixo) : null,
              aprovaped: r.aprovaped,
              usefis: r.usefis,
              codfis: r.codfis,
              subfis: r.subfis,
              ult_data: r.ult_data,
              obs: r.obs,
              diverso: r.diverso,
              rendimento: r.rendimento ? parseFloat(r.rendimento) : null,
              cod_barras: r.cod_barras,
              tipo_barras: r.tipo_barras,
              id_sagi_lista_onu: r.id_onu ? parseInt(r.id_onu, 10) : null,
              status: r.status,
              id_sagi_cag_cdc: r.codcdc ? parseInt(r.codcdc, 10) : null,
              bloq_inventario: r.bloq_inventario,
              mix_venda: r.mix_venda,
              nao_obriga_mtr: r.nao_obriga_mtr,
              ativo_saida_ins: r.ativo_saida_ins,
              cor_producao: r.cor_producao ? parseInt(r.cor_producao, 10) : null,
              usacompetencia: r.usacompetencia,
              editavalorcusto: r.editavalorcusto,
              usoprecocusto: r.usoprecocusto ? parseInt(r.usoprecocusto, 10) : null,
              tabela_servicos_codigo: r.tabela_servicos_codigo,
              nao_movimentar: r.nao_movimentar,
              dias_uso: r.dias_uso ? parseInt(r.dias_uso, 10) : null,
              id_sagi_senha: r.iduser ? parseInt(r.iduser, 10) : null,
              cad_data: r.cad_data,
              pes_avulsa_serv: r.pes_avulsa_serv,
              obriga_os_saida_ins: r.obriga_os_saida_ins,
              tipo_pesquisa: r.tipo_pesquisa,
              id_subcategoria: r.id_subcategoria ? parseInt(r.id_subcategoria, 10) : null,
              epi_com_ca: r.epi_com_ca,
              epi_tamanho: r.epi_tamanho,
              liga: r.liga,
              tipo_liga: r.tipo_liga,
              solicitar_metragem_class: r.solicitar_metragem_class,
              codigo_epi: r.codigo_epi ? parseInt(r.codigo_epi, 10) : null,
              validade_epi: r.validade_epi,
              descricao_alternativa_exp: r.descricao_alternativa_exp,
              fator_conv_ex: r.fator_conv_ex ? parseFloat(r.fator_conv_ex) : null,
              un_trib_ex: r.un_trib_ex,
              cat8309: r.cat8309,
              tecnologia: r.tecnologia,
              usar_mtr: r.usar_mtr,
              id_filial: parseInt(r.id_filial, 10),
              sr_recno: parseInt(r.sr_recno, 10)
            };
          }),
        };

        const response = await api
          .post(`/v3/sagi_cag_pro_v3/`, data, {
            headers: {
              'Authorization': `Basic ${Buffer.from(`${idempresa}:${token}`).toString('base64')}`
            }
          })
          .catch((err) =>
            this.writeLog(
              `(${new Date().toLocaleString()}) - Erro requisição Api Isat Produtos: ${
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
                  codigo: retorno.registro.sr_recno,
                  type: "CAG_PRO",
                  token,
                });
              } else {
                this.writeLog(
                  `(${new Date().toLocaleString()}) - Produto:${
                    retorno.registro.sr_recno
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
        `(${new Date().toLocaleString()}) - Erro inesperado no sincronismo dos produtos: ${
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

module.exports = ProdutosService;
