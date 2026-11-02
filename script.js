/* EUROPEAN SATFEED PREMIUM — PUBLIC SITE */
"use strict";

(() => {
  const SUPABASE_URL = "https://afipejmgjkigcbohsxkt.supabase.co";
  const SUPABASE_KEY = "sb_publishable_MWi4yR-uw_TfrxJJrKdS1Q_783VTF6Z";

  const GITHUB_COVERS_URL =
    "https://api.github.com/repos/brayubaud-blip/european-satfeed-premium/contents/covers?ref=main";

  const $ = (selector, root = document) => root.querySelector(selector);

  let language = (() => {
    try {
      const saved = localStorage.getItem("esp-language");
      if (saved === "en" || saved === "fr") return saved;
    } catch (_) {}
    return document.documentElement.lang === "en" ? "en" : "fr";
  })();
  let activeFilter = "all";
  let catalogueItems = [];
  let loadingPromise = null;
  let viewerItems = [];
  let viewerIndex = 0;
  let lightbox = null;
  const FAVORITES_STORAGE_KEY = "esp-cover-favorites";
  let favoriteIds = (() => {
    try {
      const stored = JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) || "[]");
      return new Set(Array.isArray(stored) ? stored.map(String) : []);
    } catch (_) {
      return new Set();
    }
  })();

  function favoriteKey(item) {
    return String(item.source || "supabase") + ":" + String(item.id);
  }

  function saveFavoriteIds() {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify([...favoriteIds]));
      return true;
    } catch (error) {
      console.warn("Impossible d'enregistrer les favoris sur cet appareil :", error);
      return false;
    }
  }

  function favoriteLabel(isFavorite) {
    if (language === "fr") return isFavorite ? t("favorited") : t("favorite");
    return isFavorite ? t("favorited") : t("favorite");
  }

  function toggleFavorite(item, button) {
    const key = favoriteKey(item);
    if (favoriteIds.has(key)) favoriteIds.delete(key);
    else favoriteIds.add(key);

    if (!saveFavoriteIds()) {
      if (favoriteIds.has(key)) favoriteIds.delete(key);
      else favoriteIds.add(key);
      return;
    }

    const active = favoriteIds.has(key);
    button.classList.toggle("is-favorite", active);
    button.setAttribute("aria-pressed", String(active));
    button.setAttribute("aria-label", favoriteLabel(active));
    button.querySelector(".favorite-label").textContent = favoriteLabel(active);
    button.querySelector(".favorite-star").textContent = active ? "★" : "☆";
    if (!active && activeFilter === "favorites") {
      renderFilters();
      renderCards();
    } else {
      renderFilters();
    }
  }

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
      favorite: "Favoris",
      favorited: "Dans les favoris",
      addCoverAdmin: "+ AJOUTER UNE COVER",
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
      favorite: "Favorite",
      favorited: "Added to favorites",
      addCoverAdmin: "+ ADD A COVER",
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
    const filterCategories = [
      ...categories,
      { id: "favorites", fr: "FAVORIS", en: "FAVORITES" }
    ];
    filterCategories.forEach(category => {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'filter'; button.dataset.filter = category.id;
      const count = catalogueItems.filter(item => {
        const description = typeof item.description === "string" ? item.description : (item.description?.fr || "");
        if (description.startsWith("__GITHUB_SOURCE_HIDDEN__|")) return false;
        if (item.published === false) return false;
        if (category.id === "favorites") return favoriteIds.has(favoriteKey(item));
        return category.id === "all" || normalizeCategory(item.category) === category.id;
      }).length;
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


  function ensureLightbox() {
    if (lightbox) return lightbox;
    lightbox = document.createElement("div");
    lightbox.className = "cover-lightbox";
    lightbox.hidden = true;
    lightbox.innerHTML = `
      <button type="button" class="lightbox-close" aria-label="Close preview">×</button>
      <button type="button" class="lightbox-arrow lightbox-prev" aria-label="Previous cover">‹</button>
      <figure class="lightbox-figure">
        <img class="lightbox-image" alt="">
        <figcaption>
          <strong class="lightbox-title"></strong>
          <p class="lightbox-description"></p>
          <span class="lightbox-counter"></span>
        </figcaption>
      </figure>
      <button type="button" class="lightbox-arrow lightbox-next" aria-label="Next cover">›</button>
    `;
    document.body.append(lightbox);
    lightbox.querySelector(".lightbox-close").addEventListener("click", closeLightbox);
    lightbox.querySelector(".lightbox-prev").addEventListener("click", () => stepLightbox(-1));
    lightbox.querySelector(".lightbox-next").addEventListener("click", () => stepLightbox(1));
    lightbox.addEventListener("click", event => {
      if (event.target === lightbox) closeLightbox();
    });
    let touchStart = null;
    lightbox.addEventListener("touchstart", event => {
      touchStart = event.changedTouches?.[0]?.screenX ?? null;
    }, {passive:true});
    lightbox.addEventListener("touchend", event => {
      const end = event.changedTouches?.[0]?.screenX;
      if (touchStart !== null && typeof end === "number") {
        const delta = end - touchStart;
        if (Math.abs(delta) > 45) stepLightbox(delta < 0 ? 1 : -1);
      }
      touchStart = null;
    }, {passive:true});
    return lightbox;
  }

  function renderLightboxItem() {
    if (!lightbox || !viewerItems.length) return;
    const item = viewerItems[viewerIndex];
    const image = lightbox.querySelector(".lightbox-image");
    image.src = item.image_url || item.image || "";
    image.alt = localized(item.title) || "Football archive";
    lightbox.querySelector(".lightbox-title").textContent = localized(item.title) || "";
    lightbox.querySelector(".lightbox-description").textContent = localized(item.description) || "";
    lightbox.querySelector(".lightbox-counter").textContent = (viewerIndex + 1) + " / " + viewerItems.length;
    lightbox.querySelector(".lightbox-prev").setAttribute("aria-label", language === "fr" ? "Cover précédente" : "Previous cover");
    lightbox.querySelector(".lightbox-next").setAttribute("aria-label", language === "fr" ? "Cover suivante" : "Next cover");
    lightbox.querySelector(".lightbox-close").setAttribute("aria-label", language === "fr" ? "Fermer l'aperçu" : "Close preview");
  }

  function openLightbox(items, index) {
    viewerItems = items.slice();
    viewerIndex = Math.max(0, Math.min(index, viewerItems.length - 1));
    ensureLightbox();
    renderLightboxItem();
    lightbox.hidden = false;
    document.body.classList.add("lightbox-open");
    lightbox.querySelector(".lightbox-close").focus();
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.hidden = true;
    document.body.classList.remove("lightbox-open");
  }

  function stepLightbox(direction) {
    if (!lightbox || lightbox.hidden || !viewerItems.length) return;
    viewerIndex = (viewerIndex + direction + viewerItems.length) % viewerItems.length;
    renderLightboxItem();
  }

  document.addEventListener("keydown", event => {
    if (!lightbox || lightbox.hidden) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      stepLightbox(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      stepLightbox(1);
    } else if (event.key === "Escape") {
      event.preventDefault();
      closeLightbox();
    }
  });

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
      if (activeFilter !== 'all' && activeFilter !== 'favorites' && category !== activeFilter) return false;
      if (activeFilter === 'favorites' && !favoriteIds.has(favoriteKey(item))) return false;
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

    visible.forEach((item, itemIndex) => {
      const card = document.createElement("article");
      card.className = "archive-card";
      card.tabIndex = 0;
      card.setAttribute("role", "button");
      card.setAttribute("aria-label", (language === "fr" ? "Agrandir la cover : " : "View cover: ") + (localized(item.title) || "Football archive"));
      card.addEventListener("click", () => openLightbox(visible, itemIndex));
      card.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openLightbox(visible, itemIndex);
        }
      });
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

      const favorite = document.createElement("button");
      const isFavorite = favoriteIds.has(favoriteKey(item));
      favorite.type = "button";
      favorite.className = "cover-favorite" + (isFavorite ? " is-favorite" : "");
      favorite.setAttribute("aria-pressed", String(isFavorite));
      favorite.setAttribute("aria-label", favoriteLabel(isFavorite));
      favorite.innerHTML = '<span class="favorite-star" aria-hidden="true">' +
        (isFavorite ? "★" : "☆") + '</span><span class="favorite-label">' +
        favoriteLabel(isFavorite) + '</span>';
      favorite.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        toggleFavorite(item, favorite);
      });
      favorite.addEventListener("keydown", event => event.stopPropagation());

      info.append(meta, title, description, favorite);
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

  let savedVisualSettings = null;

  function publicElementKey(element) {
    if (element.id) return "id:" + element.id;
    const parts = [];
    let node = element;
    while (node && node !== document.body && parts.length < 8) {
      let part = node.tagName.toLowerCase();
      const classes = [...node.classList].filter(name => !name.startsWith("esp-")).slice(0, 2);
      if (classes.length) part += "." + classes.join(".");
      const parent = node.parentElement;
      if (parent) {
        const siblings = [...parent.children].filter(child => child.tagName === node.tagName);
        if (siblings.length > 1) part += ":nth-of-type(" + (siblings.indexOf(node) + 1) + ")";
      }
      parts.unshift(part);
      node = parent;
    }
    return parts.join(">");
  }

  function findPublicSettingElement(key) {
    if (key === "global:body") return document.body;
    if (String(key).startsWith("id:")) return document.getElementById(String(key).slice(3));
    return [...document.querySelectorAll("*")].find(element => {
      if (element.dataset.espKey === key) return true;
      const elementKey = publicElementKey(element);
      if (elementKey === key) {
        element.dataset.espKey = key;
        return true;
      }
      return false;
    }) || null;
  }

  function replacePublicText(element, value) {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while (walker.nextNode()) {
      if (walker.currentNode.nodeValue.trim()) textNodes.push(walker.currentNode);
    }
    if (textNodes.length) {
      textNodes[0].nodeValue = value;
      textNodes.slice(1).forEach(node => node.remove());
    } else {
      element.append(document.createTextNode(value));
    }
  }

  function applyPublicVisualSettings(visual = savedVisualSettings) {
    if (!visual || typeof visual !== "object") return;
    savedVisualSettings = visual;

    Object.entries(visual.texts || {}).forEach(([key, value]) => {
      const element = findPublicSettingElement(key);
      if (element) replacePublicText(element, String(value ?? ""));
    });

    Object.entries(visual.styles || {}).forEach(([key, saved]) => {
      const element = findPublicSettingElement(key);
      if (!element || !saved) return;
      ["color","backgroundColor","fontSize","fontFamily","fontWeight","letterSpacing",
       "opacity","boxShadow","transform","width","padding","borderRadius","display"].forEach(prop => {
        if (saved[prop] !== undefined && saved[prop] !== "") element.style[prop] = saved[prop];
      });
      if (saved.backgroundImage) {
        element.style.backgroundImage = saved.backgroundImage;
        element.style.backgroundSize = "cover";
        element.style.backgroundPosition = "center";
      }
    });

    Object.entries(visual.links || {}).forEach(([key, url]) => {
      const element = findPublicSettingElement(key);
      if (element?.tagName === "A") element.href = url;
    });
    Object.entries(visual.images || {}).forEach(([key, url]) => {
      const element = findPublicSettingElement(key);
      if (element?.tagName === "IMG") element.src = url;
    });
    Object.entries(visual.logos || {}).forEach(([key, url]) => {
      const element = findPublicSettingElement(key);
      if (!element) return;
      const image = document.createElement("img");
      image.src = url;
      image.alt = "European Satfeed Premium";
      image.className = "esp-custom-logo";
      image.style.cssText = "display:block;width:auto;max-width:110px;max-height:54px;object-fit:contain";
      element.replaceChildren(image);
    });

    const heroStamp = document.querySelector(".hero-stamp");
    const hero = visual.heroStamp || {};
    if (heroStamp && Object.keys(hero).length) {
      if (hero.imageUrl) {
        heroStamp.replaceChildren();
        const image = document.createElement("img");
        image.src = hero.imageUrl;
        image.alt = "European Satfeed Premium";
        image.style.cssText = "position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center;border-radius:50%;clip-path:circle(50% at 50% 50%)";
        heroStamp.style.borderRadius = "50%";
        heroStamp.append(image);
      } else {
        heroStamp.innerHTML = "<span class='esp-stamp-top'></span><b class='esp-stamp-center'></b><span class='esp-stamp-bottom'></span>";
        const top = heroStamp.querySelector(".esp-stamp-top");
        const center = heroStamp.querySelector(".esp-stamp-center");
        const bottom = heroStamp.querySelector(".esp-stamp-bottom");
        top.textContent = hero.topText ?? "EST.";
        center.textContent = hero.centerText ?? "ES+";
        bottom.textContent = hero.bottomText ?? "PREMIUM";
        top.style.color = bottom.style.color = hero.smallColor || "#aab2bf";
        center.style.color = hero.centerColor || "#eaff00";
        top.style.fontSize = bottom.style.fontSize = (hero.smallSize || 8) + "px";
        center.style.fontSize = (hero.centerSize || 37) + "px";
        heroStamp.style.fontFamily = hero.fontFamily || "Barlow Condensed";
      }
      if (hero.diameter) { heroStamp.style.width = hero.diameter + "px"; heroStamp.style.height = hero.diameter + "px"; }
      if (hero.borderColor) heroStamp.style.borderColor = hero.borderColor;
      if (hero.borderWidth !== undefined) heroStamp.style.borderWidth = hero.borderWidth + "px";
      if (hero.backgroundColor) heroStamp.style.backgroundColor = hero.backgroundColor;
      if (hero.rotation !== undefined) heroStamp.style.transform = "rotate(" + hero.rotation + "deg)";
      if (hero.glowColor) heroStamp.style.boxShadow = "0 0 28px " + hero.glowColor + "66";
      if (hero.right !== undefined) heroStamp.style.right = hero.right + "%";
      if (hero.bottom !== undefined) heroStamp.style.bottom = hero.bottom + "%";
    }

    const premiumAside = document.querySelector(".premium-aside");
    const premium = visual.premiumStamp || {};
    if (premiumAside && Object.keys(premium).length) {
      if (!premium.enabled) {
        premiumAside.classList.remove("esp-premium-round");
        premiumAside.innerHTML = "<span>EUROPEAN<br>SATFEED<br>PREMIUM</span><b>ES+</b><span>MEMBERS ONLY</span>";
        premiumAside.removeAttribute("style");
      } else {
        premiumAside.innerHTML = "";
        premiumAside.classList.add("esp-premium-round");
        const diameter = premium.diameter || 240;
        Object.assign(premiumAside.style, {
          position:"relative", boxSizing:"border-box", width:diameter+"px", height:diameter+"px",
          minWidth:diameter+"px", padding:"0", borderRadius:"50%", overflow:"hidden",
          display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"space-between",
          transform:"rotate("+(premium.rotation||0)+"deg)",
          background:premium.backgroundColor||"#080b12",
          border:(premium.borderWidth??1)+"px solid "+(premium.borderColor||"#ffffff55"),
          boxShadow:"0 0 30px "+(premium.glowColor||"#eaff00")+"66"
        });
        if (premium.imageUrl) {
          const image=document.createElement("img");
          image.src=premium.imageUrl;
          image.alt="Logo European Satfeed Premium";
          image.style.cssText="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center;border-radius:50%;clip-path:circle(50% at 50% 50%)";
          premiumAside.append(image);
        } else {
          const center=document.createElement("b");
          center.textContent=premium.centerText||"ES+";
          center.style.cssText="position:absolute;left:8%;right:8%;top:50%;transform:translateY(-50%);text-align:center;z-index:2;font:900 "+(premium.centerSize||82)+"px 'Barlow Condensed',sans-serif;color:"+(premium.centerColor||"#eaff00")+";line-height:.9";
          premiumAside.append(center);
        }
        if (premium.topText) {
          const top=document.createElement("span");
          top.textContent=premium.topText;
          top.style.cssText="position:absolute;top:13%;left:8%;right:8%;z-index:3;text-align:center;color:"+(premium.smallColor||"#aab2bf")+";font:700 "+(premium.smallSize||9)+"px 'DM Sans',sans-serif;letter-spacing:2px";
          premiumAside.append(top);
        }
        if (premium.bottomText) {
          const bottom=document.createElement("span");
          bottom.textContent=premium.bottomText;
          bottom.style.cssText="position:absolute;bottom:13%;left:8%;right:8%;z-index:3;text-align:center;color:"+(premium.smallColor||"#aab2bf")+";font:700 "+(premium.smallSize||9)+"px 'DM Sans',sans-serif;letter-spacing:2px";
          premiumAside.append(bottom);
        }
      }
    }

    if (visual.global?.mainColor) document.documentElement.style.setProperty("--yellow", visual.global.mainColor);
    if (visual.global?.backgroundColor) {
      document.documentElement.style.setProperty("--bg", visual.global.backgroundColor);
      document.body.style.backgroundColor = visual.global.backgroundColor;
    }
    if (visual.global?.backgroundImage) {
      document.body.style.backgroundImage = visual.global.backgroundImage;
      document.body.style.backgroundSize = visual.global.backgroundSize || "cover";
      document.body.style.backgroundPosition = visual.global.backgroundPosition || "center";
      document.body.style.backgroundAttachment = "fixed";
    }
  }

  async function loadPublicVisualSettings() {
    try {
      const query = new URL(`${SUPABASE_URL}/rest/v1/site_settings`);
      query.searchParams.set("select", "content");
      query.searchParams.set("limit", "50");
      const response = await fetch(query, {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
        cache: "no-store"
      });
      if (!response.ok) throw new Error("site_settings: " + response.status);
      const rows = await response.json();
      const row = (rows || []).find(item => item.content && typeof item.content === "object");
      savedVisualSettings = row?.content?.visual || null;
      if (savedVisualSettings) applyPublicVisualSettings(savedVisualSettings);
    } catch (error) {
      console.warn("Impossible de charger les personnalisations du site :", error);
    }
  }

  async function loadDeletedGithubCoverKeys() {
    try {
      const query = new URL(`${SUPABASE_URL}/rest/v1/site_settings`);
      query.searchParams.set("select", "content");
      const response = await fetch(query, {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`
        },
        cache: "no-store"
      });
      if (!response.ok) throw new Error(`site_settings: ${response.status}`);
      const rows = await response.json();
      const keys = new Set();
      (rows || []).forEach(row => {
        const hidden = row?.content?.visual?.deletedGithubCovers;
        if (Array.isArray(hidden)) hidden.forEach(value => keys.add(String(value)));
      });
      return keys;
    } catch (error) {
      console.warn("Impossible de lire les covers GitHub retirées :", error);
      return new Set();
    }
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
      const deletedGithubKeys = await loadDeletedGithubCoverKeys();

      catalogueItems = [
        ...supabaseItems.map(item => ({
          ...item,
          source: "supabase",
          category: normalizeCategory(item.category)
        })),
        ...githubItems.filter(item =>
          !knownUrls.has(item.image_url) &&
          !deletedGithubKeys.has(String(item.id)) &&
          !deletedGithubKeys.has(String(item.github_file)) &&
          !deletedGithubKeys.has(String(item.image_url))
        )
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
    try { localStorage.setItem("esp-language", language); } catch (_) {}
    updateTranslations();
    applyPublicVisualSettings();
    refreshCatalogueControls();
    renderCards();
    if (lightbox && !lightbox.hidden) renderLightboxItem();
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
  loadPublicVisualSettings();
  renderFilters();

  loadCatalogue().catch(error => {
    console.error(error);
    updateStatus(t("error"));
  });
})();
