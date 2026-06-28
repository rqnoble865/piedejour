const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("piedejour", {
  readEntries: () => ipcRenderer.invoke("entries:read"),
  writeEntries: (entries) => ipcRenderer.invoke("entries:write", entries),
  readEntry: (entryId) => ipcRenderer.invoke("entries:readOne", entryId),
  openEntryView: (entryId) => ipcRenderer.invoke("entries:openView", entryId),
  readSettings: () => ipcRenderer.invoke("settings:read"),
  writeSettings: (settings) => ipcRenderer.invoke("settings:write", settings),
});
