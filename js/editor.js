/* =========================================================
   ARCHIVE EDITOR — client-side entry management.
   No backend: load a JSON file, edit in-browser, export
   an updated JSON file to replace data/entries.json.
   ========================================================= */

let entries = [];
let editingId = null;

const els = {
  loadBtn: document.getElementById("loadBtn"),
  fileInput: document.getElementById("fileInput"),
  exportBtn: document.getElementById("exportBtn"),
  newBtn: document.getElementById("newBtn"),
  status: document.getElementById("status"),
  form: document.getElementById("entryForm"),
  formTitle: document.getElementById("formTitle"),
  entryId: document.getElementById("entryId"),
  title: document.getElementById("fTitle"),
  date: document.getElementById("fDate"),
  description: document.getElementById("fDescription"),
  mediaType: document.getElementById("fMediaType"),
  tags: document.getElementById("fTags"),
  mediaUrl: document.getElementById("fMediaUrl"),
  posterField: document.getElementById("posterField"),
  posterUrl: document.getElementById("fPosterUrl"),
  cancelEditBtn: document.getElementById("cancelEditBtn"),
  tableBody: document.getElementById("entryTableBody"),
};

init();

async function init() {
  // Try to load the existing data/entries.json automatically (works when
  // served over http/https; will silently skip if blocked over file://).
  try {
    const res = await fetch("data/entries.json");
    if (res.ok) {
      entries = await res.json();
      setStatus(`Loaded ${entries.length} entries from data/entries.json`);
    }
  } catch (e) {
    /* fine — user can load manually */
  }
  renderTable();

  els.loadBtn.addEventListener("click", () => els.fileInput.click());
  els.fileInput.addEventListener("change", handleFileLoad);
  els.exportBtn.addEventListener("click", handleExport);
  els.newBtn.addEventListener("click", resetForm);
  els.cancelEditBtn.addEventListener("click", resetForm);
  els.mediaType.addEventListener("change", togglePosterField);
  els.form.addEventListener("submit", handleSave);
  togglePosterField();
}

function handleFileLoad(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      entries = JSON.parse(reader.result);
      renderTable();
      setStatus(`Loaded ${entries.length} entries from ${file.name}`);
    } catch (err) {
      setStatus("Could not parse that file — is it valid JSON?");
    }
  };
  reader.readAsText(file);
}

function handleExport() {
  const blob = new Blob([JSON.stringify(entries, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "entries.json";
  a.click();
  URL.revokeObjectURL(url);
  setStatus(`Exported ${entries.length} entries. Replace data/entries.json with this file, then commit & push.`);
}

function togglePosterField() {
  els.posterField.style.display = els.mediaType.value === "video" ? "grid" : "none";
}

function handleSave(e) {
  e.preventDefault();

  const entry = {
    id: editingId || String(Date.now()),
    title: els.title.value.trim(),
    date: els.date.value,
    description: els.description.value.trim(),
    mediaType: els.mediaType.value,
    mediaUrl: els.mediaUrl.value.trim(),
    tags: els.tags.value.split(",").map((t) => t.trim()).filter(Boolean),
  };
  if (els.mediaType.value === "video" && els.posterUrl.value.trim()) {
    entry.posterUrl = els.posterUrl.value.trim();
  }

  if (editingId) {
    const idx = entries.findIndex((x) => x.id === editingId);
    if (idx > -1) entries[idx] = entry;
    setStatus(`Updated "${entry.title}". Remember to export when you're done.`);
  } else {
    entries.push(entry);
    setStatus(`Added "${entry.title}". Remember to export when you're done.`);
  }

  resetForm();
  renderTable();
}

function renderTable() {
  const sorted = [...entries].sort((a, b) => new Date(a.date) - new Date(b.date));
  els.tableBody.innerHTML = "";

  if (sorted.length === 0) {
    els.tableBody.innerHTML = `<tr><td colspan="5" class="hint" style="padding:1.5rem;">No entries yet — add one above.</td></tr>`;
    return;
  }

  sorted.forEach((entry) => {
    const tr = document.createElement("tr");
    tr.className = "row-actions";
    const thumbSrc =
      entry.mediaType === "video" ? entry.posterUrl || "" : entry.mediaUrl || "";
    tr.innerHTML = `
      <td>${thumbSrc ? `<img class="thumb" src="${thumbSrc}" alt="">` : `<div class="thumb"></div>`}</td>
      <td>${entry.date || "—"}</td>
      <td>${escapeHtml(entry.title)}</td>
      <td>${entry.mediaType}</td>
      <td>
        <button type="button" data-action="edit" data-id="${entry.id}">Edit</button>
        <button type="button" data-action="delete" data-id="${entry.id}">Delete</button>
      </td>
    `;
    els.tableBody.appendChild(tr);
  });

  els.tableBody.querySelectorAll('[data-action="edit"]').forEach((btn) =>
    btn.addEventListener("click", () => loadEntryIntoForm(btn.dataset.id))
  );
  els.tableBody.querySelectorAll('[data-action="delete"]').forEach((btn) =>
    btn.addEventListener("click", () => deleteEntry(btn.dataset.id))
  );
}

function loadEntryIntoForm(id) {
  const entry = entries.find((x) => x.id === id);
  if (!entry) return;
  editingId = id;
  els.formTitle.textContent = "Edit entry";
  els.entryId.value = id;
  els.title.value = entry.title || "";
  els.date.value = entry.date || "";
  els.description.value = entry.description || "";
  els.mediaType.value = entry.mediaType || "image";
  els.tags.value = (entry.tags || []).join(", ");
  els.mediaUrl.value = entry.mediaUrl || "";
  els.posterUrl.value = entry.posterUrl || "";
  els.cancelEditBtn.style.display = "inline-block";
  togglePosterField();
  els.form.scrollIntoView({ behavior: "smooth" });
}

function deleteEntry(id) {
  const entry = entries.find((x) => x.id === id);
  if (!entry) return;
  if (!confirm(`Delete "${entry.title}"? This can't be undone (until you reload without exporting).`)) return;
  entries = entries.filter((x) => x.id !== id);
  renderTable();
  setStatus(`Deleted "${entry.title}". Remember to export when you're done.`);
}

function resetForm() {
  editingId = null;
  els.form.reset();
  els.formTitle.textContent = "Add entry";
  els.cancelEditBtn.style.display = "none";
  togglePosterField();
}

function setStatus(msg) {
  els.status.textContent = msg;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
}
