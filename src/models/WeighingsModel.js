class WeighingsModel {
  constructor(db) {
    this.db = db;
  }

  async insert(insert) {
    try {
      await this.db.query("SET client_encoding TO 'SQL_ASCII'");

      const result = await this.db.query(insert);

      return { error: result[1].rows[0].message, numbol: result[1].rows[0].numero_pesagem };
    } catch (err) {
      return { error: err, numbol: 0 };
    }
  }
}

module.exports = WeighingsModel;
