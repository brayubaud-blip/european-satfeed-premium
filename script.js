
const translations = {
  fr: {
    loading: "Chargement des covers…",
    loaded: "{n} covers chargées.",
    empty: "Aucune cover disponible.",
    error: "Impossible de charger les covers.",
    imageTitle: "COVER {n}",
    archiveLabel: "ARCHIVE"
  },
  en: {
    loading: "Loading covers…",
    loaded: "{n} covers loaded.",
    empty: "No covers available.",
    error: "Unable to load covers.",
    imageTitle: "COVER {n}",
    archiveLabel: "ARCHIVE"
  }
};

let language = "fr";
let activeFilter = "all";

const grid = document.getElementById("archiveGrid");
const status = document.getElementById("archiveStatus");

function tr(key) {
  return translations[language][key] || key;
}

function renderCards(filter = activeFilter) {
  activeFilter = filter;

  const items = catalogue.filter(item =>
    filter === "all" || item.category === filter
  );

  if (!grid) return;

  grid.innerHTML = items.map(item => `
    <article class="archive-card">
      <div class="cover">
        <img src="${item.image}" alt="${item.title}" loading="lazy">
        <span class="card-tag">${item.label || tr("archiveLabel")}</span>
      </div>
      <div class="card-info">
        <div class="card-meta">
          <span>${item.type || "FOOTBALL ARCHIVE"}</span>
          <span>${item.season || ""}</span>
        </div>
        <h3>${item.title}</h3>
        <p>${item.description || ""}</p>
      </div>
    </article>
  `).join("");

  if (status) {
    status.textContent = items.length
      ? tr("loaded").replace("{n}", items.length)
      : tr("empty");
  }
}

function setLanguage(lang) {
  language = lang;
  document.documentElement.lang = lang;

  document.querySelectorAll("[data-i18n]").forEach(element => {
    const key = element.dataset.i18n;
    const value = translations[lang][key];
    if (value) element.innerHTML = value;
  });

  const toggle = document.getElementById("langToggle");
  if (toggle) {
    toggle.innerHTML = lang === "fr"
      ? "FR <span>/</span> EN"
      : "EN <span>/</span> FR";
  }

  renderCards();
}

const langToggle = document.getElementById("langToggle");

if (langToggle) {
  langToggle.addEventListener("click", () => {
    setLanguage(language === "fr" ? "en" : "fr");
  });
}

document.querySelectorAll(".filter").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".filter").forEach(item =>
      item.classList.remove("active")
    );

    button.classList.add("active");
    renderCards(button.dataset.filter);
  });
});

const menuToggle = document.getElementById("menuToggle");
const nav = document.getElementById("nav");

if (menuToggle && nav) {
  menuToggle.addEventListener("click", () => {
    nav.classList.toggle("open");
  });
}

if (nav) {
  nav.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => nav.classList.remove("open"));
  });
}

async function loadCovers() {
  if (status) status.textContent = tr("loading");

  try {
    const response = await fetch(
      "https://api.github.com/repos/brayubaud-blip/european-satfeed-premium/contents/covers?ref=main"
    );

    if (!response.ok) {
      throw new Error("GitHub API error: " + response.status);
    }

    const files = await response.json();

    const images = files
      .filter(file =>
        file.type === "file" &&
        /\.(jpg|jpeg|png|webp|gif)$/i.test(file.name)
      )
      .sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { numeric: true })
      );

    catalogue.length = 0;

    images.forEach((file, index) => {
      const number = (file.name.match(/photo_(\d+)/i) || [])[1] || (index + 1);

      catalogue.push({
        title: tr("imageTitle").replace("{n}", number),
        category: "unclassified",
        type: "FOOTBALL ARCHIVE",
        season: "",
        description: "",
        image: file.download_url,
        label: "ARCHIVE"
      });
    });

    renderCards("all");

  } catch (error) {
    console.error("Erreur de chargement des covers :", error);
    if (status) status.textContent = tr("error");
  }
}

loadCovers();
