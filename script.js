/* EUROPEAN SATFEED PREMIUM — CATALOGUE */
"use strict";

const SUPABASE_URL = "https://afipejmgjkigcbohsxkt.supabase.co";
const SUPABASE_KEY = "sb_publishable_MWi4yR-uw_TfrXJJrKdS1Q_783VTF6Z";

const GITHUB_COVERS_URL =
  "https://api.github.com/repos/brayubaud-blip/european-satfeed-premium/contents/covers?ref=main";

let language = "fr";
let activeFilter = "all";
let catalogueItems = [];
let loadingCatalogue = false;

const grid = document.getElementById("archiveGrid");
const filtersContainer = document.getElementById("filters");
let status = document.getElementById("archiveStatus");

if (!status && grid) {
  status = document.createElement("p");
  status.id = "archiveStatus";
  status.className = "archive-status";
  grid.after(status);
}

const categories = [
  { id: "all", fr: "ALL", en: "ALL" },
  { id: "comps", fr: "COMPS", en: "COMPS" },
  { id: "folders", fr: "FOLDERS", en: "FOLDERS" },
  { id: "old", fr: "OLD", en: "OLD" },
  { id: "edits", fr: "EDITS", en: "EDITS" },
  { id: "collections", fr: "COLLECTIONS", en: "COLLECTIONS" },
  { id: "clubs", fr: "CLUBS", en: "CLUBS" },
  { id: "national teams", fr: "NATIONAL TEAMS", en: "NATIONAL TEAMS" }
];

const translations = {
  fr: {
    loading: "Chargement du catalogue…",
    loaded: "{n} contenu(s) disponible(s).",
    empty: "Aucun contenu disponible dans cette catégorie.",
    error: "Impossible de charger le catalogue.",
    footballArchive: "FOOTBALL ARCHIVE"
  },
  en: {
    loading: "Loading catalogue…",
    loaded: "{n} item(s) available.",
    empty: "No content available in this category.",
    error: "Unable to load the catalogue.",
    footballArchive: "FOOTBALL ARCHIVE"
  }
};

function tr(key) {
  return translations[language][key] || key;
}

function updateStatus(text) {
  if (status) status.textContent = text;
}

function normalizeCategory(category) {
  const value = String(category || "").trim().toLowerCase();
  return value === "clips" ? "edits" : value;
}

function getLocalized(value) {
  if (typeof value === "string") return value;
  return value?.[language] || value?.fr || value?.en || "";
}

function renderFilters() {
  if (!filtersContainer) return;

  filtersContainer.replaceChildren();

  categories.forEach(category => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "filter";
    button.dataset.filter = category.id;
    button.textContent = category[language];

    if (category.id === activeFilter) button.classList.add("active");

    button.addEventListener("click", () => {
      activeFilter = category.id;
      renderFilters();
      renderCards();
    });

    filtersContainer.append(button);
  });
}

function renderCards() {
  if (!grid) return;

  grid.replaceChildren();

  const items = catalogueItems.filter(item =>
    activeFilter === "all" ||
    normalizeCategory(item.category) === activeFilter
  );

  if (!items.length) {
    updateStatus(tr("empty"));
    return;
  }

  items.forEach(item => {
    const card = document.createElement("article");
    card.className = "archive-card";
    card.dataset.catalogueId = String(item.id ?? "");
    card.dataset.catalogueSource = item.source || "supabase";

    const cover = document.createElement("div");
    cover.className = "cover";

    const img = document.createElement("img");
    img.src = item.image_url || item.image || "";
    img.alt = getLocalized(item.title) || "Football archive";
    img.loading = "lazy";
    img.dataset.catalogueImage = String(item.id ?? "");

    img.onerror = () => {
      img.style.display = "none";
      cover.classList.add("image-error");
    };

    const tag = document.createElement("span");
    tag.className = "card-tag";
    tag.textContent = normalizeCategory(item.category || "archive").toUpperCase();

    cover.append(img, tag);

    const info = document.createElement("div");
    info.className = "card-info";

    const meta = document.createElement("div");
    meta.className = "card-meta";

    const type = document.createElement("span");
    type.textContent = tr("footballArchive");
    meta.append(type);

    const title = document.createElement("h3");
    title.className = "catalogue-title";
    title.textContent = getLocalized(item.title) || "Untitled";

    const description = document.createElement("p");
    description.className = "catalogue-description";
    description.textContent = getLocalized(item.description);

    info.append(meta, title, description);
    card.append(cover, info);
    grid.append(card);
  });

  updateStatus(tr("loaded").replace("{n}", String(items.length)));
}

async function loadSupabaseCatalogue() {
  const url =
    `${SUPABASE_URL}/rest/v1/catalogue` +
    "?select=id,title,description,category,image_url,published,position" +
    "&published=eq.true&order=position.asc";

  const response = await fetch(url, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Supabase catalogue error: " + response.status);
  }

  return response.json();
}

async function loadGitHubCovers() {
  const response = await fetch(GITHUB_COVERS_URL, {
    headers: { Accept: "application/vnd.github+json" },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("GitHub covers error: " + response.status);
  }

  const files = await response.json();

  if (!Array.isArray(files)) return [];

  return files
    .filter(file =>
      file.type === "file" &&
      /\.(jpg|jpeg|png|webp|gif)$/i.test(file.name)
    )
    .sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { numeric: true })
    )
    .map((file, index) => {
      const number =
        (file.name.match(/photo_(\d+)/i) || [])[1] || index + 1;

      return {
        id: "github-" + file.name,
        source: "github",
        title: {
          fr: "COVER " + number,
          en: "COVER " + number
        },
        description: { fr: "", en: "" },
        category: "unclassified",
        image_url: file.download_url,
        published: true,
        position: index,
        github_file: file.name
      };
    });
}

async function loadCatalogue() {
  if (loadingCatalogue) return catalogueItems;

  loadingCatalogue = true;
  updateStatus(tr("loading"));

  try {
    const results = await Promise.allSettled([
      loadSupabaseCatalogue(),
      loadGitHubCovers()
    ]);

    const supabaseItems =
      results[0].status === "fulfilled" ? results[0].value : [];

    const githubItems =
      results[1].status === "fulfilled" ? results[1].value : [];

    if (results[0].status === "rejected") {
      console.error("Supabase:", results[0].reason);
    }

    if (results[1].status === "rejected") {
      console.error("GitHub:", results[1].reason);
    }

    const existingImageUrls = new Set(
      supabaseItems.map(item => item.image_url).filter(Boolean)
    );

    catalogueItems = [
      ...supabaseItems.map(item => ({
        ...item,
        source: "supabase",
        category: normalizeCategory(item.category)
      })),
      ...githubItems.filter(item =>
        !existingImageUrls.has(item.image_url)
      )
    ];

    renderFilters();
    renderCards();

    if (!catalogueItems.length) {
      updateStatus(tr("error"));
    }

    return catalogueItems;
  } finally {
    loadingCatalogue = false;
  }
}

function setLanguage(lang) {
  if (!["fr", "en"].includes(lang)) return;

  language = lang;
  document.documentElement.lang = lang;

  document.querySelectorAll("[data-i18n]").forEach(element => {
    const value = translations[lang][element.dataset.i18n];
    if (value) element.textContent = value;
  });

  const toggle = document.getElementById("langToggle");

  if (toggle) {
    toggle.innerHTML = lang === "fr"
      ? "FR <span>/</span> EN"
      : "EN <span>/</span> FR";
  }

  renderFilters();
  renderCards();
}

const langToggle = document.getElementById("langToggle");

if (langToggle) {
  langToggle.addEventListener("click", () => {
    setLanguage(language === "fr" ? "en" : "fr");
  });
}

const menuToggle = document.getElementById("menuToggle");
const nav = document.getElementById("nav");

if (menuToggle && nav) {
  menuToggle.addEventListener("click", () => {
    nav.classList.toggle("open");
  });

  nav.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => nav.classList.remove("open"));
  });
}

window.ESP_CATALOGUE = {
  refresh: loadCatalogue,
  getItems: () => catalogueItems,
  getCategories: () => categories.filter(category => category.id !== "all"),
  setLanguage,
  getLanguage: () => language
};

renderFilters();
loadCatalogue().catch(error => {
  console.error(error);
  updateStatus(tr("error"));
});
