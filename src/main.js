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
        label: "Fechar",
        type: "normal",
        click: async () => {
          if (global_config.db) {
            await global_config.db.close();
          }

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

async function startService() {
  try {
    global_config.db = await new Database().getConnection();

    // new StartService(global_config.window, db).getNomeGeral();
    new StartService(global_config.window, global_config.db).start();

    (async () => {
      while (
        !(await new StartService(
          global_config.window,
          global_config.db
        ).forcaAtualizacao())
      ) {
        await new Promise((resolve) => setTimeout(resolve, 15000));
      }

      new Notification({
        icon: global_config.iconpath,
        title: "Aviso",
        body: "O serviço está sendo encerrado pois o sistema SAGI está em processo de atualização",
      }).show();

      await global_config.db.close();

      app.isQuiting = true;
      if (process.platform !== "darwin") app.quit();
    })();
  } catch (err) {
    global_config.window.webContents.send("log", {
      log: `(${new Date().toLocaleString()}) - Erro serviço geral: ${
        err.message
      }`,
      type: "generals",
    });

    if (global_config.db) {
      await global_config.db.close();
    }

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
  if (process.platform !== "darwin") app.quit();
});

autoUpdater.on("update-available", () => {
  global_config.window.webContents.send("update_available");
});

autoUpdater.on("update-downloaded", () => {
  global_config.window.webContents.send("update_downloaded");
});

ipcMain.on("restart_app", () => {
  autoUpdater.quitAndInstall(false, false);
});
