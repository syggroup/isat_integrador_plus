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
  isRunning: {
    value: false,
    get: () => global_config.isRunning.value,
    set: (value) => (global_config.isRunning.value = value),
  },
  filiais_isat: {
    value: {},
    get: () => global_config.filiais_isat.value,
    set: (value) => (global_config.filiais_isat.value = value),
  },
  quitApp: {
    quit: quitApp,
  },
  alreadyExecutedToday: {
    value: null,
    get: () => global_config.alreadyExecutedToday.value,
    set: (value) => (global_config.alreadyExecutedToday.value = value),
  },
};

// ================
// Função de Loop Controlado
// ================
async function startLoop(fn, interval = 30000, name = "loop") {
  while (true) {
    try {
      await fn();
    } catch (err) {
      global_config.window.webContents.send("log", {
        log: `(${new Date().toLocaleString()}) - Erro no loop "${name}": ${err.message}`,
        type: "generals",
      });
    }

    await new Promise(resolve => setTimeout(resolve, interval));
  }
}

// ================
// Função para Iniciar Serviços
// ================
async function runAllServices() {
  try {
    const db = await new Database().getConnection();
    await new StartService(
      global_config.window,
      db,
      app.getVersion(),
      global_config.isRunning,
      global_config.filiais_isat,
      global_config.quitApp,
      global_config.alreadyExecutedToday
    ).start(process.env["SYG_CLOUD"] !== undefined);
    await db.close();
  } catch (err) {
    global_config.window.webContents.send("log", {
      log: `(${new Date().toLocaleString()}) - Erro no serviço geral: ${err.message}`,
      type: "generals",
    });
  }
}

// ================
// Verificação de Atualização SAGI
// ================
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
      quitApp();
    }
    await db.close();
  } catch (err) {
    global_config.window.webContents.send("log", {
      log: `(${new Date().toLocaleString()}) - Erro verifica atualização SAGI: ${err.message}`,
      type: "generals",
    });
  }
}

// ================
// Verificação da Integração iSat
// ================
async function verifyIntegrationIsat() {
  try {
    const db = await new Database().getConnection();
    global_config.verifica_integracao_isat = true;
    await new StartService(global_config.window, db, null, {}, global_config.filiais_isat).verificaIntegracaoIsat();
    await db.close();
  } catch (err) {
    global_config.window.webContents.send("log", {
      log: `(${new Date().toLocaleString()}) - Erro verifica integração iSat: ${err.message}`,
      type: "generals",
    });
  }
}

// ================
// Verificação Data Inicial de Sincronização
// ================
async function verifyDateStartSyncIsat() {
  try {
    const db = await new Database().getConnection();
    global_config.verifica_data_inicial_sinc_isat = true;
    await new StartService(global_config.window, db).verificaDataInicialSincIsat();
    await db.close();
  } catch (err) {
    global_config.window.webContents.send("log", {
      log: `(${new Date().toLocaleString()}) - Erro verifica data inicial sinc iSat: ${err.message}`,
      type: "generals",
    });
  }
}

// ================
// Iniciar Serviços
// ================
async function startService() {
  try {
    if (!global_config.verifica_integracao_isat) {
      await verifyIntegrationIsat();
    }
    if (!global_config.verifica_data_inicial_sinc_isat) {
      await verifyDateStartSyncIsat();
    }

    // Iniciar loops
    startLoop(runAllServices, 30000, "runAllServices");
    startLoop(verifySagiUpdate, 30000, "verifySagiUpdate");

  } catch (err) {
    global_config.window.webContents.send("log", {
      log: `(${new Date().toLocaleString()}) - Erro ao iniciar serviço: ${err.message}`,
      type: "generals",
    });
    setTimeout(startService, 30000);
  }
}

// ================
// Criar Tray
// ================
function createIconAndTray() {
  const icon = nativeImage.createFromPath(global_config.iconpath);
  global_config.icon = icon;
  if (app.dock) app.dock.setIcon(icon);
  global_config.tray = new Tray(global_config.iconpath);
  global_config.tray.setToolTip(`Sagi - Integração iSat (${app.getVersion()})`);
  global_config.tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: "Abrir",
        click: () => {
          global_config.window.show();
          global_config.window.maximize();
        },
      },
      {
        label: "Versão",
        click: () => {
          dialog.showMessageBox({
            title: "Versão do executável",
            message: `Atualmente o executável está na versão: ${app.getVersion()}`,
          });
        },
      },
      {
        label: "Notificações",
        submenu: [
          {
            label: "Habilitar/Desabilitar",
            click: () => {
              global_config.window.webContents.send("change_notifications");
            },
          },
        ],
        visible: process.env["SYG_CLOUD"] === undefined,
      },
      {
        label: "Fechar",
        click: quitApp,
      },
    ])
  );
  global_config.tray.on("double-click", () => {
    global_config.window.show();
    global_config.window.maximize();
  });
}

// ================
// Criar Janela
// ================
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
  global_config.window.on("close", (event) => {
    if (!app.isQuiting) event.preventDefault();
    global_config.window.hide();
  });
  global_config.window.loadFile(path.join(__dirname, "common", "index.html"));
}

// ================
// Finalizar Aplicação
// ================
function quitApp() {
  try {
    if (global_config.window) global_config.window.hide();

    setTimeout(() => {
      app.isQuiting = true;
      if (process.platform !== "darwin") app.quit();
    }, 500);
  } catch (err) {
    app.isQuiting = true;
    if (process.platform !== "darwin") app.quit();
  }
}

// ================
// Atualização Automática
// ================
function automaticCheckForUpdates() {
  try {
    autoUpdater.checkForUpdatesAndNotify();
  } catch (err) {
    global_config.window.webContents.send("log", {
      log: `(${new Date().toLocaleString()}) - Erro serviço atualização(app): ${err.message}`,
      type: "generals",
    });
  }
}

// ================
// Inicialização do App
// ================
app.whenReady().then(async () => {
  try {
    const isUniqueInstance = app.requestSingleInstanceLock();
    const SYG_CLOUD = process.env["SYG_CLOUD"];

    if (!isUniqueInstance && SYG_CLOUD === undefined) {
      new Notification({
        icon: global_config.iconpath,
        title: "Ops",
        body: "Integrador Isat já está em execução...",
      }).show();
      quitApp();
    } else {
      const { host, port, user, password, database } = checkArguments(app);
      if (!host || !port || !user || !password || !database) {
        dialog
          .showMessageBox({
            type: "error",
            title: "Erro na validação dos argumentos",
            message: "Parâmetros de inicialização ausentes ou inválidos!",
          })
          .then(quitApp);
      } else {
        createIconAndTray();
        createWindow();
        automaticCheckForUpdates();
        startService();

        app.on("activate", () => {
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
      .then(quitApp);
  }
});

// ================
// Eventos do App
// ================
app.on("window-all-closed", quitApp);

autoUpdater.on("error", (err) => {
  global_config.window.webContents.send("log", {
    log: `(${new Date().toLocaleString()}) - Erro serviço atualização(app): ${err}`,
    type: "generals",
  });
});

autoUpdater.on("download-progress", (progressObj) => {
  const message = `${progressObj.percent.toFixed(1)}%`;
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

// ================
// IPC Handlers
// ================
ipcMain.on("restart_app", async () => {
  app.isQuiting = true;
  autoUpdater.quitAndInstall(true, false);
});

ipcMain.handle("getNomeGeral", async () => {
  try {
    const db = await new Database().getConnection();
    if (db) {
      const nomegeral = await new StartService(global_config.window, db).getNomeGeral();
      await db.close();
      return nomegeral;
    } else {
      return 0;
    }
  } catch (err) {
    return 0;
  }
});

ipcMain.handle("getAppVersion", () => app.getVersion());

ipcMain.handle("checkIsCloud", () => {
  return process.env["SYG_CLOUD"] !== undefined;
});

ipcMain.handle("getTokens", async () => {
  try {
    const db = await new Database().getConnection();
    if (db) {
      const tokens = await new StartService(global_config.window, db).getTokens();
      await db.close();
      return tokens;
    } else {
      return null;
    }
  } catch (err) {
    return null;
  }
});

ipcMain.on("status_notifications", (_event, arg) => {
  dialog.showMessageBox({
    type: "info",
    title: "Status Notificações",
    message: `As notificações foram ${arg === "true" ? "habilitadas" : "desabilitadas"}`,
  });
});
