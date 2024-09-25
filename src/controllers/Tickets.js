const TicketsModel = require("../models/TicketsModel");

class Tickets {
  constructor(db) {
    this.tickets_model = new TicketsModel(db);
  }

  getTickets(data) {
    return this.tickets_model.getTickets(data);
  }

  deleteAllDeleteAfterInsert() {
    return this.tickets_model.deleteAllDeleteAfterInsert();
  }

  deleteBySrRecno(sr_recno) {
    return this.tickets_model.deleteBySrRecno(sr_recno);
  }
}

module.exports = Tickets;
