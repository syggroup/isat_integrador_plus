class OrdensModel {
  constructor(db) {
    this.db = db;
  }

  async getTickets(_tokens) {
    await this.db.query("SET client_encoding TO 'SQL_ASCII'");

    const filiais = _tokens.map(t => t.filial);

    const result = await this.db.query(`
      SELECT a.sr_recno,
        trim(a.tipo) as acao,
        a.numbol,
        trim(a.empresa) as filial
      FROM isat_monitora a
      ORDER BY a.numbol DESC LIMIT 500
    `);

    const excludes_im = result[1].rows.filter(r => !filiais.includes(r.filial)).map(r => r.sr_recno);

    if (excludes_im.length > 0) {
      await this.db.query(`DELETE FROM isat_monitora as a WHERE sr_recno in (${excludes_im.join(",")})`);

      while(excludes_im.length > 0) {
        excludes_im.pop();
      }
    }

    const tickets_to_check = result[1].rows.filter(r => filiais.includes(r.filial));

    const tickets = [];
    for (const ticket of tickets_to_check) {
      const token = _tokens.filter(t => t.filial === ticket.filial)[0].token;

      if (ticket.acao === 'ENTRADA' || ticket.acao === 'SAIDA') {
        const produtos = await this.db.query(`
          SELECT a.data,
            a.boleto,
            a.codigo,
            a.placa,
            a.num_coleta,
            a.codpro,
            a.subcod,
            a.produto,
            a.unidade,
            a.peso_liquido,
            a.desconto,
            a.preco,
            a.valor_total,
            c.num_col
          FROM syg_movimento_pesos('${ticket.acao}',null,null,'${ticket.filial}',null,null,null,null,null,${ticket.numbol},null,null) a
          INNER JOIN sagi_cad_ativo b ON b.ativo_placa = a.placa
          INNER JOIN ordem c ON c.ordem = a.num_coleta and c.cli_for = '${ticket.acao === 'ENTRADA' ? 'COLETA' : 'EMBARQUE'}'
          WHERE trim(a.placa) <> ''
            AND a.num_coleta > 0
            AND b.ativo_rastreador = 'ISAT'
            AND (SELECT count(*) FROM sagi_isat_sinc d WHERE d.codigo = a.codigo AND d.tipo = '${ticket.acao === 'ENTRADA' ? 'FORNECEDOR' : 'CLIENTE'}' AND d.token = '${token}') > 0
          ORDER BY a.boleto, a.data
        `);

        if (produtos[1].rows.length > 0) {
          tickets.push({ ... ticket, token, produtos: produtos[1].rows });
        } else {
          excludes_im.push(ticket.sr_recno);
        }
      } else {
        tickets.push({ ... ticket, token, produtos: [] });
      }
    }

    if (excludes_im.length > 0) {
      await this.db.query(`DELETE FROM isat_monitora as a WHERE sr_recno in (${excludes_im.join(",")})`);
    }

    return tickets;
  }

  async deleteAllDeleteAfterInsert() {
    await this.db.query("SET client_encoding TO 'SQL_ASCII'");

    return await Promise.all([
      await this.db.query(`
        DELETE FROM isat_monitora
        WHERE sr_recno IN (
          SELECT sr_recno
          FROM isat_monitora
          WHERE numbol IN (
            SELECT numbol FROM isat_monitora WHERE tipo = 'DELETE_C'
          ) AND tipo = 'ENTRADA'
        )
      `),
      await this.db.query(`
        DELETE FROM isat_monitora
        WHERE sr_recno IN (
          SELECT sr_recno
          FROM isat_monitora
          WHERE numbol IN (
            SELECT numbol FROM isat_monitora WHERE tipo = 'DELETE_V'
          ) AND tipo = 'SAIDA'
        )
      `)
      /*await this.db.query(`
        DELETE FROM isat_monitora WHERE numbol IN (
          SELECT z.numbol
          FROM isat_monitora as z
          WHERE z.tipo = 'ENTRADA'
            and (SELECT count(*) FROM cag_pap b WHERE b.numbol = z.numbol) = 0
        ) AND tipo = 'ENTRADA'
      `),
      await this.db.query(`
        DELETE FROM isat_monitora WHERE numbol IN (
          SELECT z.numbol
          FROM isat_monitora as z
          WHERE z.tipo = 'SAIDA'
            AND (SELECT count(*) FROM cag_rec b WHERE b.numbol = z.numbol) = 0
        ) AND tipo = 'SAIDA'
      `) */
    ]);
  }

  async deleteBySrRecno(sr_recno) {
    await this.db.query("SET client_encoding TO 'SQL_ASCII'");
    const result = await this.db.query(
      `DELETE FROM isat_monitora as a WHERE sr_recno in (${sr_recno.join(",")})`
    );
    return result[1].rowCount;
  }
}

module.exports = OrdensModel;
