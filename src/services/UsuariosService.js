const moment = require("moment");

const Dados = require("../controllers/Dados");
const Usuarios = require("../controllers/Usuarios");
const SagiIsatSinc = require("../controllers/SagiIsatSinc");

const api = require("../services/api");

class UsuariosService {
  constructor(window, db) {
    this.dados = new Dados(db);

    this.usuarios = new Usuarios(db);

    this.sagiIsatSinc = new SagiIsatSinc(db);

    this.window = window;
  }

  async execute({ token, filiais_isat }) {
    try {
      await this.manageUsuarios(token, filiais_isat);
    } catch (err) {
      this.writeLog(
        `(${new Date().toLocaleString()}) - Erro serviço usuarios: ${
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
      type: "usuarios",
    });
  }

  getIdByFilial(filial, filiais_isat) {
    const filiais = filial.split('|');

    const ids = filiais.map(filial => {
      const item = filiais_isat.find(obj => obj.descricao_default === filial);
      return item ? item.id : null;
    }).filter(Boolean);

    return ids.join(',');
  }

  async manageUsuarios({ token, idempresa }, filiais_isat) {
    try {
      const usuarios = await this.usuarios.getUsuarios({ token });

      const usuarios_com_filial = usuarios
        .map(usuario => {
          const id = this.getIdByFilial(usuario.filial, filiais_isat);
          if (id !== '') {
            return {
              ...usuario,
              id_filial: id
            };
          }
          return null;
        })
        .filter(Boolean);

      while (usuarios_com_filial.length > 0) {
        const regs = usuarios_com_filial.splice(0, 10);

        const data = {
          registros: regs.map((r) => {
            return {
              iduser: parseInt(r.iduser, 10),
              usuario: r.usuario,
              id_sagi_setor: r.codset ? parseInt(r.codset, 10) : null,
              id_sagi_cag_fun: r.codfunc ? parseInt(r.codfunc, 10) : null,
              nomefun: r.nomefun,
              tipo: r.tipo,
              bloqueia: r.bloqueia,
              altera: r.altera,
              desc_com: parseFloat(r.desc_com),
              desc_ven: parseFloat(r.desc_ven),
              acre_com: parseFloat(r.acre_com),
              acre_ven: parseFloat(r.acre_ven),
              id_sagi_cag_vnd: r.codven ? parseInt(r.codven, 10) : null,
              id_sagi_cag_ide: r.codcom ? parseInt(r.codcom, 10) : null,
              id_sagi_classifica: r.codcla ? parseInt(r.codcla, 10) : null,
              id_sagi_categor: r.codcatfor ? parseInt(r.codcatfor, 10) : null,
              exp_arq: r.exp_arq,
              impresso: r.impressao,
              email: r.email,
              naoaviso: r.naoaviso,
              notas: r.notas,
              chave: r.chave,
              bloq_portal_cli: r.bloq_portal_cli,
              end_email: r.end_email,
              server: r.server,
              porta_smtp: parseInt(r.porta_smtp, 10),
              email_usuario: r.email_usuario,
              email_senha: r.email_senha,
              email_cc: r.email_cc,
              email_bcc: r.email_bcc,
              ssl_email: r.ssl_email,
              email_conf: r.email_conf,
              bloq_alt_hor_mtr: r.bloq_alt_hor_mtr,
              tls_email: r.tls_email,
              dicas: r.dicas,
              nome_arq: r.nome_arq,
              arquivo: r.arquivo,
              assinatura: r.assinatura,
              assinatura_med: r.assinatura_med,
              user_develop: r.user_develop,
              centrocusto: r.centrocusto,
              centrocustusins: r.centrocustoins,
              cad_usuario: r.cad_usuario,
              cad_data: r.cad_data,
              ordemserv_veiculo: r.ordserv_veiculo,
              ordemserv_cacamba: r.ordserv_cacamba,
              ordemserv_maquina: r.ordserv_maquina,
              ordemserv_prensa: r.ordserv_prensa,
              ordemserv_equip: r.ordserv_equip,
              user_gerentecrm: r.user_gerentecrm,
              user_naoexibevalunifinc: r.user_naoexibevalunifunc,
              nao_obrigar_banco_previsto: r.nao_obrigar_banco_previsto,
              lim_descvendainheiro: parseFloat(r.lim_descvendadinheiro),
              lim_desccomprodinheiro: parseFloat(r.lim_desccompradinheiro),
              imp_boleto: parseInt(r.imp_boleto, 10),
              imp_recibo: parseInt(r.imp_recibo, 10),
              nao_mostra_pendencias_user: r.nao_mostra_pendencias_user,
              pode_dar_desconto_bol: r.pode_dar_desconto_bol,
              logoff_auto: r.logoff_auto,
              end_email_relatorio: r.end_email_relatorio,
              webrel_tema: r.webrel_tema,
              acesso_fin3_pagamentos: r.acesso_fin3_pagamentos,
              acesso_fin3_recebimentos: r.acesso_fin3_recebimentos,
              nao_coletavol: r.nao_colnormal,
              nao_coletaresiduo: r.nao_colservico,
              nao_coletarequipamento: r.nao_colembarque,
              podeverfinanceiro2: r.podeverfinanceiro2,
              id_filial: r.id_filial,
            };
          }),
        };

        const response = await api
          .post(`/v3/sagi_senha_v3/`, data, {
            headers: {
              'Authorization': `Basic ${Buffer.from(`${idempresa}:${token}`).toString('base64')}`
            }
          })
          .catch((err) =>
            this.writeLog(
              `(${new Date().toLocaleString()}) - Erro requisição Api Isat Usuarios: ${
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
                  codigo: retorno.registro.iduser,
                  type: "SENHA",
                  token,
                });
              } else {
                this.writeLog(
                  `(${new Date().toLocaleString()}) - Usuario:${
                    retorno.registro.iduser
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
        `(${new Date().toLocaleString()}) - Erro inesperado no sincronismo dos usuarios: ${
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

module.exports = UsuariosService;
