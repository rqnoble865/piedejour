const STORAGE_KEY = "piedejour.entries";
const SETTINGS_STORAGE_KEY = "piedejour.settings";
const DEFAULT_SETTINGS = {
  fontSize: 15,
  textColor: "#1f2328",
  backgroundColor: "#ffffff",
  wordWrapEnabled: true,
  wrapGuideColumn: 88,
  wrapGuideVisible: true,
};

const statusDate = document.querySelector("#statusDate");
const statusCursor = document.querySelector("#statusCursor");
const statusLines = document.querySelector("#statusLines");
const statusWords = document.querySelector("#statusWords");
const statusCharacters = document.querySelector("#statusCharacters");
const saveStatus = document.querySelector("#saveStatus");
const wrapGuide = document.querySelector("#wrapGuide");
const editorWrap = document.querySelector(".editor-wrap");
const entryBody = document.querySelector("#entryBody");
const todayDialog = document.querySelector("#todayDialog");
const continueTodayButton = document.querySelector("#continueTodayButton");
const startFreshButton = document.querySelector("#startFreshButton");
const optionsDialog = document.querySelector("#optionsDialog");
const optionNewEntryButton = document.querySelector("#optionNewEntryButton");
const optionBrowseButton = document.querySelector("#optionBrowseButton");
const optionSettingsButton = document.querySelector("#optionSettingsButton");
const settingsDialog = document.querySelector("#settingsDialog");
const closeSettingsButton = document.querySelector("#closeSettingsButton");
const fontSizeInput = document.querySelector("#fontSizeInput");
const fontSizeValue = document.querySelector("#fontSizeValue");
const textColorInput = document.querySelector("#textColorInput");
const backgroundColorInput = document.querySelector("#backgroundColorInput");
const wordWrapEnabledInput = document.querySelector("#wordWrapEnabledInput");
const wrapGuideColumnInput = document.querySelector("#wrapGuideColumnInput");
const wrapGuideVisibleInput = document.querySelector("#wrapGuideVisibleInput");
const browseDialog = document.querySelector("#browseDialog");
const closeBrowseButton = document.querySelector("#closeBrowseButton");
const previousMonthButton = document.querySelector("#previousMonthButton");
const nextMonthButton = document.querySelector("#nextMonthButton");
const browseMonthLabel = document.querySelector("#browseMonthLabel");
const calendarGrid = document.querySelector("#calendarGrid");
const selectedDateLabel = document.querySelector("#selectedDateLabel");
const selectedDateEntries = document.querySelector("#selectedDateEntries");

let entries = [];
let activeEntryId = null;
let saveTimer = null;
let settings = { ...DEFAULT_SETTINGS };
let browseMonth = new Date();
let selectedBrowseDate = null;

const todayKey = getDateKey(new Date());

async function loadEntries() {
  if (window.piedejour) {
    return window.piedejour.readEntries();
  }

  try {
    const storedEntries = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(storedEntries) ? storedEntries : [];
  } catch {
    return [];
  }
}

async function persistEntries() {
  if (window.piedejour) {
    await window.piedejour.writeEntries(entries);
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

async function loadSettings() {
  if (window.piedejour) {
    return normalizeSettings(await window.piedejour.readSettings());
  }

  try {
    return normalizeSettings(JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) || "{}"));
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

async function persistSettings() {
  if (window.piedejour) {
    await window.piedejour.writeSettings(settings);
    return;
  }

  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

function normalizeSettings(candidate) {
  const normalized = { ...DEFAULT_SETTINGS };

  if (Number.isFinite(candidate?.fontSize)) {
    normalized.fontSize = Math.min(28, Math.max(12, candidate.fontSize));
  }

  if (isHexColor(candidate?.textColor)) {
    normalized.textColor = candidate.textColor;
  }

  if (isHexColor(candidate?.backgroundColor)) {
    normalized.backgroundColor = candidate.backgroundColor;
  }

  if (typeof candidate?.wordWrapEnabled === "boolean") {
    normalized.wordWrapEnabled = candidate.wordWrapEnabled;
  }

  if (Number.isFinite(candidate?.wrapGuideColumn)) {
    normalized.wrapGuideColumn = Math.min(160, Math.max(40, candidate.wrapGuideColumn));
  }

  if (typeof candidate?.wrapGuideVisible === "boolean") {
    normalized.wrapGuideVisible = candidate.wrapGuideVisible;
  }

  return normalized;
}

function isHexColor(value) {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);
}

function hexToRgba(hexColor, alpha) {
  const value = Number.parseInt(hexColor.slice(1), 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function applySettings() {
  const wrapGuideColor = hexToRgba(settings.textColor, 0.2);
  const wrapGuideImage = `linear-gradient(to right, transparent calc(var(--editor-padding-left) + var(--wrap-column) - 1px), ${wrapGuideColor} calc(var(--editor-padding-left) + var(--wrap-column) - 1px), ${wrapGuideColor} calc(var(--editor-padding-left) + var(--wrap-column)), transparent calc(var(--editor-padding-left) + var(--wrap-column)))`;
  entryBody.style.fontSize = `${settings.fontSize}px`;
  entryBody.style.color = settings.textColor;
  document.body.style.backgroundColor = settings.backgroundColor;
  editorWrap.style.backgroundColor = settings.backgroundColor;
  editorWrap.style.setProperty("--wrap-column", `${settings.wrapGuideColumn}ch`);
  entryBody.wrap = settings.wordWrapEnabled ? "soft" : "off";
  entryBody.classList.toggle("no-word-wrap", !settings.wordWrapEnabled);
  entryBody.style.setProperty(
    "--wrap-guide-image",
    settings.wrapGuideVisible ? wrapGuideImage : "none",
  );
  wrapGuide.hidden = true;
  fontSizeInput.value = String(settings.fontSize);
  fontSizeValue.textContent = `${settings.fontSize}px`;
  textColorInput.value = settings.textColor;
  backgroundColorInput.value = settings.backgroundColor;
  wordWrapEnabledInput.checked = settings.wordWrapEnabled;
  wrapGuideColumnInput.value = String(settings.wrapGuideColumn);
  wrapGuideVisibleInput.checked = settings.wrapGuideVisible;
}

function queueSettingsSave() {
  applySettings();
  persistSettings();
}

function getDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatReadableDate(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

function formatMonthLabel(date) {
  return new Intl.DateTimeFormat(undefined, {
    month: "long",
    year: "numeric",
  }).format(date);
}

function createEntry(dateKey = todayKey) {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    date: dateKey,
    title: "",
    body: "",
    createdAt: now,
    updatedAt: now,
  };
}

function getTodayEntries() {
  return entries
    .filter((entry) => entry.date === todayKey)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function getEntriesByDate(dateKey) {
  return entries
    .filter((entry) => entry.date === dateKey)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

function setActiveEntry(entry) {
  activeEntryId = entry.id;
  entryBody.value = entry.body;
  updateStatusBar();
  saveStatus.textContent = "Saved";
  entryBody.focus();
}

function getActiveEntry() {
  return entries.find((entry) => entry.id === activeEntryId);
}

async function startNewEntry() {
  const entry = createEntry();
  entries.unshift(entry);
  await persistEntries();
  setActiveEntry(entry);
}

async function saveActiveEntry() {
  const entry = getActiveEntry();
  if (!entry) return;

  entry.body = entryBody.value;
  entry.updatedAt = new Date().toISOString();
  try {
    await persistEntries();
    updateStatusBar();
    saveStatus.textContent = "Saved";
  } catch {
    saveStatus.textContent = "Could not save";
  }
}

function queueSave() {
  updateStatusBar();
  saveStatus.textContent = "Unsaved";
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(saveActiveEntry, 250);
}

function openTodayChoice() {
  if (typeof todayDialog.showModal === "function") {
    todayDialog.showModal();
  }
}

function getEntryTitle(entry) {
  const firstContentLine = entry.body.split("\n").find((line) => line.trim());
  return firstContentLine ? firstContentLine.slice(0, 40) : "Untitled entry";
}

function getCursorPosition() {
  const textBeforeCursor = entryBody.value.slice(0, entryBody.selectionStart);
  const rows = textBeforeCursor.split("\n");
  return {
    row: rows.length,
    column: rows[rows.length - 1].length + 1,
  };
}

function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function updateStatusBar() {
  const entry = getActiveEntry();
  const text = entryBody.value;
  const lineCount = text.length === 0 ? 1 : text.split("\n").length;
  const words = text.trim().match(/\S+/g) || [];
  const cursor = getCursorPosition();

  statusDate.textContent = entry ? formatReadableDate(entry.date) : "No entry";
  statusCursor.textContent = `Ln ${cursor.row}, Col ${cursor.column}`;
  statusLines.textContent = pluralize(lineCount, "line");
  statusWords.textContent = pluralize(words.length, "word");
  statusCharacters.textContent = pluralize(text.length, "character");
}

function getDateEntryCounts() {
  return entries.reduce((counts, entry) => {
    counts.set(entry.date, (counts.get(entry.date) || 0) + 1);
    return counts;
  }, new Map());
}

function renderCalendar() {
  const monthStart = new Date(browseMonth.getFullYear(), browseMonth.getMonth(), 1);
  const firstCalendarDate = new Date(monthStart);
  firstCalendarDate.setDate(monthStart.getDate() - monthStart.getDay());

  const entryCounts = getDateEntryCounts();
  browseMonthLabel.textContent = formatMonthLabel(monthStart);
  calendarGrid.innerHTML = "";

  for (let index = 0; index < 42; index += 1) {
    const date = new Date(firstCalendarDate);
    date.setDate(firstCalendarDate.getDate() + index);

    const dateKey = getDateKey(date);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "calendar-day";
    button.dataset.date = dateKey;
    button.textContent = String(date.getDate());
    button.setAttribute("aria-label", formatReadableDate(dateKey));

    if (date.getMonth() !== browseMonth.getMonth()) {
      button.classList.add("calendar-day-muted");
    }

    if (dateKey === todayKey) {
      button.classList.add("calendar-day-today");
    }

    if (dateKey === selectedBrowseDate) {
      button.classList.add("calendar-day-selected");
    }

    const entryCount = entryCounts.get(dateKey) || 0;
    if (entryCount > 0) {
      button.classList.add("calendar-day-has-entry");
      button.setAttribute("aria-label", `${formatReadableDate(dateKey)}, ${entryCount} entries`);
    }

    calendarGrid.append(button);
  }
}

function renderSelectedDateEntries() {
  selectedDateLabel.textContent = selectedBrowseDate
    ? formatReadableDate(selectedBrowseDate)
    : "Choose a date";
  selectedDateEntries.innerHTML = "";

  if (!selectedBrowseDate) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "Click a date to see entries.";
    selectedDateEntries.append(empty);
    return;
  }

  const dateEntries = getEntriesByDate(selectedBrowseDate);

  if (dateEntries.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No entries for this date.";
    selectedDateEntries.append(empty);
    return;
  }

  dateEntries.forEach((entry) => {
    const row = document.createElement("div");
    row.className = "browse-entry-row";

    const details = document.createElement("div");
    details.className = "browse-entry-details";

    const title = document.createElement("span");
    title.className = "entry-row-title";
    title.textContent = getEntryTitle(entry);

    const meta = document.createElement("span");
    meta.className = "entry-row-date";
    meta.textContent = new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(entry.createdAt));

    const actions = document.createElement("div");
    actions.className = "browse-entry-actions";

    const viewButton = document.createElement("button");
    viewButton.type = "button";
    viewButton.textContent = "View";
    viewButton.dataset.action = "view";
    viewButton.dataset.entryId = entry.id;

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.textContent = "Edit";
    editButton.dataset.action = "edit";
    editButton.dataset.entryId = entry.id;

    details.append(title, meta);
    actions.append(viewButton, editButton);
    row.append(details, actions);
    selectedDateEntries.append(row);
  });
}

function renderBrowseDialog() {
  renderCalendar();
  renderSelectedDateEntries();
}

function openEntryView(entry) {
  if (window.piedejour) {
    window.piedejour.openEntryView(entry.id);
    return;
  }

  const viewWindow = window.open("", "_blank", "width=680,height=720");
  if (!viewWindow) return;

  const title = getEntryTitle(entry);
  viewWindow.document.title = title;
  viewWindow.document.body.innerHTML = "";

  const heading = viewWindow.document.createElement("h1");
  heading.textContent = title;

  const date = viewWindow.document.createElement("p");
  date.textContent = formatReadableDate(entry.date);

  const body = viewWindow.document.createElement("article");
  body.style.whiteSpace = "pre-wrap";
  body.textContent = entry.body || "";

  viewWindow.document.body.append(heading, date, body);
}

entryBody.addEventListener("input", queueSave);
entryBody.addEventListener("click", updateStatusBar);
entryBody.addEventListener("keyup", updateStatusBar);
entryBody.addEventListener("select", updateStatusBar);
editorWrap.addEventListener("click", (event) => {
  if (event.target === editorWrap || event.target === wrapGuide) {
    entryBody.focus();
  }
});

function openBrowseDialog() {
  if (optionsDialog.open) {
    optionsDialog.close();
  }

  browseMonth = selectedBrowseDate
    ? new Date(`${selectedBrowseDate}T00:00:00`)
    : new Date(`${todayKey}T00:00:00`);
  selectedBrowseDate = selectedBrowseDate || todayKey;
  renderBrowseDialog();
  browseDialog.showModal();
}

function toggleOptionsDialog() {
  if (todayDialog.open) return;

  if (optionsDialog.open) {
    optionsDialog.close();
    entryBody.focus();
    return;
  }

  optionsDialog.showModal();
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    event.preventDefault();
    if (settingsDialog.open) {
      settingsDialog.close();
      entryBody.focus();
      return;
    }

    if (browseDialog.open) {
      browseDialog.close();
      entryBody.focus();
      return;
    }

    toggleOptionsDialog();
    return;
  }

  if (!(event.metaKey || event.ctrlKey)) return;
  const key = event.key.toLowerCase();
  if (key === "n") {
    event.preventDefault();
    startNewEntry();
  }

  if (key === "b") {
    event.preventDefault();
    openBrowseDialog();
  }
});

optionNewEntryButton.addEventListener("click", () => {
  optionsDialog.close();
  startNewEntry();
});

optionBrowseButton.addEventListener("click", openBrowseDialog);

optionSettingsButton.addEventListener("click", () => {
  optionsDialog.close();
  settingsDialog.showModal();
});

closeSettingsButton.addEventListener("click", () => {
  settingsDialog.close();
  entryBody.focus();
});

fontSizeInput.addEventListener("input", () => {
  settings.fontSize = Number(fontSizeInput.value);
  queueSettingsSave();
});

textColorInput.addEventListener("input", () => {
  settings.textColor = textColorInput.value;
  queueSettingsSave();
});

backgroundColorInput.addEventListener("input", () => {
  settings.backgroundColor = backgroundColorInput.value;
  queueSettingsSave();
});

wordWrapEnabledInput.addEventListener("change", () => {
  settings.wordWrapEnabled = wordWrapEnabledInput.checked;
  queueSettingsSave();
});

wrapGuideColumnInput.addEventListener("input", () => {
  settings.wrapGuideColumn = Number(wrapGuideColumnInput.value);
  settings = normalizeSettings(settings);
  queueSettingsSave();
});

wrapGuideVisibleInput.addEventListener("change", () => {
  settings.wrapGuideVisible = wrapGuideVisibleInput.checked;
  queueSettingsSave();
});

closeBrowseButton.addEventListener("click", () => browseDialog.close());

previousMonthButton.addEventListener("click", () => {
  browseMonth = new Date(browseMonth.getFullYear(), browseMonth.getMonth() - 1, 1);
  renderBrowseDialog();
});

nextMonthButton.addEventListener("click", () => {
  browseMonth = new Date(browseMonth.getFullYear(), browseMonth.getMonth() + 1, 1);
  renderBrowseDialog();
});

calendarGrid.addEventListener("click", (event) => {
  const button = event.target.closest(".calendar-day");
  if (!button) return;

  selectedBrowseDate = button.dataset.date;
  browseMonth = new Date(`${selectedBrowseDate}T00:00:00`);
  renderBrowseDialog();
});

selectedDateEntries.addEventListener("click", (event) => {
  const actionButton = event.target.closest("button[data-action]");
  if (!actionButton) return;

  const entry = entries.find((item) => item.id === actionButton.dataset.entryId);
  if (!entry) return;

  if (actionButton.dataset.action === "view") {
    openEntryView(entry);
    return;
  }

  browseDialog.close();
  setActiveEntry(entry);
});

continueTodayButton.addEventListener("click", () => {
  const [latestTodayEntry] = getTodayEntries();
  if (latestTodayEntry) {
    setActiveEntry(latestTodayEntry);
  }
  todayDialog.close();
});

startFreshButton.addEventListener("click", () => {
  startNewEntry();
  todayDialog.close();
});

async function initializeApp() {
  settings = await loadSettings();
  applySettings();
  entries = await loadEntries();
  const [latestTodayEntry] = getTodayEntries();

  if (latestTodayEntry) {
    setActiveEntry(latestTodayEntry);
    openTodayChoice();
  } else {
    await startNewEntry();
  }
}

initializeApp();
