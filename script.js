/* EUROPEAN SATFEED PREMIUM — PUBLIC SITE */
"use strict";

(() => {
  const SUPABASE_URL = "https://afipejmgjkigcbohsxkt.supabase.co";
  const SUPABASE_KEY = "sb_publishable_MWi4yR-uw_TfrXJJrKdS1Q_783VTF6Z";

  const GITHUB_COVERS_URL =
    "https://api.github.com/repos/brayubaud-blip/european-satfeed-premium/contents/covers?ref=main";

  const $ = (selector, root = document) => root.querySelector(selector);

  let language = document.documentElement.lang === "en" ? "en" : "fr";
  let activeFilter = "all";
  let catalogueItems = [];
  let loadingPromise = null;

  const grid = $("#archiveGrid");
  const filtersContainer = $("#filters");
  const searchInput = $("#catalogueSearch");
  const teamSelect = $("#teamFilter");
  const seasonSelect = $("#seasonFilter");
  const creatorSelect = $("#creatorFilter");
  const teamOf = item => item.team || item.club || item.team_name || "";
  const seasonOf = item => item.season || item.year || "";
  const creatorOf = item => item.creator || item.author || "";

  const categories = [
    { id: "all", fr: "TOUT", en: "ALL" },
    { id: "comps", fr: "COMPS", en: "COMPS" },
    { id: "folders", fr: "FOLDERS", en: "FOLDERS" },
    { id: "old", fr: "OLD", en: "OLD" },
    { id: "edits", fr: "EDITS", en: "EDITS" },
    { id: "collections", fr: "COLLECTIONS", en: "COLLECTIONS" }
  ];

  const translations = {
    fr: {
      topline: "FOOTBALL CULTURE. ARCHIVÉE.",
      navArchive: "Archive",
      navLatest: "Derniers drops",
      navIncluded: "Contenu",
      navPremium: "Premium",
      navFaq: "FAQ",
      join: "REJOINDRE PREMIUM ↗",
      eyebrow: "L'ARCHIVE FOOTBALL",
      heroCopy: "Une archive dédiée à la culture football : images, clips, edits et ressources soigneusement sélectionnés.",
      explore: "EXPLORER L'ARCHIVE",
      preview: "APERÇU GRATUIT ↗",
      heroMeta: "UNE NOUVELLE FAÇON DE COLLECTIONNER LE FOOTBALL",
      archiveEyebrow: "EXPLORER LA COLLECTION",
      archiveTitle: "L'ARCHIVE.",
      archiveDesc: "Un aperçu des collections disponibles. Les fichiers complets sont réservés aux membres Premium.",
      archiveFoot: "DE NOUVELLES COLLECTIONS SONT AJOUTÉES RÉGULIÈREMENT.",
      latestEyebrow: "NOUVEAUTÉS DE L'ARCHIVE",
      latestTitle: "DERNIERS<br><span>DROPS.</span>",
      latestDesc: "Les nouveautés, les sélections récentes et les prochains ajouts. Reste connecté pour ne rien manquer.",
      followTelegram: "SUIVRE LE CANAL TELEGRAM ↗",
      dropText: "NOUVEAU CONTENU. MÊME PASSION.",
      updating: "MIS À JOUR RÉGULIÈREMENT",
      includedEyebrow: "L'EXPÉRIENCE PREMIUM",
      includedTitle: "QU'Y A-T-IL<br>DANS LE PACK ?",
      includedDesc: "Tout ce qu'il faut pour nourrir ta créativité et suivre la culture football.",
      feature1Title: "DOSSIERS HAUTE QUALITÉ",
      feature1Desc: "Des dossiers organisés avec des images et ressources en haute qualité.",
      feature2Title: "CLIPS VIRAUX",
      feature2Desc: "Des clips football sélectionnés pour tes montages et tes idées.",
      feature3Title: "COMP DROPS RAPIDES",
      feature3Desc: "De nouvelles sélections et compilations publiées régulièrement.",
      feature4Title: "DEMANDES & PLUS",
      feature4Desc: "Possibilité de proposer des demandes et de découvrir d'autres contenus.",
      premiumEyebrow: "TON ACCÈS COMMENCE ICI",
      premiumDesc: "Accède au contenu complet de EUROPEAN SATFEED PREMIUM et rejoins la communauté.",
      oneTime: "/ ACCÈS",
      getAccess: "OBTENIR L'ACCÈS PREMIUM",
      secureNote: "Paiement via Payhip. Après l'achat, suis les instructions pour obtenir ton accès privé.",
      faqEyebrow: "BON À SAVOIR",
      faqDesc: "Les réponses aux questions les plus fréquentes.",
      q1: "Que comprend l'accès Premium ?",
      a1: "L'accès aux dossiers et contenus complets proposés dans le canal privé, selon les publications disponibles.",
      q2: "Comment obtenir l'accès après le paiement ?",
      a2: "Effectue ton achat via Payhip, puis suis les instructions indiquées après le paiement. En cas de problème, contacte le support Telegram.",
      q3: "Le contenu est-il gratuit ?",
      a3: "Les aperçus sont publics. Les dossiers et contenus complets sont réservés aux membres Premium.",
      q4: "Comment contacter le support ?",
      a4: "Tu peux contacter le support sur Telegram : @Njr_edit_10.",
      footerLine: "LA CULTURE FOOTBALL, COLLECTIONNÉE.",
      loading: "Chargement du catalogue…",
      empty: "Aucun contenu disponible dans cette catégorie.",
      error: "Impossible de charger le catalogue.", browseCategories: "CATÉGORIES", searchPlaceholder: "Rechercher dans l’archive...", allTeams: "Toutes les équipes", allSeasons: "Toutes les saisons", allCreators: "Tous les créateurs", noResults: "Aucun résultat pour cette recherche."
    },
    en: {
      topline: "FOOTBALL CULTURE. ARCHIVED.",
      navArchive: "Archive",
      navLatest: "Latest drops",
      navIncluded: "What's inside",
      navPremium: "Premium",
      navFaq: "FAQ",
      join: "JOIN PREMIUM ↗",
      eyebrow: "THE FOOTBALL ARCHIVE",
      heroCopy: "An archive dedicated to football culture: carefully selected images, clips, edits and resources.",
      explore: "EXPLORE THE ARCHIVE",
      preview: "FREE PREVIEW ↗",
      heroMeta: "A NEW WAY TO COLLECT FOOTBALL",
      archiveEyebrow: "EXPLORE THE COLLECTION",
      archiveTitle: "THE ARCHIVE.",
      archiveDesc: "A preview of available collections. Full files are reserved for Premium members.",
      archiveFoot: "MORE COLLECTIONS ARE ADDED REGULARLY.",
      latestEyebrow: "FRESH FROM THE ARCHIVE",
      latestTitle: "LATEST<br><span>DROPS.</span>",
      latestDesc: "New content, recent selections and upcoming additions. Stay connected.",
      followTelegram: "FOLLOW THE TELEGRAM CHANNEL ↗",
      dropText: "NEW CONTENT. SAME PASSION.",
      updating: "REGULARLY UPDATED",
      includedEyebrow: "THE PREMIUM EXPERIENCE",
      includedTitle: "WHAT'S<br>INSIDE?",
      includedDesc: "Everything you need to fuel your creativity and follow football culture.",
      feature1Title: "HIGH-QUALITY FOLDERS",
      feature1Desc: "Organized folders with high-quality images and resources.",
      feature2Title: "VIRAL CLIPS",
      feature2Desc: "Selected football clips for your edits and ideas.",
      feature3Title: "FAST COMP DROPS",
      feature3Desc: "New selections and compilations published regularly.",
      feature4Title: "REQUESTS & MORE",
      feature4Desc: "Suggest requests and discover more content.",
      premiumEyebrow: "YOUR ACCESS STARTS HERE",
      premiumDesc: "Access the full EUROPEAN SATFEED PREMIUM content and join the community.",
      oneTime: "/ ACCESS",
      getAccess: "GET PREMIUM ACCESS",
      secureNote: "Payment via Payhip. After purchase, follow the instructions to get your private access.",
      faqEyebrow: "GOOD TO KNOW",
      faqDesc: "Answers to frequently asked questions.",
      q1: "What is included in Premium access?",
      a1: "Access to the full folders and content shared in the private channel, depending on available posts.",
      q2: "How do I get access after payment?",
      a2: "Purchase through Payhip and follow the instructions after payment. Contact Telegram support if you need help.",
      q3: "Is the content free?",
      a3: "Previews are public. Full folders and content are reserved for Premium members.",
      q4: "How can I contact support?",
      a4: "You can contact support on Telegram: @Njr_edit_10.",
      footerLine: "FOOTBALL CULTURE, COLLECTED.",
      loading: "Loading catalogue…",
      empty: "No content available in this category.",
      error: "Unable to load the catalogue.", browseCategories: "CATEGORIES", searchPlaceholder: "Search the archive...", allTeams: "All teams", allSeasons: "All seasons", allCreators: "All creators", noResults: "No results for this search."
    }
  };

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;",
      '"': "&quot;", "'": "&#39;"
    })[char]);
  }

  function normalizeCategory(value) {
    const category = String(value || "unclassified")
      .trim().toLowerCase();

    if (category === "clips") return "edits";
    if (category === "national") return "national teams";
    return category;
  }

  function localized(value) {
    if (typeof value === "string") return value;
    return value?.[language] || value?.fr || value?.en || "";
  }

  function t(key) {
    return translations[language]?.[key] ?? translations.fr[key] ?? key;
  }

  function updateTranslations() {
    document.querySelectorAll("[data-i18n]").forEach(element => {
      const key = element.dataset.i18n;
      const value = t(key);
      if (value) element.innerHTML = value;
    });

    const toggle = $("#langToggle");
    if (toggle) {
      toggle.innerHTML = language === "fr"
        ? "FR <span>/</span> EN"
        : "EN <span>/</span> FR";
    }
  }

  function updateStatus(message) {
    let status = $("#archiveStatus");

    if (!status && grid) {
      status = document.createElement("p");
      status.id = "archiveStatus";
      status.className = "archive-status";
      grid.after(status);
    }

    if (status) status.textContent = message;
  }

  function renderFilters() {
    if (!filtersContainer) return;
    filtersContainer.replaceChildren();
    categories.forEach(category => {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'filter'; button.dataset.filter = category.id;
      const count = catalogueItems.filter(item => item.published !== false && (category.id === 'all' || normalizeCategory(item.category) === category.id)).length;
      button.innerHTML = '<span>' + category[language] + '</span><small>' + count + '</small>';
      if (category.id === activeFilter) button.classList.add('active');
      button.addEventListener('click', () => { activeFilter = category.id; renderFilters(); renderCards(); });
      filtersContainer.append(button);
    });
  }
  function fillSelect(select, values, label) {
    if (!select) return;
    const previous = select.value;
    select.replaceChildren(new Option(label, ''));
    [...new Set(values.map(value => String(value || '').trim()).filter(Boolean))].sort((x,y) => x.localeCompare(y, undefined, {numeric:true})).forEach(value => select.add(new Option(value, value)));
    if ([...select.options].some(option => option.value === previous)) select.value = previous;
  }
  function refreshCatalogueControls() {
    fillSelect(teamSelect, catalogueItems.map(teamOf), t('allTeams'));
    fillSelect(seasonSelect, catalogueItems.map(seasonOf), t('allSeasons'));
    fillSelect(creatorSelect, catalogueItems.map(creatorOf), t('allCreators'));
    renderFilters();
  }

  function renderCards() {
    if (!grid) return;

    grid.replaceChildren();

    const query = (searchInput && searchInput.value || '').trim().toLocaleLowerCase();
    const selectedTeam = teamSelect && teamSelect.value || '';
    const selectedSeason = seasonSelect && seasonSelect.value || '';
    const selectedCreator = creatorSelect && creatorSelect.value || '';
    const visible = catalogueItems.filter(item => {
      if (item.published === false) return false;
      const category = normalizeCategory(item.category);
      if (['clubs', 'national teams', 'national'].includes(category)) return false;
      if (activeFilter !== 'all' && category !== activeFilter) return false;
      if (selectedTeam && teamOf(item) !== selectedTeam) return false;
      if (selectedSeason && String(seasonOf(item)) !== selectedSeason) return false;
      if (selectedCreator && creatorOf(item) !== selectedCreator) return false;
      const haystack = [localized(item.title), localized(item.description), category, teamOf(item), seasonOf(item), creatorOf(item)].join(' ').toLocaleLowerCase();
      return !query || haystack.includes(query);
    });

    if (!visible.length) {
      updateStatus(query || selectedTeam || selectedSeason || selectedCreator ? t('noResults') : t('empty'));
      return;
    }

    visible.forEach(item => {
      const card = document.createElement("article");
      card.className = "archive-card";
      card.dataset.catalogueId = String(item.id);
      card.dataset.catalogueSource = item.source || "supabase";

      const cover = document.createElement("div");
      cover.className = "cover";

      const img = document.createElement("img");
      img.src = item.image_url || item.image || "";
      img.alt = localized(item.title) || "Football archive";
      img.loading = "lazy";

      img.addEventListener("error", () => {
        img.style.display = "none";
        cover.classList.add("image-error");
      });

      const tag = document.createElement("span");
      tag.className = "card-tag";
      tag.textContent = normalizeCategory(item.category)
        .replace("national teams", "archive")
        .toUpperCase();

      cover.append(img, tag);

      const info = document.createElement("div");
      info.className = "card-info";

      const meta = document.createElement("div");
      meta.className = "card-meta";
      meta.textContent = language === "fr"
        ? "ARCHIVE FOOTBALL"
        : "FOOTBALL ARCHIVE";

      const title = document.createElement("h3");
      title.className = "catalogue-title";
      title.textContent = localized(item.title) || "Untitled";

      const description = document.createElement("p");
      description.className = "catalogue-description";
      description.textContent = localized(item.description);

      info.append(meta, title, description);
      card.append(cover, info);
      grid.append(card);
    });

    updateStatus(
      language === "fr"
        ? `${visible.length} contenu(s) disponible(s).`
        : `${visible.length} item(s) available.`
    );
  }

  async function loadSupabaseCatalogue() {
    const query = new URL(`${SUPABASE_URL}/rest/v1/catalogue`);

    query.searchParams.set(
      "select",
      "id,title,description,category,image_url,published,position"
    );
    query.searchParams.set("published", "eq.true");
    query.searchParams.set("order", "position.asc");

    const response = await fetch(query, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      },
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`Supabase catalogue: ${response.status}`);
    }

    return response.json();
  }

  async function loadGitHubCovers() {
    const response = await fetch(GITHUB_COVERS_URL, {
      headers: { Accept: "application/vnd.github+json" },
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`GitHub covers: ${response.status}`);
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
          id: `github-${file.name}`,
          source: "github",
          title: {
            fr: `COVER ${number}`,
            en: `COVER ${number}`
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
    if (loadingPromise) return loadingPromise;

    loadingPromise = (async () => {
      updateStatus(t("loading"));

      const results = await Promise.allSettled([
        loadSupabaseCatalogue(),
        loadGitHubCovers()
      ]);

      const supabaseItems =
        results[0].status === "fulfilled" ? results[0].value : [];

      const githubItems =
        results[1].status === "fulfilled" ? results[1].value : [];

      results.forEach((result, index) => {
        if (result.status === "rejected") {
          console.error(
            index === 0 ? "Supabase error:" : "GitHub error:",
            result.reason
          );
        }
      });

      const knownUrls = new Set(
        supabaseItems.map(item => item.image_url).filter(Boolean)
      );

      catalogueItems = [
        ...supabaseItems.map(item => ({
          ...item,
          source: "supabase",
          category: normalizeCategory(item.category)
        })),
        ...githubItems.filter(item => !knownUrls.has(item.image_url))
      ];

      catalogueItems.sort((a, b) =>
        Number(a.position || 0) - Number(b.position || 0)
      );

      window.catalogue = catalogueItems;

      refreshCatalogueControls();
      renderCards();

      if (!catalogueItems.length) updateStatus(t("error"));

      return catalogueItems;
    })();

    try {
      return await loadingPromise;
    } finally {
      loadingPromise = null;
    }
  }

  function setLanguage(nextLanguage) {
    if (!["fr", "en"].includes(nextLanguage)) return;

    language = nextLanguage;
    document.documentElement.lang = language;
    updateTranslations();
    refreshCatalogueControls();
    renderCards();
  }

  [searchInput, teamSelect, seasonSelect, creatorSelect].forEach(control => control && control.addEventListener('input', renderCards));
  [teamSelect, seasonSelect, creatorSelect].forEach(control => control && control.addEventListener('change', renderCards));

  $("#langToggle")?.addEventListener("click", () => {
    setLanguage(language === "fr" ? "en" : "fr");
  });

  const menuToggle = $("#menuToggle");
  const nav = $("#nav");

  menuToggle?.addEventListener("click", () => {
    nav?.classList.toggle("open");
  });

  nav?.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => nav.classList.remove("open"));
  });

  window.ESP_CATALOGUE = {
    refresh: loadCatalogue,
    getItems: () => catalogueItems.slice(),
    getCategories: () => categories.filter(item => item.id !== "all"),
    setLanguage,
    getLanguage: () => language,
    render: renderCards
  };

  updateTranslations();
  renderFilters();

  loadCatalogue().catch(error => {
    console.error(error);
    updateStatus(t("error"));
  });
})();
