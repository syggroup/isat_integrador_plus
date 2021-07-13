const CheckArguments = require("./checkArguments");

module.exports = {
  checkArguments(app) {
    const checkArguments = new CheckArguments(app);

    return checkArguments.get();
  },
};
