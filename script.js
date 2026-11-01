
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
  { id: "all", fr: "TOUT", en: "ALL" },
  { id: "comps", fr: "COMPS", en: "COMPS" },
  { id: "folders", fr: "DOSSIERS", en: "FOLDERS" },
  { id: "old", fr: "ANCIENS", en: "OLD" },
  { id: "edits", fr: "EDITS", en: "EDITS" },
  { id: "clips", fr: "CLIPS", en: "CLIPS" },
  { id: "collections", fr: "COLLECTIONS", en: "COLLECTIONS" }
];

const translations = {
  fr: {
    loading: "Chargement du catalogue…",
    loaded: "{n} contenu(s) disponible(s).",
    empty: "Aucun contenu disponible pour cette catégorie.",
    error: "Impossible de charger le catalogue.",
    archiveLabel: "ARCHIVE",
    footballArchive: "ARCHIVE FOOTBALL"
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

function updateStatus(text, type = "") {
  if (!status) return;
  status.textContent = text;
  status.className = "archive-status " + type;
}

function renderFilters() {
  if (!filtersContainer) return;

  filtersContainer.replaceChildren();

  categories.forEach(category => {
    const button = document.createElement("button");
    button.className = "filter";
    button.dataset.filter = category.id;
    button.textContent = language === "fr" ? category.fr : category.en;

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
    return activeFilter === "all" || item.category === activeFilter;
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
    img.alt = item.title?.[language] || item.title?.fr || "Football archive";
    img.loading = "lazy";

    const tag = document.createElement("span");
    tag.className = "card-tag";
    tag.textContent = item.category
      ? item.category.toUpperCase()
      : tr("archiveLabel");

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
      "Untitled";

    const description = document.createElement("p");
    description.textContent =
      item.description?.[language] ||
      item.description?.fr ||
      item.description?.en ||
      "";

    info.append(meta, title, description);
    card.append(cover, info);
    grid.append(card);
  });

  updateStatus(
    tr("loaded").replace("{n}", items.length),
    "good"
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

async function loadOldGitHubCovers() {
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

  try {
    const supabaseItems = await loadSupabaseCatalogue();

    if (supabaseItems.length > 0) {
      catalogueItems = supabaseItems;
    } else {
      // Garde les anciennes covers visibles tant que
      // le catalogue Supabase ne contient aucun contenu publié.
      catalogueItems = await loadOldGitHubCovers();
    }

    activeFilter = "all";
    renderFilters();
    renderCards();

  } catch (error) {
    console.error("Catalogue loading error:", error);

    try {
      catalogueItems = await loadOldGitHubCovers();
      activeFilter = "all";
      renderFilters();
      renderCards();
    } catch (fallbackError) {
      console.error("Fallback loading error:", fallbackError);
      updateStatus(tr("error"), "bad");
    }
  }
}

function setLanguage(lang) {
  language = lang;
  document.documentElement.lang = lang;

  document.querySelectorAll("[data-i18n]").forEach(element => {
    const key = element.dataset.i18n;
    const value = translations[lang][key];

    // Ne touche pas aux textes dont la traduction
    // n'est pas encore configurée.
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
