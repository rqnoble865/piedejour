const viewTitle = document.querySelector("#viewTitle");
const viewDate = document.querySelector("#viewDate");
const viewBody = document.querySelector("#viewBody");

function formatReadableDate(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

function renderMissingEntry() {
  viewTitle.textContent = "Entry not found";
  viewDate.textContent = "";
  viewBody.textContent = "This entry could not be loaded.";
}

async function initializeView() {
  if (!window.piedejour) {
    renderMissingEntry();
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const entryId = params.get("entryId");

  if (!entryId) {
    renderMissingEntry();
    return;
  }

  const entry = await window.piedejour.readEntry(entryId);

  if (!entry) {
    renderMissingEntry();
    return;
  }

  viewTitle.textContent = entry.title || "Untitled entry";
  viewDate.textContent = formatReadableDate(entry.date);
  viewBody.textContent = entry.body || "";
  document.title = entry.title || "Journal Entry";
}

initializeView();
