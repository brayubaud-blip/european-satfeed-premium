
const SUPABASE_URL = "https://afipejmgjkigcbohsxkt.supabase.co";
const SUPABASE_KEY = "sb_publishable_MWi4yR-uw_TfrxJJrKdS1Q_783VTF6Z";

const GITHUB_COVERS_URL =
  "https://api.github.com/repos/brayubaud-blip/european-satfeed-premium/contents/covers?ref=main";

let language = "fr";
let activeFilter = "all";
let catalogueItems = [];

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
  { id: "collections", fr: "COLLECTIONS", en: "COLLECTIONS" }
];

const translations = {
  fr: {
    loading: "Chargement du catalogue…",
    loaded: "{n} contenu(s) disponible(s).",
    empty: "Aucun contenu disponible dans cette catégorie.",
    error: "Impossible de charger le catalogue.",
    archiveLabel: "ARCHIVE",
    footballArchive: "FOOTBALL ARCHIVE"
  },
  en: {
    loading: "Loading catalogue…",
    loaded: "{n} item(s) available.",
    empty: "No content available in this category.",
    error: "Unable to load the catalogue.",
    archiveLabel: "ARCHIVE",
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
  // Ancienne catégorie CLIPS : désormais intégrée à EDITS.
  return category === "clips" ? "edits" : category;
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

    if (category.id === activeFilter) {
      button.classList.add("active");
    }

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

  const items = catalogueItems.filter(item => {
    return activeFilter === "all" ||
      normalizeCategory(item.category) === activeFilter;
  });

  if (!items.length) {
    updateStatus(tr("empty"));
    return;
  }

  items.forEach(item => {
    const card = document.createElement("article");
    card.className = "archive-card";

    const cover = document.createElement("div");
    cover.className = "cover";

    const img = document.createElement("img");
    img.src = item.image_url || item.image || "";
    img.alt =
      item.title?.[language] ||
      item.title?.fr ||
      item.title ||
      "Football archive";
    img.loading = "lazy";

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
    title.textContent =
      item.title?.[language] ||
      item.title?.fr ||
      item.title?.en ||
      item.title ||
      "Untitled";

    const description = document.createElement("p");
    description.textContent =
      item.description?.[language] ||
      item.description?.fr ||
      item.description?.en ||
      item.description ||
      "";

    info.append(meta, title, description);
    card.append(cover, info);
    grid.append(card);
  });

  updateStatus(
    tr("loaded").replace("{n}", String(items.length))
  );
}

async function loadSupabaseCatalogue() {
  const url =
    `${SUPABASE_URL}/rest/v1/catalogue` +
    "?select=id,title,description,category,image_url,published,position" +
    "&published=eq.true" +
    "&order=position.asc";

  const response = await fetch(url, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`
    }
  });

  if (!response.ok) {
    throw new Error("Supabase error: " + response.status);
  }

  return await response.json();
}

async function loadGitHubCovers() {
  const response = await fetch(GITHUB_COVERS_URL);

  if (!response.ok) {
    throw new Error("GitHub error: " + response.status);
  }

  const files = await response.json();

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
        title: {
          fr: "COVER " + number,
          en: "COVER " + number
        },
        description: { fr: "", en: "" },
        category: "unclassified",
        image_url: file.download_url,
        published: true,
        position: index
      };
    });
}

async function loadCatalogue() {
  updateStatus(tr("loading"));

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

  // Les nouvelles covers Supabase sont affichées en premier.
  // Les anciennes covers GitHub restent visibles.
  catalogueItems = [
    ...supabaseItems.map(item => ({
      ...item,
      category: normalizeCategory(item.category)
    })),
    ...githubItems
  ];

  activeFilter = "all";
  renderFilters();
  renderCards();

  if (!catalogueItems.length) {
    updateStatus(tr("error"));
  }
}

function setLanguage(lang) {
  language = lang;
  document.documentElement.lang = lang;

  // Les éléments sans traduction configurée restent inchangés.
  document.querySelectorAll("[data-i18n]").forEach(element => {
    const key = element.dataset.i18n;
    const value = translations[lang][key];

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
}

if (nav) {
  nav.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      nav.classList.remove("open");
    });
  });
}

renderFilters();
loadCatalogue();
