const moment = require("moment");

const Dados = require("../controllers/Dados");
const ContratosServ3 = require("../controllers/ContratosServ3");
const SagiIsatSinc = require("../controllers/SagiIsatSinc");

const api = require("../services/api");

class ContratosServ3Service {
  constructor(window, db) {
    this.dados = new Dados(db);

    this.contratos_serv3 = new ContratosServ3(db);

    this.sagiIsatSinc = new SagiIsatSinc(db);

    this.window = window;
  }

  async execute({ token, filiais_isat }) {
    try {
      await this.manageContratosServ3(token, filiais_isat);
    } catch (err) {
      this.writeLog(
        `(${new Date().toLocaleString()}) - Erro serviço contratos de servico: ${
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
      type: "contratos_de_servico",
    });
  }

  getIdByFilial(filial, filiais_isat) {
    const item = filiais_isat.find(obj => obj.descricao_default === filial);
    return item ? item.id : null;
  }

  async manageContratosServ3({ token, idempresa }, filiais_isat) {
    try {
      const contratos = await this.contratos_serv3.getContratos({ token });

      while (contratos.length > 0) {
        const regs = contratos.splice(0, 1);

        const filiaisValidas = regs[0].filiais.length > 0
          ? regs[0].filiais
              .map(f => ({
                filial: f.filial,
                id_filial: this.getIdByFilial(f.filial, filiais_isat)
              }))
              .filter(f => f.id_filial !== null)
          : (() => {
              const filial_todas = this.getIdByFilial('TODAS', filiais_isat);
              return filial_todas ? [{ filial: 'TODAS', id_filial: filial_todas }] : [];
            })();

        if(filiaisValidas.length === 0) continue;

        const produtosValidos = regs[0].itens.map(i => ({
          item_id: parseInt(i.item_id, 10),
          id_sagi_cag_pro: i.id_codpro ? parseInt(i.id_codpro, 10) : null,
          descricao_servico_nf: i.descricao_servico_nf,
          id_sagi_cag_cdc_serv_codcdc_var: i.serv_codcdc_var.map(sc => parseInt(sc, 10)),
          id_sagi_centro_serv_centro_var: i.serv_centro_var.map(sc => parseInt(sc, 10)),
          serv_gestaoresiduo: i.serv_gestaoresiduo,
          serv_armazenagem: i.serv_armazenagem,
          serv_consultoria: i.serv_consultoria,
          serv_locacao: i.serv_locacao,
          gestaoresiduo_forma_cobr: i.gestaoresiduo_forma_cobr ? parseInt(i.gestaoresiduo_forma_cobr, 10) : null,
          gestaoresiduo_metodo_med: i.gestaoresiduo_metodo_med,
          gestaoresiduo_valorunit: i.gestaoresiduo_valorunit ? parseFloat(i.gestaoresiduo_valorunit) : null,
          gestaoresiduo_valorsem: i.gestaoresiduo_valorfsem ? parseFloat(i.gestaoresiduo_valorfsem) : null,
          gestaoresiduo_prest_aut: i.gestaoresiduo_prest_aut,
          gestaoresiduo_min_tempo: i.gestaoresiduo_min_tempo ? parseInt(i.gestaoresiduo_min_tempo, 10) : null,
          gestaoresiduo_vlr_minuto: i.gestaoresiduo_vlr_minuto ? parseFloat(i.gestaoresiduo_vlr_minuto) : null,
          gestaoresiduo_vlr_cobaut: i.gestaoresiduo_vlr_cobaut ? parseFloat(i.gestaoresiduo_vlr_cobaut) : null,
          gestaoresiduo_como_cobra: i.gestaoresiduo_como_cobra,
          gestaoresiduo_transp_proprio: i.gestaoresiduo_transp_proprio,
          id_sagi_cag_cre_gestaoresiduo_cod_transp: i.gestaoresiduo_cod_transp ? parseInt(i.gestaoresiduo_cod_transp, 10) : null,
          gestaoresiduo_placa_transp: i.gestaoresiduo_placa_transp,
          gestaoresiduo_gerapagar_transp: i.gestaoresiduo_gerapagar_transp,
          gestaoresiduo_valortransp: i.gestaoresiduo_valortransp ? parseFloat(i.gestaoresiduo_valortransp) : null,
          id_sagi_orgao_ambiental_gestaoresiduo_orgao_id: i.gestaoresiduo_orgao_id ? parseInt(i.gestaoresiduo_orgao_id, 10) : null,
          gestaoresiduo_cons_peso_servun: i.gestaoresiduo_cons_peso_servun,
          armaz_forma_cobr: i.armaz_forma_cobr ? parseInt(i.armaz_forma_cobr, 10) : null,
          armaz_metodo_med: i.armaz_metodo_med,
          armaz_valor: i.armaz_valor ? parseFloat(i.armaz_valor) : null,
          armaz_qtd_dias: i.armaz_qtd_dias ? parseInt(i.armaz_qtd_dias, 10) : null,
          armaz_altura: i.armaz_altura,
          armaz_largura: i.armaz_largura,
          armaz_prateleira: i.armaz_prateleira,
          armaz_corredor: i.armaz_corredor,
          armaz_nf_numero: i.armaz_nf_numero ? parseInt(i.armaz_nf_numero, 10) : null,
          armaz_nf_serie: i.armaz_nf_serie ? parseInt(i.armaz_nf_serie, 10) : null,
          armaz_nf_modelo: i.armaz_nf_modelo,
          armaz_nf_nome: i.armaz_nf_nome,
          cons_forma_cobr: i.cons_forma_cobr ? parseInt(i.cons_forma_cobr, 10) : null,
          id_sagi_cag_fun_cons_cod_fun: i.cons_cod_fun ? parseInt(i.cons_cod_fun, 10) : null,
          cons_valorunit: i.cons_valorunit ? parseFloat(i.cons_valorunit) : null,
          cons_valorsem: i.cons_valorfsem ? parseFloat(i.cons_valorfsem) : null,
          cons_prest_aut: i.cons_prest_aut,
          cons_metodo_med: i.cons_metodo_med,
          loc_forma_cobr: i.loc_forma_cobr ? parseInt(i.loc_forma_cobr, 10) : null,
          loc_metodo_med: i.loc_metodo_med,
          loc_como_cobra: i.loc_como_cobra,
          loc_prest_aut: i.loc_prest_aut,
          id_sagi_senha_loc_usu_aviso_devemp: i.loc_usu_aviso_devemp ? parseInt(i.loc_usu_aviso_devemp, 10) : null,
          id_sagi_setor_loc_setor_aviso_devemp: i.loc_setor_aviso_devemp ? parseInt(i.loc_setor_aviso_devemp, 10) : null,
          loc_tipativo: i.loc_tipoativo,
          loc_valorlocacao: i.loc_valorlocacao ? parseFloat(i.loc_valorlocacao) : null,
          freq_tipo: i.freq_tipo ? parseInt(i.freq_tipo, 10) : null,
          freq_per: i.freq_per ? parseInt(i.freq_per, 10) : null,
          turno: i.turno,
          freq_dtini: i.freq_dtini,
          so_dias_uteis: i.so_dias_uteis,
          pula_feriado: i.pula_feriado,
          segunda: i.segunda,
          terca: i.terca,
          quarta: i.quarta,
          quinta: i.quinta,
          sexta: i.sexta,
          sabado: i.sabado,
          domingo: i.domingo,
          mes_01_col: i.mes_01_col,
          mes_02_col: i.mes_02_col,
          mes_03_col: i.mes_03_col,
          mes_04_col: i.mes_04_col,
          mes_05_col: i.mes_05_col,
          mes_06_col: i.mes_06_col,
          sol_aprov_cli: i.sol_aprov_cli,
          item_id_entrega: i.item_id_entrega ? parseInt(i.item_id_entrega, 10) : null,
          residuos: i.residuos.map(r => ({
            id_sagi_cag_pr2: parseInt(r.sr_recno_cag_pr2, 10)
          })),
          ativos: i.ativos.map(r => ({
            ativo_id: parseInt(r.ativo_id, 10),
            valor_locacao: parseFloat(r.valor_locacao),
          }))
        })).filter(f => f.id_sagi_cag_pro !== null);

        if(produtosValidos.length === 0) continue;

        const data = {
          registros: regs.map((r) => {
            return {
              contrato_id: parseInt(r.contrato_id, 10),
              contrato_data: r.contrato_data,
              id_referencia_contrato_cliente: r.contrato_cliente ? parseInt(r.contrato_cliente, 10) : null,
              id_referencia_codcli_fatura: r.codcli_fatura ? parseInt(r.codcli_fatura, 10) : null,
              contrato_status: r.contrato_status,
              contrato_inicio: r.contrato_inicio,
              contrato_fim: r.contrato_fim,
              contrato_vencto: r.contrato_vencto,
              contrato_fecha: parseInt(r.contrato_fecha, 10),
              contrato_descricao: r.contrato_descricao,
              contrato_detalhe: r.contrato_detalhe,
              proposta_detalhe: r.proposta_detalhe,
              cobranca_detalhe: r.cobranca_detalhe,
              contrato_obs: r.contrato_obs,
              contrato_total: parseFloat(r.contrato_total),
              contrato_assinado: r.contrato_assinado,
              contrato_visto: r.contrato_visto,
              id_sagi_senha_contrato_user_visto: r.iduser_visto ? parseInt(r.iduser_visto, 10) : null,
              id_sagi_prazo_contrato_forma_pg: r.contrato_forma_pg ? parseInt(r.contrato_forma_pg, 10) : null,
              id_sagi_cag_vnd_contrato_codvnd: r.contrato_codvnd ? parseInt(r.contrato_codvnd, 10) : null,
              laudo_fotografico: r.laudo_fotografico,
              tipo_contrato: r.tipo_contrato,
              id_sagi_regiao_regiao_id: r.regiao_id ? parseInt(r.regiao_id, 10) : null,
              mot_recusa_proposta: r.mot_recusa_proposta,
              enviar_auto_cert: r.enviar_auto_cert,
              enviar_auto_email_med: r.enviar_auto_email_med,
              gerar_cobbanc_auto_med: r.gerar_cobbanc_auto_med,
              aprova_auto_med: r.aprova_auto_med,
              app_obriga_foto_antes_col: r.app_obriga_foto_antes_col,
              app_obriga_foto_depois_col: r.app_obriga_foto_depois_col,
              app_obriga_ass_depois_col: r.app_obriga_ass_depois_col,
              receber_email_incluir_rota: r.receber_email_incluir_rota,
              receber_whats_incluir_rota: r.receber_whats_incluir_rota,
              notifica_venc_proposta: r.notifica_venc_proposta,
              mtr_gerada_emp_contratante: r.mtr_gerada_emp_contratante,
              mtr_quemgera: r.mtr_quemgera,
              mtr_momentogera: r.mtr_momentogera,
              mtr_cli_orgao: r.mtr_cli_orgao,
              mtr_cli_nome: r.mtr_cli_nome,
              mtr_cli_cpf: r.mtr_cli_cpf,
              mtr_cli_unidade: r.mtr_cli_unidade,
              mtr_cli_senha: r.mtr_cli_senha,
              mtr_cli_nome_receb: r.mtr_cli_nome_receb,
              mtr_cli_just_receb: r.mtr_cli_just_receb,
              data: r.data,
              hora: r.hora,
              id_sagi_senha_usuario: r.iduser_cad ? parseInt(r.iduser_cad, 10) : null,
              id_sagi_senha_usuario_alt: r.iduser_alt ? parseInt(r.iduser_alt, 10) : null,
              id_sagi_forma_pagto_contrato_condicao: r.contrato_condicao ? parseInt(r.contrato_condicao, 10) : null,
              contrato_codpro_fat: r.contrato_codpro_fat,
              contrato_subcod_fat: r.contrato_subcod_fat,
              d4_proposta_enviado: r.d4_proposta_enviado,
              d4_proposta_assinado: r.d4_proposta_assinado,
              d4_contrato_enviado: r.d4_contrato_enviado,
              d4_contrato_assinado: r.d4_contrato_assinado,
              d4_uuid_proposta: r.d4_uuid_proposta,
              d4_uuid_contrato: r.d4_uuid_contrato,
              d4_id_status_proposta: parseInt(r.d4_id_status_proposta, 10),
              d4_id_status_contrato: parseInt(r.d4_id_status_contrato, 10),
              d4_status_proposta: r.d4_status_proposta,
              d4_status_contrato: r.d4_status_contrato,
              filiais: filiaisValidas,
              itens: produtosValidos
            };
          })
        };

        const response = await api
          .post(`/v3/sagi_contrato_serv3_v3/`, data, {
            headers: {
              'Authorization': `Basic ${Buffer.from(`${idempresa}:${token}`).toString('base64')}`
            }
          })
          .catch((err) =>
            this.writeLog(
              `(${new Date().toLocaleString()}) - Erro requisição Api Isat Contratos Serv3: ${
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
                  codigo: retorno.registro.contrato_id,
                  type: "SAGI_CONTRATO_SERV3",
                  token,
                });
              } else {
                this.writeLog(
                  `(${new Date().toLocaleString()}) - Contrato Serv3:${
                    retorno.registro.contrato_id
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
      console.log(err);
      this.writeLog(
        `(${new Date().toLocaleString()}) - Erro inesperado no sincronismo dos contratos de servico: ${
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

module.exports = ContratosServ3Service;
