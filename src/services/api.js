const axios = require("axios");

const api = axios.create({
  baseURL: "https://isat.sagisolutions.com/api",
});

module.exports = api;
