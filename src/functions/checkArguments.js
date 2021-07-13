class CheckArguments {
  constructor(app) {
    this.app = app;

    this.host = this.app.commandLine.getSwitchValue("host") || null;
    this.port = this.app.commandLine.getSwitchValue("port") || null;
    this.user = this.app.commandLine.getSwitchValue("user") || null;
    this.password = this.app.commandLine.getSwitchValue("password") || null;
    this.database = this.app.commandLine.getSwitchValue("database") || null;
  }

  get() {
    process.env["PGHOST"] = this.host;
    process.env["PGPORT"] = this.port;
    process.env["PGUSER"] = this.user;
    process.env["PGPASS"] = this.password;
    process.env["PGDBNM"] = this.database;

    return this;
  }
}

module.exports = CheckArguments;
