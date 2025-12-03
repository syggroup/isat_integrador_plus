class ProdutosModel {
  constructor(db) {
    this.db = db;
  }

  /*
    CREATE TABLE IF NOT EXISTS sagi_cag_pro (
      id BIGSERIAL,
      sr_recno INTEGER NOT NULL,
      codpro CHARACTER VARYING(6) NOT NULL,
      produto CHARACTER VARYING(120) NOT NULL,
      produto_complemento CHARACTER VARYING(500) NOT NULL,
      subcod CHARACTER VARYING(1) NOT NULL,
      subprod CHARACTER VARYING(6) NOT NULL,
      un CHARACTER VARYING(3) NOT NULL,
      nomeest CHARACTER VARYING(255) NOT NULL,
      comrec CHARACTER VARYING(1) NOT NULL,
      codref1 CHARACTER VARYING(25) NOT NULL,
      codref2 CHARACTER VARYING(25) NOT NULL,
      codref3 CHARACTER VARYING(25) NOT NULL,
      codref4 CHARACTER VARYING(25) NOT NULL,
      codref5 CHARACTER VARYING(25) NOT NULL,
      peso_pro NUMERIC(18,3) NOT NULL,
      peso_teorico NUMERIC(19,8) NOT NULL,
      md_precom NUMERIC(19,9) NOT NULL,
      md_preven NUMERIC(19,9) NOT NULL,
      bonus_prc NUMERIC(15,5) NOT NULL,
      lotpad NUMERIC(18,3) NOT NULL,
      taxa_conv NUMERIC(6,2) NOT NULL,
      altura NUMERIC(18,3) NOT NULL,
      comprimento NUMERIC(18,3) NOT NULL,
      largura NUMERIC(18,3) NOT NULL,
      preco_min1 NUMERIC(15,5) NOT NULL,
      preco_max1 NUMERIC(15,5) NOT NULL,
      preco_min2 NUMERIC(15,5) NOT NULL,
      preco_max2 NUMERIC(15,5) NOT NULL,
      preco_min3 NUMERIC(15,5) NOT NULL,
      preco_max3 NUMERIC(15,5) NOT NULL,
      preco_min4 NUMERIC(15,5) NOT NULL,
      preco_max4 NUMERIC(15,5) NOT NULL,
      peso_acima NUMERIC(18,3) NOT NULL,
      prc_acima NUMERIC(15,5) NOT NULL,
      peso_ac2 NUMERIC(18,3) NOT NULL,
      prc_ac2 NUMERIC(15,5) NOT NULL,
      peso_baixo NUMERIC(18,3) NOT NULL,
      prc_baixo NUMERIC(15,5) NOT NULL,
      aprovaped BOOLEAN NOT NULL,
      usefis BOOLEAN NOT NULL,
      codfis CHARACTER VARYING(6) NOT NULL,
      subfis CHARACTER VARYING(1) NOT NULL,
      ult_data DATE NOT NULL,
      obs TEXT NOT NULL,
      diverso BOOLEAN NOT NULL,
      rendimento NUMERIC(5,2) NOT NULL,
      cod_barras CHARACTER VARYING(255) NOT NULL,
      tipo_barras CHARACTER VARYING(30) NOT NULL,
      status CHARACTER VARYING(7) NOT NULL,
      bloq_inventario BOOLEAN NOT NULL,
      mix_venda CHARACTER VARYING(10) NOT NULL,
      nao_obriga_mtr BOOLEAN NOT NULL,
      ativo_saida_ins BOOLEAN NOT NULL,
      cor_producao NUMERIC(10,0) NOT NULL,
      usacompetencia BOOLEAN NOT NULL,
      editavalorcusto BOOLEAN NOT NULL,
      usoprecocusto NUMERIC(10,0),
      tabela_servicos_codigo CHARACTER VARYING(10) NOT NULL,
      nao_movimentar BOOLEAN NOT NULL,
      dias_uso NUMERIC(10,0),
      cad_data DATE,
      pes_avulsa_serv BOOLEAN NOT NULL,
      obriga_os_saida_ins BOOLEAN NOT NULL,
      tipo_pesquisa CHARACTER VARYING(10),
      id_subcategoria NUMERIC(10,0) NOT NULL,
      epi_com_ca BOOLEAN NOT NULL,
      epi_tamanho CHARACTER VARYING(10),
      liga BOOLEAN NOT NULL,
      tipo_liga CHARACTER VARYING(4),
      solicitar_metragem_class BOOLEAN NOT NULL,
      codigo_epi NUMERIC(30,0) NOT NULL,
      validade_epi DATE,
      descricao_alternativa_exp CHARACTER VARYING(120) NOT NULL,
      fator_conv_ex NUMERIC(19,5) NOT NULL,
      un_trib_ex CHARACTER VARYING(3) NOT NULL,
      cat8309 BOOLEAN NOT NULL,
      tecnologia CHARACTER VARYING(120) NOT NULL,
      usar_mtr BOOLEAN NOT NULL,
      id_cliente INTEGER NOT NULL,
      id_filial INTEGER NOT NULL,
      id_sagi_senha INTEGER,
      id_sagi_cag_cat INTEGER,
      id_sagi_ncm INTEGER,
      id_sagi_tipo_pro INTEGER,
      id_sagi_lista_onu INTEGER,
      id_sagi_cag_cdc INTEGER,
      CONSTRAINT pkey_sagi_cag_pro PRIMARY KEY (id),
      CONSTRAINT uq_sagi_cag_pro_cliente UNIQUE (sr_recno, id_cliente),
      CONSTRAINT fk_sagi_cag_pro_cliente FOREIGN KEY (id_cliente)
        REFERENCES cliente (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
      CONSTRAINT fk_sagi_cag_pro_filiais FOREIGN KEY (id_filial)
        REFERENCES filiais (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
      CONSTRAINT fk_sagi_cag_pro_sagi_cag_cat FOREIGN KEY (id_sagi_cag_cat)
        REFERENCES sagi_cag_cat (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
      CONSTRAINT fk_sagi_cag_pro_sagi_ncm FOREIGN KEY (id_sagi_ncm)
        REFERENCES sagi_ncm (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
      CONSTRAINT fk_sagi_cag_pro_sagi_tipo_pro FOREIGN KEY (id_sagi_tipo_pro)
        REFERENCES sagi_tipo_pro (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
      CONSTRAINT fk_sagi_cag_pro_sagi_lista_onu FOREIGN KEY (id_sagi_lista_onu)
        REFERENCES sagi_lista_onu (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
      CONSTRAINT fk_sagi_cag_pro_sagi_cag_cdc FOREIGN KEY (id_sagi_cag_cdc)
        REFERENCES sagi_cag_cdc (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
    )
  */

  async getAll({ token }) {
    await this.db.query("SET client_encoding TO 'SQL_ASCII'");
    const result = await this.db.query(`
      SELECT trim(a.codpro) as codpro,
        tiraacento(trim(a.produto)) as produto,
        tiraacento(trim(a.produto_complemento)) as produto_complemento,
        trim(a.subcod) as subcod,
        trim(a.subprod) as subprod,
        trim(a.un) as un,
        case when a.codcat = 0 then null else a.codcat end as codcat,
        tiraacento(trim(a.nomeest)) as nomeest,
        trim(a.comrec) as comrec,
        trim(a.codref1) as codref1,
        trim(a.codref2) as codref2,
        trim(a.codref3) as codref3,
        trim(a.codref4) as codref4,
        trim(a.codref5) as codref5,
        trim(a.ncm) as ncm,
        case when trim(a.empresa) <> '' then trim(a.empresa) else 'TODAS' end as filial,
        a.peso_pro,
        a.peso_teorico,
        (select s.id from sagi_tipo_pro s where trim(a.tp_prod) = trim(s.codigo) limit 1) as tp_prod,
        a.md_precom,
        a.md_preven,
        a.bonus_prc,
        a.lotpad,
        a.taxa_conv,
        a.altura,
        a.comprimento,
        a.largura,
        a.preco_min1,
        a.preco_max1,
        a.preco_min2,
        a.preco_max2,
        a.preco_min3,
        a.preco_max3,
        a.preco_min4,
        a.preco_max4,
        a.peso_acima,
        a.prc_acima,
        a.peso_ac2,
        a.prc_ac2,
        a.peso_baixo,
        a.prc_baixo,
        coalesce(a.aprovaped, false) as aprovaped,
        coalesce(a.usefis, false) as usefis,
        trim(a.codfis) as codfis,
        trim(a.subfis) as subfis,
        a.ult_data,
        tiraacento(trim(a.obs)) as obs,
        coalesce(a.diverso, false) as diverso,
        a.rendimento,
        trim(a.cod_barras) as cod_barras,
        trim(a.tipo_barras) as tipo_barras,
        case when a.id_onu = 0 then null else a.id_onu end as id_onu,
        trim(a.status) as status,
        (select s.cag_cdc_id from cag_cdc s where trim(a.codcdc) = trim(s.codcdc) limit 1) as codcdc,
        coalesce(a.bloq_inventario, false) as bloq_inventario,
        trim(a.mix_venda) as mix_venda,
        coalesce(a.nao_obriga_mtr, false) as nao_obriga_mtr,
        coalesce(a.ativo_saida_ins, false) as ativo_saida_ins,
        a.cor_producao,
        coalesce(a.usacompetencia, false) as usacompetencia,
        coalesce(a.editavalorcusto, false) as editavalorcusto,
        a.usoprecocusto,
        trim(a.tabela_servicos_codigo) as tabela_servicos_codigo,
        coalesce(a.nao_movimentar, false) as nao_movimentar,
        a.dias_uso,
        (select s.iduser from senha s where trim(a.cad_usuario) = trim(s.usuario) limit 1) as iduser,
        a.cad_data,
        coalesce(a.pes_avulsa_serv, false) as pes_avulsa_serv,
        coalesce(a.obriga_os_saida_ins, false) as obriga_os_saida_ins,
        trim(a.tipo_pesquisa) as tipo_pesquisa,
        a.id_subcategoria,
        coalesce(a.epi_com_ca, false) as epi_com_ca,
        trim(a.epi_tamanho) as epi_tamanho,
        coalesce(a.liga, false) as liga,
        trim(a.tipo_liga) as tipo_liga,
        coalesce(a.solicitar_metragem_class, false) as solicitar_metragem_class,
        a.codigo_epi,
        a.validade_epi,
        tiraacento(trim(a.descricao_alternativa_exp)) as descricao_alternativa_exp,
        a.fator_conv_ex,
        trim(a.un_trib_ex) as un_trib_ex,
        coalesce(a.cat8309, false) as cat8309,
        tiraacento(trim(a.tecnologia)) as tecnologia,
        coalesce(a.usar_mtr, false) as usar_mtr,
        a.sr_recno
      FROM cag_pro a
      WHERE a.sr_recno not in (select b.codigo from sagi_isat_sinc b where b.tipo='CAG_PRO' and b.token = '${token}')
      ORDER BY a.sr_recno
    `);
    return result[1].rows;
  }
}

module.exports = ProdutosModel;
