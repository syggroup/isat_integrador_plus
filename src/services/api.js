const axios = require("axios");

const api = axios.create({
  baseURL: "http://localhost/sagisolutions/trunk/api",
});

module.exports = api;
