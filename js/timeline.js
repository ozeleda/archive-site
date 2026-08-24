/* =========================================================
   ARCHIVE TIMELINE — rendering logic
   Loads data/entries.json, sorts chronologically, renders
   cards grouped by year, and wires up search / tag filters /
   lightbox.
   ========================================================= */

let ALL_ENTRIES = [];
let ACTIVE_TAG = null;

const timelineEl = document.getElementById("timeline");
const tagFiltersEl = document.getElementById("tagFilters");
const searchInput = document.getElementById("searchInput");
const lightbox = document.getElementById("lightbox");
const lightboxContent = document.getElementById("lightboxContent");
const lightboxClose = document.getElementById("lightboxClose");

init();

async function init() {
  try {
    const res = await fetch("data/entries.json");
    if (!res.ok) throw new Error("Could not load entries.json");
    ALL_ENTRIES = await res.json();
  } catch (err) {
    timelineEl.innerHTML = `<p class="empty-state">Could not load archive data.<br>If you're viewing this file directly from disk, run a local server instead (see README.md) — browsers block local JSON loads over file://.</p>`;
    console.error(err);
    return;
  }

  ALL_ENTRIES.sort((a, b) => new Date(a.date) - new Date(b.date));
  buildTagFilters();
  render();

  searchInput.addEventListener("input", render);
  lightboxClose.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeLightbox();
  });
}

function buildTagFilters() {
  const tags = new Set();
  ALL_ENTRIES.forEach((e) => (e.tags || []).forEach((t) => tags.add(t)));

  tagFiltersEl.innerHTML = "";
  [...tags].sort().forEach((tag) => {
    const btn = document.createElement("button");
    btn.className = "tag-chip";
    btn.textContent = tag;
    btn.addEventListener("click", () => {
      ACTIVE_TAG = ACTIVE_TAG === tag ? null : tag;
      buildTagFilters(); // refresh active state
      render();
    });
    if (tag === ACTIVE_TAG) btn.classList.add("active");
    tagFiltersEl.appendChild(btn);
  });
}

function render() {
  const query = searchInput.value.trim().toLowerCase();

  const filtered = ALL_ENTRIES.filter((e) => {
    const matchesQuery = !query || e.title.toLowerCase().includes(query);
    const matchesTag = !ACTIVE_TAG || (e.tags || []).includes(ACTIVE_TAG);
    return matchesQuery && matchesTag;
  });

  timelineEl.innerHTML = "";

  if (filtered.length === 0) {
    timelineEl.innerHTML = `<p class="empty-state">No entries match. Try a different search or clear the tag filter.</p>`;
    return;
  }

  let lastYear = null;
  filtered.forEach((entry, i) => {
    const year = new Date(entry.date).getFullYear();
    if (year !== lastYear) {
      const marker = document.createElement("div");
      marker.className = "year-marker";
      marker.innerHTML = `<span>${year}</span>`;
      timelineEl.appendChild(marker);
      lastYear = year;
    }
    timelineEl.appendChild(buildEntryCard(entry, i));
  });
}

function buildEntryCard(entry, index) {
  const wrapper = document.createElement("article");
  wrapper.className = "entry";
  wrapper.style.animationDelay = `${Math.min(index * 0.04, 0.6)}s`;

  const accession = accessionNumber(entry, index);
  const dateLabel = formatDate(entry.date);
  const tagsHtml = (entry.tags || [])
    .map((t) => `<span>${escapeHtml(t)}</span>`)
    .join("");

  const mediaHtml =
    entry.mediaType === "video"
      ? `<button class="entry-media" data-id="${entry.id}" aria-label="Play video: ${escapeHtml(entry.title)}">
           <img src="${entry.posterUrl || fallbackPoster()}" alt="" loading="lazy">
         </button>`
      : `<button class="entry-media" data-id="${entry.id}" aria-label="Open image: ${escapeHtml(entry.title)}">
           <img src="${entry.mediaUrl}" alt="${escapeHtml(entry.title)}" loading="lazy">
         </button>`;

  wrapper.innerHTML = `
    <div class="entry-card">
      <div class="entry-accession">
        <span>${accession}</span>
        <span>${entry.mediaType === "video" ? "▶ film" : "◆ image"}</span>
      </div>
      ${mediaHtml}
      <div class="entry-body">
        <span class="entry-date">${dateLabel}</span>
        <h2 class="entry-title">${escapeHtml(entry.title)}</h2>
        <p class="entry-description">${escapeHtml(entry.description || "")}</p>
        <div class="entry-tags">${tagsHtml}</div>
      </div>
    </div>
  `;

  wrapper.querySelector(".entry-media").addEventListener("click", () => openLightbox(entry));
  return wrapper;
}

function openLightbox(entry) {
  if (entry.mediaType === "video") {
    lightboxContent.innerHTML = `
      <iframe src="${entry.mediaUrl}" title="${escapeHtml(entry.title)}" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
      <p class="lightbox-caption">${escapeHtml(entry.title)} — ${formatDate(entry.date)}</p>
    `;
  } else {
    lightboxContent.innerHTML = `
      <img src="${entry.mediaUrl}" alt="${escapeHtml(entry.title)}">
      <p class="lightbox-caption">${escapeHtml(entry.title)} — ${formatDate(entry.date)}</p>
    `;
  }
  lightbox.classList.add("open");
}

function closeLightbox() {
  lightbox.classList.remove("open");
  lightboxContent.innerHTML = "";
}

/* ---------- helpers ---------- */

function accessionNumber(entry, index) {
  const year = new Date(entry.date).getFullYear();
  const seq = String(index + 1).padStart(3, "0");
  return `ARC.${year}.${seq}`;
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function fallbackPoster() {
  return "data:image/svg+xml;utf8," + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="100%" height="100%" fill="#d9d3bf"/></svg>`
  );
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
