const axios = require("axios");
const https = require("https");

const api = axios.create({
  baseURL: "https://isat.sagisolutions.com/api",
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
  }),
  timeout: 60000,
});

module.exports = api;
