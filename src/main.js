const {
  app,
  BrowserWindow,
  nativeImage,
  Tray,
  Menu,
  dialog,
  screen,
  Notification,
  ipcMain,
} = require("electron");
const path = require("path");
const { autoUpdater } = require("electron-updater");

const Database = require("./database");

const { checkArguments } = require("./functions");
const StartService = require("./services/StartService");

const global_config = {
  tray: null,
  window: null,
  icon: null,
  iconpath: path.join(__dirname, "assets", "image", "logo.png"),
  db: null,
  verifica_integracao_isat: false,
  verifica_data_inicial_sinc_isat: false,
};

function createIconAndTray() {
  global_config.icon = nativeImage.createFromPath(global_config.iconpath);

  if (app.dock) {
    app.dock.setIcon(global_config.icon);
  }

  global_config.tray = new Tray(global_config.iconpath);

  global_config.tray.setToolTip("Sagi - Integração iSat");
  global_config.tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: "Abrir",
        type: "normal",
        click: () => {
          global_config.window.show();
          global_config.window.maximize();
        },
      },
      {
        label: "Versão",
        type: "normal",
        click: () => {
          dialog.showMessageBox({
            type: "info",
            title: "Versão do executável",
            message: `Atualmente o executável está na versao: ${app.getVersion()}`,
          });
        },
      },
      {
        label: "Fechar",
        type: "normal",
        click: async () => {
          try {
            if (global_config.db) {
              await global_config.db.close();
            }
          } catch (err) {}

          app.isQuiting = true;
          if (process.platform !== "darwin") app.quit();
        },
      },
    ])
  );

  global_config.tray.on("double-click", () => {
    global_config.window.show();
    global_config.window.maximize();
  });
}

function createWindow() {
  global_config.window = new BrowserWindow({
    icon: global_config.icon,
    autoHideMenuBar: true,
    maximizable: true,
    minimizable: true,
    resizable: true,
    alwaysOnTop: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    show: false,
    closable: true,
    ...screen.getPrimaryDisplay().size,
  });

  //global_config.window.webContents.openDevTools();

  //global_config.window.on("minimize", function (event) {
  //  event.preventDefault();
  //  global_config.window.hide();
  //});

  global_config.window.on("close", function (event) {
    if (!app.isQuiting) {
      event.preventDefault();
      global_config.window.hide();
    }

    return false;
  });

  global_config.window.on("show", function () {
    global_config.window.maximize();
  });

  global_config.window.loadFile(path.join(__dirname, "common", "index.html"));
}

async function setGlobalConnectionDatabase() {
  try {
    global_config.db = await new Database().getConnection();
    return true;
  } catch (err) {
    global_config.window.webContents.send("log", {
      log: `(${new Date().toLocaleString()}) - Erro conexão banco de dados: ${
        err.message
      }`,
      type: "generals",
    });
    return false;
  }
}

async function verifyIntegrationIsat() {
  try {
    if (!global_config.verifica_integracao_isat) {
      global_config.verifica_integracao_isat = true;

      return await new StartService(
        global_config.window,
        global_config.db
      ).verificaIntegracaoIsat();
    }

    return true;
  } catch (err) {
    global_config.window.webContents.send("log", {
      log: `(${new Date().toLocaleString()}) - Erro verifica integração iSat: ${
        err.message
      }`,
      type: "generals",
    });
    return false;
  }
}

async function verifyDateStartSyncIsat() {
  try {
    if (!global_config.verifica_data_inicial_sinc_isat) {
      global_config.verifica_data_inicial_sinc_isat = true;

      return await new StartService(
        global_config.window,
        global_config.db
      ).verificaDataInicialSincIsat();
    }

    return true;
  } catch (err) {
    global_config.window.webContents.send("log", {
      log: `(${new Date().toLocaleString()}) - Erro verifica data inicial sinc iSat: ${
        err.message
      }`,
      type: "generals",
    });
    return false;
  }
}

async function verifySagiUpdate() {
  try {
    const check = await new StartService(
      global_config.window,
      global_config.db
    ).checkUpdateSagi();

    if (check) {
      new Notification({
        icon: global_config.iconpath,
        title: "Aviso",
        body: "O serviço está sendo encerrado pois o sistema SAGI está em processo de atualização",
      }).show();

      await global_config.db.close();

      app.isQuiting = true;
      if (process.platform !== "darwin") app.quit();
    }
  } catch (err) {
    global_config.window.webContents.send("log", {
      log: `(${new Date().toLocaleString()}) - Erro verifica forca atualização: ${
        err.message
      }`,
      type: "generals",
    });
  } finally {
    setTimeout(() => verifySagiUpdate(), 15000);
  }
}

function runAllServices() {
  try {
    new StartService(global_config.window, global_config.db).start();
    // new StartService(global_config.window, global_config.db).odometer();
  } catch (err) {
    global_config.window.webContents.send("log", {
      log: `(${new Date().toLocaleString()}) - Erro serviço geral: ${
        err.message
      }`,
      type: "generals",
    });
  }
}

async function startService() {
  try {
    if (await setGlobalConnectionDatabase()) {
      await verifyIntegrationIsat();

      await verifyDateStartSyncIsat();

      runAllServices();

      verifySagiUpdate();
    }
  } catch (err) {
    global_config.window.webContents.send("log", {
      log: `(${new Date().toLocaleString()}) - Erro serviço geral: ${
        err.message
      }`,
      type: "generals",
    });

    try {
      if (global_config.db) {
        await global_config.db.close();
      }
    } catch (err) {}

    setTimeout(() => startService(), 60000);
  }
}

function automaticCheckForUpdates() {
  try {
    autoUpdater.checkForUpdatesAndNotify();
  } catch (err) {
    global_config.window.webContents.send("log", {
      log: `(${new Date().toLocaleString()}) - Erro serviço atualização(app): ${
        err.message
      }`,
      type: "generals",
    });
  } finally {
    setTimeout(() => automaticCheckForUpdates(), 1800000);
  }
}

app.whenReady().then(() => {
  try {
    const { host, port, user, password, database } = checkArguments(app);

    if (!host || !port || !user || !password || !database) {
      dialog
        .showMessageBox({
          type: "error",
          title: "Erro na validação dos argumentos",
          message: "Parâmetros de inicialização ausentes ou inválidos!",
        })
        .then(() => {
          app.isQuiting = true;
          if (process.platform !== "darwin") app.quit();
        });
    } else {
      createIconAndTray();

      createWindow();

      automaticCheckForUpdates();

      startService();

      app.on("activate", function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
      });
    }
  } catch (err) {
    dialog
      .showMessageBox({
        type: "error",
        title: "Erro inesperado",
        message: err.message,
      })
      .then(() => {
        app.isQuiting = true;
        if (process.platform !== "darwin") app.quit();
      });
  }
});

app.on("window-all-closed", function () {
  app.isQuiting = true;
  if (process.platform !== "darwin") app.quit();
});

autoUpdater.on("update-available", () => {
  global_config.window.webContents.send("update_available");
});

autoUpdater.on("update-downloaded", () => {
  global_config.window.webContents.send("update_downloaded");
});

ipcMain.on("restart_app", async () => {
  try {
    if (global_config.db) {
      await global_config.db.close();
    }
  } catch (err) {}

  autoUpdater.quitAndInstall(true, false);
});

ipcMain.handle("getNomeGeral", async () => {
  if (global_config.db) {
    return await new StartService(
      global_config.window,
      global_config.db
    ).getNomeGeral();
  } else {
    return 0;
  }
});

ipcMain.handle("getAppVersion", () => app.getVersion());
