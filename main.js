const { app, BrowserWindow, Menu, ipcMain } = require("electron");
const fs = require("node:fs/promises");
const path = require("node:path");

const DATA_FILE = "entries.json";
const SETTINGS_FILE = "settings.json";

function getEntriesPath() {
  return path.join(app.getPath("userData"), DATA_FILE);
}

function getSettingsPath() {
  return path.join(app.getPath("userData"), SETTINGS_FILE);
}

async function readEntries() {
  try {
    const rawEntries = await fs.readFile(getEntriesPath(), "utf8");
    const entries = JSON.parse(rawEntries);
    return Array.isArray(entries) ? entries : [];
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

async function writeEntries(entries) {
  const entriesPath = getEntriesPath();
  await fs.mkdir(path.dirname(entriesPath), { recursive: true });
  await fs.writeFile(entriesPath, JSON.stringify(entries, null, 2), "utf8");
}

async function readSettings() {
  try {
    const rawSettings = await fs.readFile(getSettingsPath(), "utf8");
    const settings = JSON.parse(rawSettings);
    return settings && typeof settings === "object" ? settings : {};
  } catch (error) {
    if (error.code === "ENOENT") {
      return {};
    }

    throw error;
  }
}

async function writeSettings(_event, settings) {
  const settingsPath = getSettingsPath();
  await fs.mkdir(path.dirname(settingsPath), { recursive: true });
  await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2), "utf8");
}

async function readEntry(_event, entryId) {
  const entries = await readEntries();
  return entries.find((entry) => entry.id === entryId) || null;
}

function openEntryWindow(_event, entryId) {
  const window = new BrowserWindow({
    width: 680,
    height: 720,
    minWidth: 520,
    minHeight: 420,
    title: "Journal Entry",
    backgroundColor: "#f8f7f3",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  window.loadFile("entry-view.html", {
    query: { entryId },
  });
}

function createWindow() {
  const window = new BrowserWindow({
    width: 960,
    height: 760,
    minWidth: 720,
    minHeight: 560,
    title: "Piedejour",
    backgroundColor: "#f8f7f3",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  window.loadFile("index.html");
}

function createMenu() {
  const menu = Menu.buildFromTemplate([
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" },
      ],
    },
  ]);

  Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
  ipcMain.handle("entries:read", readEntries);
  ipcMain.handle("entries:write", (_event, entries) => writeEntries(entries));
  ipcMain.handle("entries:readOne", readEntry);
  ipcMain.handle("entries:openView", openEntryWindow);
  ipcMain.handle("settings:read", readSettings);
  ipcMain.handle("settings:write", writeSettings);

  createMenu();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
