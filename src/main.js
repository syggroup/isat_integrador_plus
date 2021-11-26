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
const { exec } = require("child_process");

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
  timeout_verify_sagi_update: null,
  timeout_start_service: null,
  timeout_automatic_check_for_updates: null,
  timeout_run_all_services: null,
  isRunning: {
    value: false,
    get: () => global_config.isRunning.value,
    set: (value) => (global_config.isRunning.value = value),
  },
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

async function verifyIntegrationIsat() {
  try {
    const db = await new Database().getConnection();

    global_config.verifica_integracao_isat = true;

    await new StartService(global_config.window, db).verificaIntegracaoIsat();

    await db.close();
  } catch (err) {
    global_config.window.webContents.send("log", {
      log: `(${new Date().toLocaleString()}) - Erro verifica integração iSat: ${
        err.message
      }`,
      type: "generals",
    });
  }
}

async function verifyDateStartSyncIsat() {
  try {
    const db = await new Database().getConnection();

    global_config.verifica_data_inicial_sinc_isat = true;

    await new StartService(
      global_config.window,
      db
    ).verificaDataInicialSincIsat();

    await db.close();
  } catch (err) {
    global_config.window.webContents.send("log", {
      log: `(${new Date().toLocaleString()}) - Erro verifica data inicial sinc iSat: ${
        err.message
      }`,
      type: "generals",
    });
  }
}

async function verifySagiUpdate() {
  try {
    const db = await new Database().getConnection();

    if (await new StartService(global_config.window, db).checkUpdateSagi()) {
      new Notification({
        icon: global_config.iconpath,
        title: "Aviso",
        body: "O serviço está sendo encerrado pois o sistema SAGI está em processo de atualização",
      }).show();

      await db.close();

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
    clearTimeout(global_config.timeout_verify_sagi_update);
    global_config.timeout_verify_sagi_update = setTimeout(
      () => verifySagiUpdate(),
      30000
    );
  }
}

async function runAllServices() {
  try {
    const db = await new Database().getConnection();

    await new StartService(
      global_config.window,
      db,
      app.getVersion(),
      global_config.isRunning
    ).start();
  } catch (err) {
    global_config.window.webContents.send("log", {
      log: `(${new Date().toLocaleString()}) - Erro serviço geral: ${
        err.message
      }`,
      type: "generals",
    });
  } finally {
    clearTimeout(global_config.timeout_run_all_services);
    global_config.timeout_run_all_services = setTimeout(
      () => runAllServices(),
      30000
    );
  }
}

async function startService() {
  try {
    if (!global_config.verifica_integracao_isat) {
      verifyIntegrationIsat();
    }

    if (!global_config.verifica_data_inicial_sinc_isat) {
      verifyDateStartSyncIsat();
    }

    runAllServices();

    verifySagiUpdate();
  } catch (err) {
    global_config.window.webContents.send("log", {
      log: `(${new Date().toLocaleString()}) - Erro serviço geral: ${
        err.message
      }`,
      type: "generals",
    });

    clearTimeout(global_config.timeout_run_all_services);
    clearTimeout(global_config.timeout_verify_sagi_update);
    clearTimeout(global_config.timeout_start_service);
    global_config.timeout_start_service = setTimeout(
      () => startService(),
      30000
    );
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
    clearTimeout(global_config.timeout_automatic_check_for_updates);
    global_config.timeout_automatic_check_for_updates = setTimeout(
      () => automaticCheckForUpdates(),
      1800000
    );
  }
}

function checkOldExecutableIsRunningAndClose() {
  try {
    exec("taskkill /IM integrador_isat.exe /F");
  } catch (err) {
    global_config.window.webContents.send("log", {
      log: `(${new Date().toLocaleString()}) - Erro ao tentar finalizar processo antigo integrador: ${err}`,
      type: "generals",
    });
  }
}

app.whenReady().then(async () => {
  try {
    const isUniqueInstance = app.requestSingleInstanceLock();

    if (!isUniqueInstance) {
      new Notification({
        icon: global_config.iconpath,
        title: "Ops",
        body: "Integrador Isat ja está em execução ...",
      }).show();

      app.isQuiting = true;
      if (process.platform !== "darwin") app.quit();
    } else {
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
        checkOldExecutableIsRunningAndClose();

        createIconAndTray();

        createWindow();

        automaticCheckForUpdates();

        startService();

        app.on("activate", function () {
          if (BrowserWindow.getAllWindows().length === 0) createWindow();
        });
      }
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

autoUpdater.on("error", (err) => {
  global_config.window.webContents.send("log", {
    log: `(${new Date().toLocaleString()}) - Erro serviço atualização(app): ${err}`,
    type: "generals",
  });
});

autoUpdater.on("download-progress", (progressObj) => {
  const message = `${progressObj.percent.toFixed(1)} %`;
  global_config.window.webContents.send("log", {
    log: `(${new Date().toLocaleString()}) - Progresso do download da nova versão do app: ${message}`,
    type: "generals",
  });
});

autoUpdater.on("update-available", () => {
  global_config.window.webContents.send("update_available");
});

autoUpdater.on("update-downloaded", () => {
  global_config.window.webContents.send("update_downloaded");
});

ipcMain.on("restart_app", async () => {
  autoUpdater.quitAndInstall(true, false);
});

ipcMain.handle("getNomeGeral", async () => {
  const db = await new Database().getConnection();

  if (db) {
    const nomegeral = await new StartService(
      global_config.window,
      db
    ).getNomeGeral();

    await db.close();

    return nomegeral;
  } else {
    return 0;
  }
});

ipcMain.handle("getAppVersion", () => app.getVersion());

ipcMain.handle("getTokens", async () => {
  const db = await new Database().getConnection();

  if (db) {
    const tokens = await new StartService(global_config.window, db).getTokens();

    await db.close();

    return tokens;
  } else {
    return null;
  }
});
