const ChecklistModel = require("../models/ChecklistModel");

class Checklist {
  constructor(db) {
    this.checklist_model = new ChecklistModel(db);
  }

  getChecklist(data) {
    return this.checklist_model.getAll(data);
  }
}

module.exports = Checklist;
