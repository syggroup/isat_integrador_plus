const { Sequelize } = require("sequelize");

class Database {
  constructor() {
    this.config = {
      host: process.env.PGHOST,
      port: process.env.PGPORT,
      username: process.env.PGUSER,
      password: process.env.PGPASS,
      database: process.env.PGDBNM,
      dialect: "postgres",
      logging: false,
    };
  }

  async getConnection() {
    const client = new Sequelize(this.config);

    await client.query("SET client_encoding TO 'SQL_ASCII'");

    return client;
  }
}

module.exports = Database;
