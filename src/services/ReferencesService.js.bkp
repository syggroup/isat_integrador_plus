const moment = require("moment");

const Dados = require("../controllers/Dados");
const SagiIsatSinc = require("../controllers/SagiIsatSinc");
const Fornecedores = require("../controllers/Fornecedores");
const ForEnde = require("../controllers/ForEnde");
const Clientes = require("../controllers/Clientes");
const Concorrentes = require("../controllers/Concorrentes");
const Motoristas = require("../controllers/Motoristas");

const api = require("../services/api");

class ReferencesService {
  constructor(window, db) {
    this.dados = new Dados(db);

    this.sagiIsatSinc = new SagiIsatSinc(db);
    this.fornecedores = new Fornecedores(db);
    this.forEnde = new ForEnde(db);
    this.clientes = new Clientes(db);
    this.concorrentes = new Concorrentes(db);
    this.motoristas = new Motoristas(db);

    this.window = window;
  }

  async execute({ tokens }) {
    try {
      this.writeLog(
        `(${new Date().toLocaleString()}) - Iniciando serviço referências`
      );

      await Promise.all(
        tokens.map(({ token }) => {
          return Promise.all([
            this.manageSuppliers(token),
            this.manageAddressSuppliers(token),
            this.manageCustomers(token),
            this.manageCompetitors(token),
            this.manageDrivers(token),
          ]);
        })
      );

      this.writeLog(
        `(${new Date().toLocaleString()}) - Serviço referências finalizado`
      );
    } catch (err) {
      this.writeLog(
        `(${new Date().toLocaleString()}) - Erro serviço referências: ${
          err.message
        }`
      );
    } finally {
      await this.dados.setDados({
        datetime: moment().format("DD/MM/YYYY|HH:mm:ss"),
      });
    }
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  writeLog(log) {
    this.window.webContents.send("log", {
      log,
      type: "references",
    });
  }

  async manageSuppliers(token) {
    try {
      await this.sagiIsatSinc.delete({
        type: "FORNECEDOR",
        token,
        column: "codfor",
        table: "cag_for",
      });

      const fornecedores = await this.fornecedores.getFornecedores({ token });
      this.writeLog(
        `(${new Date().toLocaleString()}) - Fornecedores para sincronizar: ${
          fornecedores.length
        }`
      );

      while (fornecedores.length > 0) {
        const regs = fornecedores.splice(0, 500);

        const data = {
          registros: regs.map((r) => {
            return {
              tipo: r.tipo,
              nome: r.nome,
              id_cidade: parseInt(r.id_cidade, 10),
              latitude: parseFloat(r.latitude),
              longitude: parseFloat(r.longitude),
              codigo: parseInt(r.codigo, 10),
              status: r.status,
              ...(r.endereco && { endereco: r.endereco }),
              ...(r.bairro && { bairro: r.bairro }),
              ...(r.numero && { numero: r.numero }),
              ...(r.complemento && { complemento: r.complemento }),
              ...(r.cep && { cep: parseInt(r.cep, 10) }),
              ...(r.data_nasc && { data_nasc: r.data_nasc }),
              ...(r.email && { email: r.email }),
              ...(r.num_col && { num_col: parseInt(r.num_col, 10) }),
              ...(r.tel1 && { tel1: r.tel1 }),
              ...(r.tel2 && { tel2: r.tel2 }),
            };
          }),
        };

        const response = await api
          .post(`/${token}/referencia`, data)
          .catch((err) =>
            this.writeLog(
              `(${new Date().toLocaleString()}) - Erro requisição Api Isat Fornecedores: ${
                err.response
                  ? `${err.response.status} - ${JSON.stringify(
                      err.response.data
                    )}`
                  : err.message
              }`
            )
          );

        if (response && "data" in response && "dados" in response.data) {
          if (response.data.dados.status === "OK") {
            const retornos = response.data.dados.retorno;

            const concat_retornos = [];

            await Promise.all(
              retornos.map(async (retorno) => {
                if (retorno.status === "OK") {
                  await this.fornecedores.setIsatSinc({
                    codigo: retorno.registro.codigo,
                  });
                  await this.sagiIsatSinc.insert({
                    codigo: retorno.registro.codigo,
                    type: "FORNECEDOR",
                    token,
                  });
                }
                concat_retornos.push(
                  `Fornecedor:${retorno.registro.codigo}:${
                    retorno.status === "OK"
                      ? "OK"
                      : `ERRO:${retorno.erro.mensagem}`
                  }`
                );
                /* this.writeLog(
                  `(${new Date().toLocaleString()}) - Fornecedor:${
                    retorno.registro.codigo
                  }:${
                    retorno.status === "OK"
                      ? "OK"
                      : `ERRO:${retorno.erro.mensagem}`
                  }`
                ); */
              })
            );

            this.writeLog(
              `(${new Date().toLocaleString()}) - Fornecedores = ${concat_retornos.join(
                ", "
              )}`
            );
          } else {
            this.writeLog(
              `(${new Date().toLocaleString()}) - Erro retorno Api Isat Fornecedores: ${
                response.data.dados.retorno[0].erro.mensagem
              }`
            );
          }
        } else if (response && "data" in response) {
          this.writeLog(
            `(${new Date().toLocaleString()}) - Retorno inesperado Api Isat Fornecedores: ${
              response.data
            }`
          );
        }

        await this.dados.setDados({
          datetime: moment().format("DD/MM/YYYY|HH:mm:ss"),
        });
        await this.sleep(500);
      }

      this.writeLog(
        `(${new Date().toLocaleString()}) - Sincronismo Fornecedores finalizado`
      );
    } catch (err) {
      this.writeLog(
        `(${new Date().toLocaleString()}) - Erro inesperado no sincronismo dos Fornecedores: ${
          err.message
        }`
      );
    } finally {
      await this.dados.setDados({
        datetime: moment().format("DD/MM/YYYY|HH:mm:ss"),
      });
    }
  }

  async manageAddressSuppliers(token) {
    try {
      const enderecos = await this.forEnde.getForsEndes({ token });
      this.writeLog(
        `(${new Date().toLocaleString()}) - Ende de Fornecedores para sincronizar: ${
          enderecos.length
        }`
      );

      while (enderecos.length > 0) {
        const regs = enderecos.splice(0, 500);

        const data = {
          registros: regs.map((r) => {
            return {
              tipo: r.tipo,
              nome: r.nome,
              id_cidade: parseInt(r.id_cidade, 10),
              latitude: parseFloat(r.latitude),
              longitude: parseFloat(r.longitude),
              codigo: parseInt(r.codigo, 10),
              status: r.status,
              ...(r.endereco && { endereco: r.endereco }),
              ...(r.bairro && { bairro: r.bairro }),
              ...(r.numero && { numero: r.numero }),
              ...(r.complemento && { complemento: r.complemento }),
              ...(r.cep && { cep: parseInt(r.cep, 10) }),
              ...(r.data_nasc && { data_nasc: r.data_nasc }),
              ...(r.email && { email: r.email }),
              ...(r.num_col && { num_col: parseInt(r.num_col, 10) }),
              ...(r.tel1 && { tel1: r.tel1 }),
              ...(r.tel2 && { tel2: r.tel2 }),
            };
          }),
        };

        const response = await api
          .post(`/${token}/referencia`, data)
          .catch((err) =>
            this.writeLog(
              `(${new Date().toLocaleString()}) - Erro requisição Api Isat Ende de Fornecedores: ${
                err.response
                  ? `${err.response.status} - ${JSON.stringify(
                      err.response.data
                    )}`
                  : err.message
              }`
            )
          );

        if (response && "data" in response && "dados" in response.data) {
          if (response.data.dados.status === "OK") {
            const retornos = response.data.dados.retorno;

            const concat_retornos = [];

            await Promise.all(
              retornos.map(async (retorno) => {
                if (retorno.status === "OK") {
                  await this.fornecedores.setIsatSinc({
                    codigo: retorno.registro.codigo,
                  });
                  await this.sagiIsatSinc.insert({
                    codigo: retorno.registro.codigo,
                    type: "FORNECEDOR",
                    token,
                  });
                }
                /* this.writeLog(
                  `(${new Date().toLocaleString()}) - Ende de Fornecedores:${
                    retorno.registro.codigo
                  }:${
                    retorno.status === "OK"
                      ? "OK"
                      : `ERRO:${retorno.erro.mensagem}`
                  }`
                );*/
                concat_retornos.push(
                  `Ende de Fornecedor:${retorno.registro.codigo}:${
                    retorno.status === "OK"
                      ? "OK"
                      : `ERRO:${retorno.erro.mensagem}`
                  }`
                );
              })
            );

            this.writeLog(
              `(${new Date().toLocaleString()}) - Ende de Fornecedores = ${concat_retornos.join(
                ", "
              )}`
            );
          } else {
            this.writeLog(
              `(${new Date().toLocaleString()}) - Erro retorno Api Isat Ende de Fornecedores: ${
                response.data.dados.retorno[0].erro.mensagem
              }`
            );
          }
        } else if (response && "data" in response) {
          this.writeLog(
            `(${new Date().toLocaleString()}) - Retorno inesperado Api Isat Ende de Fornecedores: ${
              response.data
            }`
          );
        }

        await this.dados.setDados({
          datetime: moment().format("DD/MM/YYYY|HH:mm:ss"),
        });
        await this.sleep(500);
      }

      this.writeLog(
        `(${new Date().toLocaleString()}) - Sincronismo Ende de Fornecedores finalizado`
      );
    } catch (err) {
      this.writeLog(
        `(${new Date().toLocaleString()}) - Erro inesperado no sincronismo dos Ende de Fornecedores: ${
          err.message
        }`
      );
    } finally {
      await this.dados.setDados({
        datetime: moment().format("DD/MM/YYYY|HH:mm:ss"),
      });
    }
  }

  async manageCustomers(token) {
    try {
      await this.sagiIsatSinc.delete({
        type: "CLIENTE",
        token,
        column: "codcli",
        table: "cag_cli",
      });

      const clientes = await this.clientes.getClientes({ token });
      this.writeLog(
        `(${new Date().toLocaleString()}) - Clientes para sincronizar: ${
          clientes.length
        }`
      );

      while (clientes.length > 0) {
        const regs = clientes.splice(0, 500);

        const data = {
          registros: regs.map((r) => {
            return {
              tipo: r.tipo,
              nome: r.nome,
              id_cidade: parseInt(r.id_cidade, 10),
              latitude: parseFloat(r.latitude),
              longitude: parseFloat(r.longitude),
              codigo: parseInt(r.codigo, 10),
              status: r.status,
              ...(r.endereco && { endereco: r.endereco }),
              ...(r.bairro && { bairro: r.bairro }),
              ...(r.numero && { numero: r.numero }),
              ...(r.complemento && { complemento: r.complemento }),
              ...(r.cep && { cep: parseInt(r.cep, 10) }),
              ...(r.data_nasc && { data_nasc: r.data_nasc }),
              ...(r.email && { email: r.email }),
              ...(r.num_col && { num_col: parseInt(r.num_col, 10) }),
              ...(r.tel1 && { tel1: r.tel1 }),
              ...(r.tel2 && { tel2: r.tel2 }),
            };
          }),
        };

        const response = await api
          .post(`/${token}/referencia`, data)
          .catch((err) =>
            this.writeLog(
              `(${new Date().toLocaleString()}) - Erro requisição Api Isat Clientes: ${
                err.response
                  ? `${err.response.status} - ${JSON.stringify(
                      err.response.data
                    )}`
                  : err.message
              }`
            )
          );

        if (response && "data" in response && "dados" in response.data) {
          if (response.data.dados.status === "OK") {
            const retornos = response.data.dados.retorno;

            const concat_retornos = [];

            await Promise.all(
              retornos.map(async (retorno) => {
                if (retorno.status === "OK") {
                  await this.clientes.setIsatSinc({
                    codigo: retorno.registro.codigo,
                  });
                  await this.sagiIsatSinc.insert({
                    codigo: retorno.registro.codigo,
                    type: "CLIENTE",
                    token,
                  });
                }
                /* this.writeLog(
                  `(${new Date().toLocaleString()}) - Cliente:${
                    retorno.registro.codigo
                  }:${
                    retorno.status === "OK"
                      ? "OK"
                      : `ERRO:${retorno.erro.mensagem}`
                  }`
                ); */
                concat_retornos.push(
                  `Cliente:${retorno.registro.codigo}:${
                    retorno.status === "OK"
                      ? "OK"
                      : `ERRO:${retorno.erro.mensagem}`
                  }`
                );
              })
            );

            this.writeLog(
              `(${new Date().toLocaleString()}) - Clientes = ${concat_retornos.join(
                ", "
              )}`
            );
          } else {
            this.writeLog(
              `(${new Date().toLocaleString()}) - Erro retorno Api Isat Clientes: ${
                response.data.dados.retorno[0].erro.mensagem
              }`
            );
          }
        } else if (response && "data" in response) {
          this.writeLog(
            `(${new Date().toLocaleString()}) - Retorno inesperado Api Isat Clientes: ${
              response.data
            }`
          );
        }

        await this.dados.setDados({
          datetime: moment().format("DD/MM/YYYY|HH:mm:ss"),
        });
        await this.sleep(500);
      }

      this.writeLog(
        `(${new Date().toLocaleString()}) - Sincronismo Clientes finalizado`
      );
    } catch (err) {
      this.writeLog(
        `(${new Date().toLocaleString()}) - Erro inesperado no sincronismo dos Clientes: ${
          err.message
        }`
      );
    } finally {
      await this.dados.setDados({
        datetime: moment().format("DD/MM/YYYY|HH:mm:ss"),
      });
    }
  }

  async manageCompetitors(token) {
    try {
      await this.sagiIsatSinc.delete({
        type: "CONCORRENTE",
        token,
        column: "codcon",
        table: "cag_conco",
      });

      const concorrentes = await this.concorrentes.getConcorrentes({ token });
      this.writeLog(
        `(${new Date().toLocaleString()}) - Concorrentes para sincronizar: ${
          concorrentes.length
        }`
      );

      while (concorrentes.length > 0) {
        const regs = concorrentes.splice(0, 500);

        const data = {
          registros: regs.map((r) => {
            return {
              tipo: r.tipo,
              nome: r.nome,
              id_cidade: parseInt(r.id_cidade, 10),
              latitude: parseFloat(r.latitude),
              longitude: parseFloat(r.longitude),
              codigo: parseInt(r.codigo, 10),
              status: r.status,
              ...(r.endereco && { endereco: r.endereco }),
              ...(r.bairro && { bairro: r.bairro }),
              ...(r.numero && { numero: r.numero }),
              ...(r.complemento && { complemento: r.complemento }),
              ...(r.cep && { cep: parseInt(r.cep, 10) }),
              ...(r.data_nasc && { data_nasc: r.data_nasc }),
              ...(r.email && { email: r.email }),
              ...(r.num_col && { num_col: parseInt(r.num_col, 10) }),
              ...(r.tel1 && { tel1: r.tel1 }),
              ...(r.tel2 && { tel2: r.tel2 }),
            };
          }),
        };

        const response = await api
          .post(`/${token}/referencia`, data)
          .catch((err) =>
            this.writeLog(
              `(${new Date().toLocaleString()}) - Erro requisição Api Isat Concorrentes: ${
                err.response
                  ? `${err.response.status} - ${JSON.stringify(
                      err.response.data
                    )}`
                  : err.message
              }`
            )
          );

        if (response && "data" in response && "dados" in response.data) {
          if (response.data.dados.status === "OK") {
            const retornos = response.data.dados.retorno;

            const concat_retornos = [];

            await Promise.all(
              retornos.map(async (retorno) => {
                if (retorno.status === "OK") {
                  await this.concorrentes.setIsatSinc({
                    codigo: retorno.registro.codigo,
                  });
                  await this.sagiIsatSinc.insert({
                    codigo: retorno.registro.codigo,
                    type: "CONCORRENTE",
                    token,
                  });
                }
                /* this.writeLog(
                  `(${new Date().toLocaleString()}) - Concorrente:${
                    retorno.registro.codigo
                  }:${
                    retorno.status === "OK"
                      ? "OK"
                      : `ERRO:${retorno.erro.mensagem}`
                  }`
                ); */
                concat_retornos.push(
                  `Concorrente:${retorno.registro.codigo}:${
                    retorno.status === "OK"
                      ? "OK"
                      : `ERRO:${retorno.erro.mensagem}`
                  }`
                );
              })
            );

            this.writeLog(
              `(${new Date().toLocaleString()}) - Concorrentes = ${concat_retornos.join(
                ", "
              )}`
            );
          } else {
            this.writeLog(
              `(${new Date().toLocaleString()}) - Erro retorno Api Isat Concorrentes: ${
                response.data.dados.retorno[0].erro.mensagem
              }`
            );
          }
        } else if (response && "data" in response) {
          this.writeLog(
            `(${new Date().toLocaleString()}) - Retorno inesperado Api Isat Concorrentes: ${
              response.data
            }`
          );
        }

        await this.dados.setDados({
          datetime: moment().format("DD/MM/YYYY|HH:mm:ss"),
        });
        await this.sleep(500);
      }

      this.writeLog(
        `(${new Date().toLocaleString()}) - Sincronismo Concorrentes finalizado`
      );
    } catch (err) {
      this.writeLog(
        `(${new Date().toLocaleString()}) - Erro inesperado no sincronismo dos Concorrentes: ${
          err.message
        }`
      );
    } finally {
      await this.dados.setDados({
        datetime: moment().format("DD/MM/YYYY|HH:mm:ss"),
      });
    }
  }

  async manageDrivers(token) {
    try {
      await this.sagiIsatSinc.delete({
        type: "MOTORISTA",
        token,
        column: "codmot",
        table: "mot",
      });

      const motoristas = await this.motoristas.getMotoristas({ token });
      this.writeLog(
        `(${new Date().toLocaleString()}) - Motoristas para sincronizar: ${
          motoristas.length
        }`
      );

      while (motoristas.length > 0) {
        const regs = motoristas.splice(0, 500);

        const data = {
          registros: regs.map((r) => {
            return {
              tipo: r.tipo,
              nome: r.nome,
              id_cidade: parseInt(r.id_cidade, 10),
              latitude: parseFloat(r.latitude),
              longitude: parseFloat(r.longitude),
              codigo: parseInt(r.codigo, 10),
              status: r.status,
              cnh: r.cnh,
              terceiro: r.terceiro,
              ...(r.endereco && { endereco: r.endereco }),
              ...(r.bairro && { bairro: r.bairro }),
              ...(r.numero && { numero: r.numero }),
              ...(r.complemento && { complemento: r.complemento }),
              ...(r.cep && { cep: parseInt(r.cep, 10) }),
              ...(r.data_nasc && { data_nasc: r.data_nasc }),
              ...(r.email && { email: r.email }),
              ...(r.num_col && { num_col: parseInt(r.num_col, 10) }),
              ...(r.tel1 && { tel1: r.tel1 }),
              ...(r.tel2 && { tel2: r.tel2 }),
              ...(r.cnh_validade && { cnh_validade: r.cnh_validade }),
              ...(r.cpf && { cpf: r.cpf }),
            };
          }),
        };

        const response = await api
          .post(`/${token}/referencia`, data)
          .catch((err) =>
            this.writeLog(
              `(${new Date().toLocaleString()}) - Erro requisição Api Isat Motoristas: ${
                err.response
                  ? `${err.response.status} - ${JSON.stringify(
                      err.response.data
                    )}`
                  : err.message
              }`
            )
          );

        if (response && "data" in response && "dados" in response.data) {
          if (response.data.dados.status === "OK") {
            const retornos = response.data.dados.retorno;

            const concat_retornos = [];

            await Promise.all(
              retornos.map(async (retorno) => {
                if (retorno.status === "OK") {
                  await this.motoristas.setIsatSinc({
                    codigo: retorno.registro.codigo,
                  });
                  await this.sagiIsatSinc.insert({
                    codigo: retorno.registro.codigo,
                    type: "MOTORISTA",
                    token,
                  });
                }
                /* this.writeLog(
                  `(${new Date().toLocaleString()}) - Motorista:${
                    retorno.registro.codigo
                  }:${
                    retorno.status === "OK"
                      ? "OK"
                      : `ERRO:${retorno.erro.mensagem}`
                  }`
                ); */
                concat_retornos.push(
                  `Motorista:${retorno.registro.codigo}:${
                    retorno.status === "OK"
                      ? "OK"
                      : `ERRO:${retorno.erro.mensagem}`
                  }`
                );
              })
            );

            this.writeLog(
              `(${new Date().toLocaleString()}) - Motoristas = ${concat_retornos.join(
                ", "
              )}`
            );
          } else {
            this.writeLog(
              `(${new Date().toLocaleString()}) - Erro retorno Api Isat Motoristas: ${
                response.data.dados.retorno[0].erro.mensagem
              }`
            );
          }
        } else if (response && "data" in response) {
          this.writeLog(
            `(${new Date().toLocaleString()}) - Retorno inesperado Api Isat Motoristas: ${
              response.data
            }`
          );
        }

        await this.dados.setDados({
          datetime: moment().format("DD/MM/YYYY|HH:mm:ss"),
        });
        await this.sleep(500);
      }

      this.writeLog(
        `(${new Date().toLocaleString()}) - Sincronismo Motoristas finalizado`
      );
    } catch (err) {
      this.writeLog(
        `(${new Date().toLocaleString()}) - Erro inesperado no sincronismo dos Motoristas: ${
          err.message
        }`
      );
    } finally {
      await this.dados.setDados({
        datetime: moment().format("DD/MM/YYYY|HH:mm:ss"),
      });
    }
  }
}

module.exports = ReferencesService;
