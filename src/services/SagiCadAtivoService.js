const moment = require("moment");

const Dados = require("../controllers/Dados");
const SagiCadAtivo = require("../controllers/SagiCadAtivo");
const SagiIsatSinc = require("../controllers/SagiIsatSinc");

const api = require("../services/api");

class SagiCadAtivoService {
  constructor(window, db) {
    this.dados = new Dados(db);

    this.sagiCadAtivo = new SagiCadAtivo(db);

    this.sagiIsatSinc = new SagiIsatSinc(db);

    this.window = window;
  }

  async execute({ token, filiais_isat }) {
    try {
      await this.manageSagiCadAtivo(token, filiais_isat);
    } catch (err) {
      this.writeLog(
        `(${new Date().toLocaleString()}) - Erro serviço sagi cad ativo: ${
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
      type: "ativos",
    });
  }

  getIdByFilial(filial, filiais_isat) {
    const item = filiais_isat.find(obj => obj.descricao_default === filial);
    return item ? item.id : null;
  }

  async manageSagiCadAtivo({ token, idempresa }, filiais_isat) {
    try {
      const ativos = await this.sagiCadAtivo.getSagiCadAtivo({ token });

      const ativos_com_filial = ativos
        .map(ativo => {
          const id = this.getIdByFilial(ativo.ativo_filial, filiais_isat);
          if (id !== null) {
            return {
              ...ativo,
              id_filial: id
            };
          }
          return null;
        })
        .filter(Boolean);

      while (ativos_com_filial.length > 0) {
        const regs = ativos_com_filial.splice(0, 10);

        const data = {
          registros: regs.map((r) => {
            return {
              ativo_id: parseInt(r.ativo_id, 10),
              ativo_codigo: r.ativo_codigo,
              ativo_descricao: r.ativo_descricao,
              ativo_tipo: r.ativo_tipo,
              ativo_local: r.ativo_local,
              ativo_nf_emissao: r.ativo_nf_emissao,
              ativo_nf_entrada: r.ativo_nf_entrada,
              ativo_nf_numero: parseInt(r.ativo_nf_numero, 10),
              ativo_nf_serie: r.ativo_nf_serie,
              ativo_nf_modelo: r.ativo_nf_modelo,
              id_referencia_ativo_nf_credor: r.id_referencia_ativo_nf_credor ? parseInt(r.id_referencia_ativo_nf_credor, 10) : null,
              ativo_serial: r.ativo_serial,
              ativo_placa: r.ativo_placa,
              ativo_ufplaca: r.ativo_ufplaca,
              ativo_codid: r.ativo_codid,
              id_tipo_caminhao: r.id_tipo_caminhao ? parseInt(r.id_tipo_caminhao, 10) : null,
              ativo_licenciamento: r.ativo_licenciamento,
              ativo_tara: parseFloat(r.ativo_tara),
              ativo_capacidade: parseFloat(r.ativo_capacidade),
              ativo_mediapadrao: parseFloat(r.ativo_mediapadrao),
              ativo_tipoconsumo: parseInt(r.ativo_tipoconsumo, 10),
              id_referencia_ativo_trans_codigo: r.id_referencia_ativo_trans_codigo ? parseInt(r.id_referencia_ativo_trans_codigo, 10) : null,
              ativo_veicprop: r.ativo_veicprop,
              id_motorista_ativo_mot_codigo: r.id_motorista_ativo_mot_codigo ? parseInt(r.id_motorista_ativo_mot_codigo, 10) : null,
              ativo_status: r.ativo_status,
              ativo_marca: r.ativo_marca,
              ativo_modelo: r.ativo_modelo,
              ativo_ano: parseInt(r.ativo_ano, 10),
              ativo_cor: r.ativo_cor,
              ativo_chassis: r.ativo_chassis,
              ativo_renavan: r.ativo_renavan,
              ativo_referencia: r.ativo_referencia,
              ativo_valativo: parseFloat(r.ativo_valativo),
              ativo_kmrevisao: parseInt(r.ativo_kmrevisao, 10),
              ativo_manureal: r.ativo_manureal,
              ativo_consumo: parseFloat(r.ativo_consumo),
              ativo_cons_media: parseFloat(r.ativo_cons_media),
              ativo_trans_tp_prop: parseInt(r.ativo_trans_tp_prop, 10),
              ativo_trans_etc_tac_ctc: parseInt(r.ativo_trans_etc_tac_ctc, 10),
              ativo_limitecoldia: parseInt(r.ativo_limitecoldia, 10),
              ativo_eixo: parseInt(r.ativo_eixo, 10),
              ativo_tipoimob: parseInt(r.ativo_tipoimob, 10),
              ativo_descimob: r.ativo_descimob,
              ativo_bemprinc: r.ativo_bemprinc,
              ativo_parcimob: parseInt(r.ativo_parcimob, 10),
              ativo_dtinidep: r.ativo_dtinidep,
              ativo_categdep: r.ativo_categdep,
              ativo_mesesdep: parseInt(r.ativo_mesesdep, 10),
              pode_transp_res_classei: r.pode_transp_res_classei,
              pode_transp_res_classeiia: r.pode_transp_res_classeiia,
              pode_transp_res_classeiib: r.pode_transp_res_classeiib,
              web: r.web,
              status_cnh: parseInt(r.status_cnh, 10),
              status_crv: parseInt(r.status_crv, 10),
              data_status_cnh: r.data_status_cnh,
              data_status_crv: r.data_status_crv,
              ativo_rastreador: r.ativo_rastreador,
              ativo_gps_ignicao: r.ativo_gps_ignicao,
              ativo_gps_velocidade: parseInt(r.ativo_gps_velocidade, 10),
              ativo_gps_latitude: r.ativo_gps_latitude,
              ativo_gps_longitude: r.ativo_gps_longitude,
              ativo_gps_endereco: r.ativo_gps_endereco,
              ativo_gps_ult_data: r.ativo_gps_ult_data,
              ativo_gps_ult_hora: r.ativo_gps_ult_hora,
              id_sagi_senha_ativo_usuario: r.id_sagi_senha_ativo_usuario ? parseInt(r.id_sagi_senha_ativo_usuario, 10) : null,
              ativo_data: r.ativo_data,
              ativo_hora: r.ativo_hora,
              id_sagi_senha_cad_usuario: r.id_sagi_senha_cad_usuario ? parseInt(r.id_sagi_senha_cad_usuario, 10) : null,
              cad_data: r.cad_data,
              ativo_cod_pais: parseInt(r.ativo_cod_pais, 10),
              tipo_forno: r.tipo_forno ? parseInt(r.tipo_forno, 10) : null,
              ativo_custo_quilometragem: r.ativo_custo_quilometragem ? parseFloat(r.ativo_custo_quilometragem) : null,
              id_sagi_cag_cdc: r.id_sagi_cag_cdc ? parseInt(r.id_sagi_cag_cdc, 10) : null,
              id_referencia_ativo_proprietario: r.id_referencia_ativo_proprietario ? parseInt(r.id_referencia_ativo_proprietario, 10) : null,
              ativo_obs_compra: r.ativo_obs_compra,
              id_tipo_cacamba_ativo_id_cacamba: r.id_tipo_cacamba_ativo_id_cacamba ? parseInt(r.id_tipo_cacamba_ativo_id_cacamba, 10) : null,
              ativo_do_codfor: r.ativo_do_codfor ? parseInt(r.ativo_do_codfor, 10) : null,
              ctasmart_codfor: r.ctasmart_codfor ? parseInt(r.ctasmart_codfor, 10) : null,
              id_filial: parseInt(r.id_filial, 10),
            };
          }),
        };

        const response = await api
          .post(`/v3/sagi_cad_ativo_v3/`, data, {
            headers: {
              'Authorization': `Basic ${Buffer.from(`${idempresa}:${token}`).toString('base64')}`
            }
          })
          .catch((err) =>
            this.writeLog(
              `(${new Date().toLocaleString()}) - Erro requisição Api Isat Sagi Cad Ativo: ${
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
                  codigo: retorno.registro.ativo_id,
                  type: "SAGI_CAD_ATIVO",
                  token,
                });
              } else {
                this.writeLog(
                  `(${new Date().toLocaleString()}) - Sagi Cad Ativo:${
                    retorno.registro.ativo_id
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
        `(${new Date().toLocaleString()}) - Erro inesperado no sincronismo do sagi cad ativo: ${
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

module.exports = SagiCadAtivoService;
