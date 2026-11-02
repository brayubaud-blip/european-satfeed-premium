/* EUROPEAN SATFEED PREMIUM — OWNER CMS */
(() => {
  "use strict";

  const SUPABASE_URL = "https://afipejmgjkigcbohsxkt.supabase.co";
  const SUPABASE_KEY = "sb_publishable_MWi4yR-uw_TfrxJJrKdS1Q_783VTF6Z";
  const OWNER_UID = "1f2e7add-fe3d-4792-8c8c-9708e584b9d6";
  const BUCKET = "covers";

  if (!window.supabase?.createClient) {
    console.error("Supabase JS n'est pas chargé.");
    return;
  }

  const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  const $ = (selector, root = document) => root.querySelector(selector);

  const categories = [
    ["comps", "COMPS"],
    ["folders", "FOLDERS"],
    ["old", "OLD"],
    ["edits", "EDITS"],
    ["collections", "COLLECTIONS"],
    ["unclassified", "NON CLASSÉ"]
  ];

  let owner = false;
  let editing = false;
  let allItems = [];
  let settingsRow = null;
  let settings = { texts: {}, styles: {}, links: {} };
  let currentTab = "catalogue";
  let editingItemId = null;

  const css = document.createElement("style");
  css.textContent = `
    #esp-login,#esp-admin,#esp-menu {
      font-family:"DM Sans",Arial,sans-serif;
      box-sizing:border-box;
    }
    #esp-login *,#esp-admin *,#esp-menu * {box-sizing:border-box}
    #esp-login {
      display:none;position:fixed;inset:0;z-index:1000000;
      background:#05070cf2;align-items:center;justify-content:center;
      padding:18px;color:#fff;
    }
    #esp-login.open {display:flex}
    #esp-login .esp-window {
      width:min(420px,100%);background:#101927;
      border:1px solid #eaff00;padding:25px;
    }
    #esp-login h2 {color:#eaff00}
    #esp-login input,#esp-admin input,#esp-admin textarea,
    #esp-admin select,#esp-menu input,#esp-menu textarea,
    #esp-menu select {
      width:100%;padding:12px;margin:6px 0 12px;
      color:#fff;background:#080d15;border:1px solid #39465a;
      border-radius:4px;font:inherit;
    }
    #esp-login label,#esp-admin label,#esp-menu label {
      display:block;color:#b5c0d0;font-size:12px;
    }
    #esp-admin {
      display:none;position:fixed;inset:0;z-index:999990;
      background:#080b12;color:#f4f5f7;overflow:auto;
      padding:18px;
    }
    #esp-admin.open {display:block}
    .esp-admin-inner {max-width:1200px;margin:auto}
    .esp-admin-head {
      display:flex;align-items:center;justify-content:space-between;
      gap:12px;flex-wrap:wrap;border-bottom:1px solid #30394a;
      padding:12px 0 18px;margin-bottom:18px;
    }
    .esp-admin-head h2 {margin:0;color:#eaff00;font-size:22px}
    .esp-admin-tabs {display:flex;gap:8px;flex-wrap:wrap;margin:15px 0}
    .esp-admin-tabs button,.esp-btn {
      border:1px solid #465267;background:#172131;color:#fff;
      padding:11px 14px;border-radius:4px;cursor:pointer;
      font-weight:700;font-size:12px;
    }
    .esp-admin-tabs button.active,.esp-btn.primary {
      background:#eaff00;color:#080b12;border-color:#eaff00;
    }
    .esp-btn.danger {border-color:#a33a48;color:#ff9ba4}
    .esp-panel {
      background:#0d121c;border:1px solid #293447;
      padding:16px;margin:12px 0;border-radius:5px;
    }
    .esp-catalogue-addbar {
      position:sticky;top:8px;z-index:20;display:flex;align-items:center;
      gap:12px;padding:10px;margin:0 0 14px;background:#080b12ee;
      border:1px solid #eaff00;border-radius:5px;backdrop-filter:blur(10px);
    }
    .esp-catalogue-addbar span {font-size:11px;color:#aab2bf}
    .esp-add-cover-main {
      display:block;flex:0 0 auto;min-width:280px;min-height:54px;margin:0;
      font-size:15px;letter-spacing:.4px;text-align:center;
      background:#eaff00;color:#080b12;border:2px solid #eaff00;
      box-shadow:0 0 18px #eaff0026;
    }
    .esp-add-cover-main:hover {
      filter:brightness(1.08);transform:translateY(-1px);
    }
    @media(max-width:700px) {
      .esp-catalogue-addbar {align-items:stretch;flex-direction:column}
      .esp-add-cover-main {width:100%;min-width:0}
    }
    .esp-row {
      display:flex;gap:12px;align-items:center;flex-wrap:wrap;
    }
    .esp-row > * {flex:1}
    .esp-list-item {
      display:grid;grid-template-columns:85px 1fr auto;
      gap:13px;align-items:center;padding:12px 0;
      border-bottom:1px solid #293447;
    }
    .esp-list-item img {
      width:85px;height:65px;object-fit:cover;background:#172131;
    }
    .esp-list-item strong {display:block;font-size:13px}
    .esp-muted {font-size:11px;color:#9ba7b8;margin-top:5px}
    .esp-actions {display:flex;gap:5px;flex-wrap:wrap}
    .esp-actions button {padding:8px;font-size:10px}
    #esp-menu {
      display:none;position:fixed;z-index:1000001;
      left:50%;top:50%;transform:translate(-50%,-50%);
      width:min(460px,calc(100vw - 24px));
      max-height:85vh;overflow:auto;background:#101927;
      border:1px solid #eaff00;padding:17px;color:#fff;
      box-shadow:0 15px 55px #000d;
    }
    #esp-menu.open {display:block}
    #esp-menu h3 {color:#eaff00;margin:0 0 12px}
    .esp-toolbar {
      position:fixed;z-index:999980;right:14px;bottom:14px;
      display:none;gap:8px;align-items:center;
      background:#101927;border:1px solid #eaff00;
      padding:9px;box-shadow:0 5px 25px #000a;
    }
    .esp-toolbar button {
      background:#eaff00;color:#080b12;border:0;
      padding:10px;font-weight:800;cursor:pointer;
    }
    #esp-edit-controls button {
      padding:11px 14px;background:#101927;color:#eaff00;
      border:1px solid #eaff00;border-radius:4px;
      font:800 11px "DM Sans",Arial,sans-serif;cursor:pointer;
      box-shadow:0 5px 22px #0009;white-space:nowrap;
    }
    #esp-edit-controls button:hover {background:#eaff00;color:#080b12}
    #esp-edit-controls #esp-finish-edit-control {
      background:#eaff00;color:#080b12;border-color:#eaff00;
    }
    #esp-edit-controls #esp-finish-edit-control:hover {
      background:#fff;color:#080b12;border-color:#fff;
    }
    @media(max-width:560px) {
      #esp-edit-controls {top:80px!important;right:10px!important;left:10px;justify-content:flex-end}
      #esp-edit-controls button {font-size:10px;padding:9px}
    }
    body.esp-editing .premium-aside {
      outline:1px dashed #eaff00;outline-offset:7px;cursor:pointer;
    }
    body.esp-editing [data-esp-editable="true"] {
      outline:1px dashed #eaff00;outline-offset:3px;cursor:pointer;
    }
    body.esp-editing .archive-card {
      outline:1px dashed #eaff00;outline-offset:3px;
    }
    @media(max-width:650px) {
      #esp-admin {padding:10px}
      .esp-list-item {grid-template-columns:65px 1fr}
      .esp-list-item img {width:65px;height:58px}
      .esp-list-item .esp-actions {grid-column:1/-1}
      .esp-toolbar {left:8px;right:8px;bottom:8px;justify-content:center}
      .esp-toolbar button {flex:1;padding:11px 5px;font-size:10px}
      .esp-admin-head h2 {font-size:18px}
    }
  `;
  document.head.append(css);

  const login = document.createElement("div");
  login.id = "esp-login";
  login.innerHTML = `
    <div class="esp-window">
      <h2>ES+ OWNER ACCESS</h2>
      <p>Connexion réservée au propriétaire du site.</p>
      <form id="esp-login-form">
        <label>Adresse e-mail</label>
        <input id="esp-email" type="email" required autocomplete="username">
        <label>Mot de passe</label>
        <input id="esp-password" type="password" required autocomplete="current-password">
        <button class="esp-btn primary" type="submit">SE CONNECTER</button>
        <button class="esp-btn" type="button" id="esp-login-close">ANNULER</button>
        <p id="esp-login-message"></p>
      </form>
    </div>
  `;
  document.body.append(login);

  const admin = document.createElement("div");
  admin.id = "esp-admin";
  admin.innerHTML = `
    <div class="esp-admin-inner">
      <header class="esp-admin-head">
        <div>
          <h2>EUROPEAN SATFEED — ADMIN</h2>
          <div class="esp-muted">Gestion complète du site</div>
        </div>
        <div class="esp-row" style="flex:0 1 auto">
          <button class="esp-btn primary" id="esp-view-site">VOIR LE SITE & MODIFIER</button>
          <button class="esp-btn danger" id="esp-logout">DÉCONNEXION</button>
        </div>
      </header>

      <nav class="esp-admin-tabs">
        <button data-tab="catalogue" class="active">CATALOGUE</button>
        <button data-tab="hidden">COVERS MASQUÉES</button>
        <button data-tab="site">ÉDITER LE SITE</button>
        <button data-tab="appearance">APPARENCE</button>
      </nav>

      <section id="esp-tab-catalogue">
        <div class="esp-catalogue-addbar">
          <button class="esp-btn primary esp-add-cover-main" type="button" id="esp-add-cover">
            + AJOUTER UNE NOUVELLE COVER
          </button>
          <span>Ajout individuel · ou utilise l'import multiple juste en dessous</span>
        </div>
        <div class="esp-panel">
          <div class="esp-row">
            <div>
              <h3>TOUTES LES COVERS</h3>
              <p class="esp-muted">Gère tes covers depuis une seule liste.</p>
            </div>
          </div>

          <div class="esp-panel" style="margin:16px 0;background:#101927">
            <h3>IMPORTER PLUSIEURS COVERS</h3>
            <p class="esp-muted">Sélectionne 200 images ou plus en une seule fois. Les titres seront créés à partir des noms de fichiers.</p>
            <label>Catégorie pour les covers importées</label>
            <select id="esp-bulk-category">
              ${categories.map(([id,label]) => `<option value="${id}" ${id === "edits" ? "selected" : ""}>${label}</option>`).join("")}
            </select>
            <label>Images à importer</label>
            <input id="esp-bulk-files" type="file" accept="image/*" multiple>
            <p id="esp-bulk-count" class="esp-muted">Aucune image sélectionnée.</p>
            <button class="esp-btn primary" type="button" id="esp-bulk-upload">IMPORTER LES COVERS SÉLECTIONNÉES</button>
            <progress id="esp-bulk-progress" value="0" max="100" style="display:none;width:100%;height:12px;margin-top:12px"></progress>
            <p id="esp-bulk-status" class="esp-muted" aria-live="polite"></p>
          </div>

          <input id="esp-search" placeholder="Rechercher une cover...">
          <select id="esp-filter">
            <option value="all">Toutes les catégories</option>
            ${categories.map(([id,label]) =>
              `<option value="${id}">${label}</option>`
            ).join("")}
            <option value="clubs">Anciennes données CLUBS</option>
            <option value="national teams">Anciennes données NATIONAL TEAMS</option>
          </select>
          <div id="esp-catalogue-list">Chargement...</div>
        </div>
      </section>

      <section id="esp-tab-hidden" hidden>
        <div class="esp-panel">
          <h3>COVERS MASQUÉES</h3>
          <div id="esp-hidden-list"></div>
        </div>
      </section>

      <section id="esp-tab-site" hidden>
        <div class="esp-panel">
          <h3>ÉDITION DIRECTE DU SITE</h3>
          <p class="esp-muted">
            Active le mode édition, puis touche ou clique sur un texte,
            un titre, un bouton ou une section pour le modifier.
          </p>
          <button class="esp-btn primary" id="esp-toggle-edit">
            ACTIVER L'ÉDITION DIRECTE
          </button>
          <button class="esp-btn" id="esp-save-settings">
            ENREGISTRER LES MODIFICATIONS
          </button>
        </div>
      </section>

      <section id="esp-tab-appearance" hidden>
        <div class="esp-panel">
          <h3>APPARENCE GÉNÉRALE</h3>
          <label>Couleur principale</label>
          <input type="color" id="esp-main-color" value="#eaff00">
          <label>Couleur de fond</label>
          <input type="color" id="esp-bg-color" value="#080b12">
          <button class="esp-btn primary" id="esp-save-appearance">
            ENREGISTRER L'APPARENCE
          </button>
        </div>
      </section>
    </div>
  `;
  document.body.append(admin);

  const toolbar = document.createElement("div");
  toolbar.className = "esp-toolbar";
  toolbar.hidden = true;
  toolbar.style.display = "none";
  document.body.append(toolbar);

  const editControls = document.createElement("div");
  editControls.id = "esp-edit-controls";
  editControls.style.cssText = "display:none;position:fixed;z-index:999970;top:108px;right:18px;gap:8px;align-items:center;flex-wrap:wrap;max-width:calc(100vw - 24px);";
  const undoControl = document.createElement("button");
  undoControl.id = "esp-undo-control";
  undoControl.type = "button";
  undoControl.textContent = "↶ RETOUR ARRIÈRE";
  const finishEditControl = document.createElement("button");
  finishEditControl.id = "esp-finish-edit-control";
  finishEditControl.type = "button";
  finishEditControl.textContent = "TERMINER L'ÉDITION";
  editControls.append(undoControl, finishEditControl);
  document.body.append(editControls);

  const menu = document.createElement("div");
  menu.id = "esp-menu";
  document.body.append(menu);

  const picker = document.createElement("input");
  picker.type = "file";
  picker.accept = "image/*";
  picker.hidden = true;
  document.body.append(picker);

  function message(text) {
    window.alert(text);
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;",
      '"': "&quot;", "'": "&#39;"
    })[char]);
  }

  function getText(value, lang = "fr") {
    if (typeof value === "string") return value;
    return value?.[lang] || value?.fr || value?.en || "";
  }

  function isOwnerSession(session) {
    return !!session?.user && session.user.id === OWNER_UID;
  }

  function showLogin() {
    login.classList.add("open");
  }

  function closeMenu() {
    menu.classList.remove("open");
    menu.innerHTML = "";
  }

  function showMenu(html) {
    menu.innerHTML = html;
    menu.classList.add("open");
  }

  async function checkOwner() {
    const { data, error } = await db.auth.getSession();
    if (error) throw error;

    owner = isOwnerSession(data.session);

    if (!owner) {
      admin.classList.remove("open");
      toolbar.style.display = "none";
      editing = false;
      document.body.classList.remove("esp-editing");
    }

    return owner;
  }

  async function loadSettings() {
    const { data, error } = await db
      .from("site_settings")
      .select("*")
      .limit(50);

    if (error) throw error;

    settingsRow = (data || []).find(row =>
      row.content && typeof row.content === "object"
    ) || null;

    settings = settingsRow?.content?.visual || {
      texts: {}, styles: {}, links: {}
    };

    settings.texts ||= {};
    settings.styles ||= {};
    settings.links ||= {};
    settings.images ||= {};
    settings.logos ||= {};
    settings.undoStack ||= [];

    applySettings();
  }

  async function saveSettings(silent = false) {
    if (!owner) throw new Error("Accès propriétaire requis.");

    const content = {
      ...(settingsRow?.content || {}),
      visual: settings
    };

    let result;

    if (settingsRow?.id) {
      result = await db.from("site_settings")
        .update({ content })
        .eq("id", settingsRow.id);
    } else {
      result = await db.from("site_settings")
        .insert({ id: "public", content })
        .select()
        .single();

      if (!result.error) settingsRow = result.data;
    }

    if (result.error) throw result.error;
    if (settingsRow) settingsRow.content = content;

    if (!silent) message("Modifications enregistrées.");
  }

  function elementKey(element) {
    if (element.id) return `id:${element.id}`;

    const parts = [];
    let node = element;

    while (node && node !== document.body && parts.length < 8) {
      let part = node.tagName.toLowerCase();
      const classes = [...node.classList]
        .filter(name => !name.startsWith("esp-"))
        .slice(0, 2);

      if (classes.length) part += "." + classes.join(".");

      const parent = node.parentElement;
      if (parent) {
        const siblings = [...parent.children]
          .filter(child => child.tagName === node.tagName);

        if (siblings.length > 1) {
          part += `:nth-of-type(${siblings.indexOf(node) + 1})`;
        }
      }

      parts.unshift(part);
      node = parent;
    }

    return parts.join(">");
  }

  function prepareEditableElements() {
    document.querySelectorAll(
      "h1,h2,h3,p,a,button,summary,.brand-name,.brand-mark,.brand img"
    ).forEach(element => {
      if (element.closest("#esp-admin,#esp-login,#esp-menu,.esp-toolbar,#esp-edit-controls")) return;
      element.dataset.espEditable = "true";
      element.dataset.espKey ||= elementKey(element);
    });
  }

  function findElement(key) {
    return [...document.querySelectorAll("[data-esp-key]")]
      .find(element => element.dataset.espKey === key);
  }

  function replaceTextSafely(element, value) {
    const textNodes = [];
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT
    );

    while (walker.nextNode()) {
      if (walker.currentNode.nodeValue.trim()) {
        textNodes.push(walker.currentNode);
      }
    }

    if (textNodes.length) {
      textNodes[0].nodeValue = value;
      textNodes.slice(1).forEach(node => node.remove());
    } else {
      element.append(document.createTextNode(value));
    }
  }

  function applySettings() {
    prepareEditableElements();

    Object.entries(settings.texts || {}).forEach(([key, value]) => {
      const element = findElement(key);
      if (element) replaceTextSafely(element, value);
    });

    Object.entries(settings.styles || {}).forEach(([key, saved]) => {
      const element = findElement(key);
      if (!element || !saved) return;

      if (saved.color) element.style.color = saved.color;
      if (saved.backgroundColor) element.style.backgroundColor = saved.backgroundColor;
      if (saved.fontSize) element.style.fontSize = saved.fontSize;
      if (saved.fontFamily) element.style.fontFamily = saved.fontFamily;
      if (saved.fontWeight) element.style.fontWeight = saved.fontWeight;
      if (saved.letterSpacing) element.style.letterSpacing = saved.letterSpacing;
      if (saved.opacity) element.style.opacity = saved.opacity;
      if (saved.boxShadow) element.style.boxShadow = saved.boxShadow;
      if (saved.transform) element.style.transform = saved.transform;
      if (saved.width) element.style.width = saved.width;
      if (saved.padding) element.style.padding = saved.padding;
      if (saved.borderRadius) element.style.borderRadius = saved.borderRadius;
      if (saved.display) element.style.display = saved.display;

      if (saved.backgroundImage) {
        element.style.backgroundImage = saved.backgroundImage;
        element.style.backgroundSize = "cover";
        element.style.backgroundPosition = "center";
      }
    });

    Object.entries(settings.links || {}).forEach(([key, url]) => {
      const element = findElement(key);
      if (element?.tagName === "A") element.href = url;
    });
    Object.entries(settings.images || {}).forEach(([key, url]) => {
      const element = findElement(key);
      if (element?.tagName === "IMG") element.src = url;
    });
    Object.entries(settings.logos || {}).forEach(([key, url]) => {
      const element = findElement(key);
      if (element) {
        const logoImage = document.createElement("img");
        logoImage.src = url;
        logoImage.alt = "European Satfeed Premium";
        logoImage.className = "esp-custom-logo";
        logoImage.style.cssText = "display:block;width:auto;max-width:110px;max-height:54px;object-fit:contain";
        element.replaceChildren(logoImage);
      }
    });
    applyHeroStampSettings();
    applyPremiumStampSettings();
    if (settings.global?.mainColor) document.documentElement.style.setProperty("--yellow", settings.global.mainColor);
    if (settings.global?.backgroundColor) {
      document.documentElement.style.setProperty("--bg", settings.global.backgroundColor);
      document.body.style.backgroundColor = settings.global.backgroundColor;
    }
    if (settings.global?.backgroundImage) {
      document.body.style.backgroundImage = settings.global.backgroundImage;
      document.body.style.backgroundSize = settings.global.backgroundSize || "cover";
      document.body.style.backgroundPosition = settings.global.backgroundPosition || "center";
      document.body.style.backgroundAttachment = "fixed";
    }
  }

  function cloneEditorState() {
    return JSON.parse(JSON.stringify({
      texts: settings.texts || {},
      styles: settings.styles || {},
      links: settings.links || {},
      images: settings.images || {},
      logos: settings.logos || {},
      heroStamp: settings.heroStamp || {},
      premiumStamp: settings.premiumStamp || {},
      deletedGithubCovers: settings.deletedGithubCovers || [],
      global: settings.global || {}
    }));
  }

  async function recordUndo(label, meta = null) {
    if (!owner) throw new Error("Accès propriétaire requis.");
    settings.undoStack ||= [];
    settings.undoStack.push({ label, snapshot: cloneEditorState(), meta });
    settings.undoStack = settings.undoStack.slice(-25);
    await saveSettings(true);
  }

  async function undoLastChange() {
    if (!owner) return;
    const entry = settings.undoStack?.pop();
    if (!entry) {
      message("Aucune modification à annuler pour le moment.");
      return;
    }
    if (entry.meta?.kind === "catalogue") {
      try {
        const meta = entry.meta;
        if (meta.action === "restore" && meta.row) {
          if (Array.isArray(meta.removeIds) && meta.removeIds.length) {
            const { error: tombstoneError } = await db.from("catalogue").delete().in("id", meta.removeIds);
            if (tombstoneError) throw tombstoneError;
          }
          const { error } = await db.from("catalogue").upsert(meta.row);
          if (error) throw error;
        } else if (meta.action === "deleteIds" && Array.isArray(meta.ids) && meta.ids.length) {
          const { error } = await db.from("catalogue").delete().in("id", meta.ids);
          if (error) throw error;
        }
        const snapshot = entry.snapshot || {};
        settings.texts = snapshot.texts || {};
        settings.styles = snapshot.styles || {};
        settings.links = snapshot.links || {};
        settings.images = snapshot.images || {};
        settings.logos = snapshot.logos || {};
        settings.heroStamp = snapshot.heroStamp || {};
        settings.premiumStamp = snapshot.premiumStamp || {};
        settings.deletedGithubCovers = snapshot.deletedGithubCovers || [];
        settings.global = snapshot.global || {};
        await saveSettings(true);
        applySettings();
        await refreshAdminAndPublic();
        message("Dernière action sur le catalogue annulée.");
        return;
      } catch (error) {
        settings.undoStack.push(entry);
        message("Impossible d'annuler cette action du catalogue : " + error.message);
        return;
      }
    }
    const snapshot = entry.snapshot || {};
    settings.texts = snapshot.texts || {};
    settings.styles = snapshot.styles || {};
    settings.links = snapshot.links || {};
    settings.images = snapshot.images || {};
    settings.logos = snapshot.logos || {};
    settings.heroStamp = snapshot.heroStamp || {};
    settings.premiumStamp = snapshot.premiumStamp || {};
    settings.deletedGithubCovers = snapshot.deletedGithubCovers || [];
    settings.global = snapshot.global || {};
    try {
      await saveSettings(true);
      applySettings();
      await window.ESP_CATALOGUE?.refresh?.();
      message("Dernière modification annulée : " + (entry.label || "modification") + ".");
    } catch (error) {
      settings.undoStack.push(entry);
      message("Impossible d'annuler : " + error.message);
    }
  }

  async function loadCatalogueAdmin() {
    const { data, error } = await db
      .from("catalogue")
      .select("*")
      .order("position", { ascending: true });

    if (error) throw error;

    allItems = data || [];
    renderAdminCatalogue();
    renderHidden();
  }

  function renderAdminCatalogue() {
    const container = $("#esp-catalogue-list");
    if (!container) return;

    const search = ($("#esp-search")?.value || "").toLowerCase();
    const filter = $("#esp-filter")?.value || "all";

    const filtered = allItems.filter(item => {
      const description = getText(item.description, "fr");
      if (description.startsWith("__GITHUB_SOURCE_HIDDEN__|")) return false;
      const title = getText(item.title).toLowerCase();
      const category = String(item.category || "").toLowerCase();

      return (filter === "all" || category === filter) &&
        title.includes(search);
    });

    container.replaceChildren();

    if (!filtered.length) {
      container.textContent = "Aucune cover trouvée.";
      return;
    }

    filtered.forEach(item => {
      const row = document.createElement("div");
      row.className = "esp-list-item";

      const image = document.createElement("img");
      image.src = item.image_url || "";
      image.alt = getText(item.title);

      const details = document.createElement("div");
      const title = document.createElement("strong");
      title.textContent = getText(item.title) || "Sans titre";

      const meta = document.createElement("div");
      meta.className = "esp-muted";
      meta.textContent =
        `${item.category || "Non classé"} · ${item.published ? "Publiée" : "Masquée"}`;

      details.append(title, meta);

      const actions = document.createElement("div");
      actions.className = "esp-actions";

      const edit = makeButton("MODIFIER", () => openCoverEditor(item));
      const hide = makeButton(
        item.published ? "MASQUER" : "PUBLIER",
        () => togglePublished(item)
      );
      const remove = makeButton("SUPPRIMER", () => deleteCover(item), "danger");

      actions.append(edit, hide, remove);
      row.append(image, details, actions);
      container.append(row);
    });
  }

  function makeButton(label, callback, type = "") {
    const button = document.createElement("button");
    button.className = `esp-btn ${type}`;
    button.type = "button";
    button.textContent = label;
    button.addEventListener("click", callback);
    return button;
  }

  function renderHidden() {
    const container = $("#esp-hidden-list");
    if (!container) return;

    container.replaceChildren();

    const hidden = allItems.filter(item => item.published === false && !getText(item.description, "fr").startsWith("__GITHUB_SOURCE_HIDDEN__|"));

    if (!hidden.length) {
      container.textContent = "Aucune cover masquée.";
      return;
    }

    hidden.forEach(item => {
      const row = document.createElement("div");
      row.className = "esp-list-item";

      const image = document.createElement("img");
      image.src = item.image_url || "";

      const title = document.createElement("strong");
      title.textContent = getText(item.title) || "Sans titre";

      const publish = makeButton("REPUBLIER", () => togglePublished(item));
      row.append(image, title, publish);
      container.append(row);
    });
  }

  function categorySelect(selected) {
    return categories.map(([id, label]) =>
      `<option value="${id}" ${id === selected ? "selected" : ""}>${label}</option>`
    ).join("");
  }

  function newCatalogueId() {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, char => {
      const random = Math.random() * 16 | 0;
      return (char === "x" ? random : (random & 3 | 8)).toString(16);
    });
  }

  function openCoverEditor(item = null) {
    editingItemId = item?.id ?? null;

    const titleFr = getText(item?.title, "fr");
    const titleEn = getText(item?.title, "en");
    const descFr = getText(item?.description, "fr");
    const descEn = getText(item?.description, "en");

    showMenu(`
      <h3>${item ? "MODIFIER LA COVER" : "AJOUTER UNE COVER"}</h3>

      <label>Image</label>
      <input type="file" id="esp-cover-file" accept="image/*">

      <label>Titre français</label>
      <input id="esp-cover-title-fr" value="${escapeHTML(titleFr)}">

      <label>Titre anglais</label>
      <input id="esp-cover-title-en" value="${escapeHTML(titleEn)}">

      <label>Description française</label>
      <textarea id="esp-cover-desc-fr">${escapeHTML(descFr)}</textarea>

      <label>Description anglaise</label>
      <textarea id="esp-cover-desc-en">${escapeHTML(descEn)}</textarea>

      <label>Catégorie</label>
      <select id="esp-cover-category">
        ${categorySelect(item?.category || "edits")}
      </select>

      <label>Position dans le catalogue</label>
      <input type="number" min="0" id="esp-cover-position"
        value="${Number(item?.position ?? allItems.length)}">

      <button class="esp-btn primary" id="esp-cover-save">ENREGISTRER</button>
      ${item ? '<button class="esp-btn" id="esp-cover-duplicate">DUPLIQUER</button><button class="esp-btn" id="esp-cover-hide">' + (item.published === false ? 'REPUBLIER' : 'MASQUER') + '</button><button class="esp-btn danger" id="esp-cover-delete">SUPPRIMER LA COVER</button>' : ''}
      <button class="esp-btn" id="esp-cover-cancel">ANNULER</button>
    `);

    $("#esp-cover-cancel").onclick = closeMenu;
    if (item) {
      $("#esp-cover-hide").onclick = async () => { await togglePublished(item); closeMenu(); };
      $("#esp-cover-delete").onclick = async () => { closeMenu(); await deleteCover(item); };
      const duplicateButton = $("#esp-cover-duplicate");
      if (duplicateButton) duplicateButton.onclick = async () => { await duplicateCover(item); };
    }

    $("#esp-cover-save").onclick = async () => {
      const button = $("#esp-cover-save");
      const file = $("#esp-cover-file").files?.[0];

      const titleFrValue = $("#esp-cover-title-fr").value.trim();
      const titleEnValue = $("#esp-cover-title-en").value.trim();
      const category = $("#esp-cover-category").value;

      if (!titleFrValue) {
        message("Ajoute au moins un titre français.");
        return;
      }

      button.disabled = true;
      button.textContent = "ENREGISTREMENT…";

      try {
        let imageUrl = item?.image_url || "";

        if (file) imageUrl = await uploadImage(file);

        if (!imageUrl) throw new Error("Sélectionne une image.");

        const changes = {
          title: {
            fr: titleFrValue,
            en: titleEnValue || titleFrValue
          },
          description: {
            fr: $("#esp-cover-desc-fr").value.trim(),
            en: $("#esp-cover-desc-en").value.trim()
          },
          category,
          image_url: imageUrl,
          position: Math.max(0, Number($("#esp-cover-position").value || 0)),
          published: item?.published ?? true
        };

        let result;

        if (item && item.source !== "github") {
          await recordUndo("Modifier une cover", {
            kind: "catalogue", action: "restore", row: item
          });
          result = await db.from("catalogue")
            .update(changes)
            .eq("id", item.id);
        } else {
          // Keep the original GitHub image untouched; create an editable catalogue record.
          result = await db.from("catalogue").insert({
            id: newCatalogueId(),
            ...changes
          }).select("id").single();
        }

        if (result.error) throw result.error;
        if (!item || item.source === "github") {
          await recordUndo("Ajouter une cover", {
            kind: "catalogue", action: "deleteIds", ids: [result.data.id]
          });
        }

        closeMenu();
        await refreshAdminAndPublic();
        message(item ? "Cover modifiée." : "Cover ajoutée.");
      } catch (error) {
        button.disabled = false;
        button.textContent = "RÉESSAYER";
        message("Erreur : " + error.message);
      }
    };
  }

  async function uploadImage(file) {
    if (!file.type.startsWith("image/")) {
      throw new Error("Le fichier doit être une image.");
    }

    if (file.size > 12 * 1024 * 1024) {
      throw new Error("Image trop lourde : maximum 12 Mo.");
    }

    const extension = (file.name.split(".").pop() || "jpg")
      .toLowerCase().replace(/[^a-z0-9]/g, "");

    const path = `catalogue/${Date.now()}-${crypto.randomUUID()}.${extension}`;

    const { error } = await db.storage.from(BUCKET).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type
    });

    if (error) throw error;

    return db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  }

  function bulkTitleFromFilename(filename) {
    return String(filename || "")
      .replace(/\.[^.]+$/, "")
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim() || "Nouvelle cover";
  }

  async function importBulkCovers() {
    const input = $("#esp-bulk-files");
    const button = $("#esp-bulk-upload");
    const progress = $("#esp-bulk-progress");
    const status = $("#esp-bulk-status");
    const selected = Array.from(input?.files || []);
    const category = $("#esp-bulk-category")?.value || "edits";

    if (!selected.length) {
      message("Sélectionne d'abord les images à importer.");
      return;
    }
    if (selected.length > 1000) {
      message("Sélectionne au maximum 1 000 images par import. Tu peux faire plusieurs lots.");
      return;
    }

    const valid = selected.filter(file => file.type.startsWith("image/") && file.size <= 12 * 1024 * 1024);
    const rejected = selected.length - valid.length;
    if (!valid.length) {
      message("Aucune image valide. Chaque fichier doit être une image de 12 Mo maximum.");
      return;
    }

    button.disabled = true;
    input.disabled = true;
    button.textContent = "IMPORT EN COURS…";
    progress.style.display = "block";
    progress.max = valid.length;
    progress.value = 0;
    status.textContent = "Préparation de " + valid.length + " image(s)…";

    let imported = 0;
    const failures = [];
    const createdIds = [];
    let nextPosition = allItems.length;

    try {
      for (let index = 0; index < valid.length; index++) {
        const file = valid[index];
        try {
          const imageUrl = await uploadImage(file);
          const title = bulkTitleFromFilename(file.name);
          const row = {
            id: newCatalogueId(),
            title: { fr: title, en: title },
            description: { fr: "", en: "" },
            category,
            image_url: imageUrl,
            position: nextPosition++,
            published: true
          };

          const { data, error } = await db.from("catalogue").insert(row).select("id").single();
          if (error) throw error;
          createdIds.push(data.id);
          imported++;
        } catch (error) {
          failures.push(file.name + " : " + (error.message || "Erreur inconnue"));
        }

        progress.value = index + 1;
        status.textContent = "Import : " + (index + 1) + "/" + valid.length +
          " · Réussies : " + imported + " · Erreurs : " + failures.length;
      }

      if (createdIds.length) {
        await recordUndo("Importer " + createdIds.length + " covers", {
          kind: "catalogue", action: "deleteIds", ids: createdIds
        });
      }
      await refreshAdminAndPublic();
      const skipped = rejected ? " · Refusées (format ou taille) : " + rejected : "";
      status.textContent = "Terminé : " + imported + "/" + valid.length +
        " cover(s) importée(s)" + skipped + (failures.length ? " · Échecs : " + failures.length : "");
      if (failures.length) {
        console.warn("Erreurs d'import des covers :", failures);
        message("Import terminé avec " + failures.length + " erreur(s). Les noms concernés sont visibles dans la console du navigateur (F12).");
      } else {
        message(imported + " cover(s) importée(s) avec succès.");
      }
      input.value = "";
      $("#esp-bulk-count").textContent = "Aucune image sélectionnée.";
    } catch (error) {
      status.textContent = "Import interrompu : " + (error.message || "Erreur inconnue");
      message("L'import a été interrompu : " + error.message);
    } finally {
      button.disabled = false;
      input.disabled = false;
      button.textContent = "IMPORTER LES COVERS SÉLECTIONNÉES";
    }
  }

  async function duplicateCover(item) {
    try {
      const copy = { id:newCatalogueId(), title:item.title, description:item.description, category:item.category, image_url:item.image_url, published:false, position:allItems.length };
      const { data, error } = await db.from("catalogue").insert(copy).select("id").single();
      if (error) throw error;
      await recordUndo("Dupliquer une cover", {
        kind: "catalogue", action: "deleteIds", ids: [data.id]
      });
      closeMenu();
      await refreshAdminAndPublic();
      message("Copie créée et masquée. Tu peux la modifier avant de la publier.");
    } catch (error) { message("Duplication impossible : " + error.message); }
  }

  async function togglePublished(item) {
    try {
      await recordUndo("Changer la visibilité d'une cover", {
        kind: "catalogue", action: "restore", row: item
      });
      const { error } = await db.from("catalogue")
        .update({ published: !item.published })
        .eq("id", item.id);

      if (error) throw error;

      await refreshAdminAndPublic();
    } catch (error) {
      message("Impossible de modifier la publication : " + error.message);
    }
  }

  async function deleteCover(item) {
    const title = getText(item.title) || "cette cover";
    if (!confirm("Retirer « " + title + " » du catalogue public ?\n\nLa carte disparaîtra du site. Le fichier image source sera conservé pour permettre un retour arrière.")) return;

    try {
      const githubSourceUrl = String(item.image_url || "").includes("raw.githubusercontent.com")
        ? item.image_url : (item.source === "github" ? item.image_url : "");
      let tombstoneId = null;
      if (githubSourceUrl) {
        const marker = {
          id: newCatalogueId(),
          title: { fr: "Archive source retirée", en: "Source archive removed" },
          description: {
            fr: "__GITHUB_SOURCE_HIDDEN__|" + String(item.id || githubSourceUrl),
            en: "__GITHUB_SOURCE_HIDDEN__|" + String(item.id || githubSourceUrl)
          },
          category: "clubs",
          image_url: githubSourceUrl,
          published: true,
          position: -1
        };
        const { data: markerData, error: markerError } = await db.from("catalogue").insert(marker).select("id").single();
        if (markerError) throw markerError;
        tombstoneId = markerData.id;
      }

      if (item.source === "github" || String(item.id).startsWith("github-")) {
        if (!tombstoneId) throw new Error("Impossible de créer le marqueur de retrait de cette cover GitHub.");
        await recordUndo("Retirer une cover GitHub du catalogue", {
          kind: "catalogue", action: "deleteIds", ids: [tombstoneId]
        });
        await refreshAdminAndPublic();
        message("Cover retirée du catalogue public. Le fichier original reste conservé ; Retour arrière la restaurera.");
        return;
      }

      const undoMeta = { kind: "catalogue", action: "restore", row: item };
      if (tombstoneId) undoMeta.removeIds = [tombstoneId];
      await recordUndo("Supprimer une cover", undoMeta);
      const { error } = await db.from("catalogue").delete().eq("id", item.id);
      if (error) throw error;
      await refreshAdminAndPublic();
      message("Cover retirée du catalogue public. Le fichier image source est conservé pour permettre une restauration.");
    } catch (error) {
      message("Suppression impossible : " + error.message);
    }
  }

  async function refreshAdminAndPublic() {
    await loadCatalogueAdmin();
    await window.ESP_CATALOGUE?.refresh?.();
  }

  function openTextEditor(element) {
    const key = element.dataset.espKey;
    const oldText = element.innerText || element.textContent || "";
    const isLink = element.tagName === "A";

    showMenu(`
      <h3>MODIFIER L'ÉLÉMENT</h3>
      <label>Texte affiché</label>
      <textarea id="esp-text-value">${escapeHTML(oldText)}</textarea>
      ${isLink ? `
        <label>Adresse du lien</label>
        <input id="esp-link-value" value="${escapeHTML(element.href)}">
      ` : ""}
      <label>Couleur du texte</label>
      <input type="color" id="esp-text-color" value="${toHex(getComputedStyle(element).color)}">
      <label>Taille du texte (px)</label>
      <input type="number" min="8" max="160" id="esp-text-size" value="${parseFloat(getComputedStyle(element).fontSize) || 16}">
      <label>Police</label>
      <select id="esp-text-font">
        <option value="">Conserver la police actuelle</option>
        <option value="DM Sans">DM Sans</option>
        <option value="Barlow Condensed">Barlow Condensed</option>
        <option value="Arial">Arial</option>
        <option value="Georgia">Georgia</option>
      </select>
      <label>Graisse</label>
      <select id="esp-text-weight">
        <option value="400">Normale</option><option value="600">Semi-gras</option><option value="800">Gras</option><option value="900">Extra-gras</option>
      </select>
      <label>Couleur de fond</label>
      <input type="color" id="esp-text-bg" value="${toHex(getComputedStyle(element).backgroundColor)}">
      <label>Espacement des lettres (px)</label>
      <input type="number" min="-3" max="20" step="0.5" id="esp-text-spacing" value="${parseFloat(getComputedStyle(element).letterSpacing) || 0}">
      <label>Déplacement horizontal (px)</label><input type="number" id="esp-move-x" value="0">
      <label>Déplacement vertical (px)</label><input type="number" id="esp-move-y" value="0">
      <label>Largeur (px, 0 = automatique)</label><input type="number" min="0" max="2000" id="esp-element-width" value="0">
      <label>Espacement intérieur (px)</label><input type="number" min="0" max="200" id="esp-element-padding" value="0">
      <button class="esp-btn" id="esp-reset-text-style">RESTAURER LE STYLE D'ORIGINE</button>
      <button class="esp-btn" id="esp-hide-element">MASQUER CET ÉLÉMENT</button>
      <button class="esp-btn primary" id="esp-apply-text">APPLIQUER</button>
      <button class="esp-btn" id="esp-cancel-text">ANNULER</button>
    `);

    $("#esp-cancel-text").onclick = closeMenu;
    $("#esp-reset-text-style").onclick = async () => {
      try {
        await recordUndo("Réinitialiser le style d'un texte");
        const saved = settings.styles[key] || {};
        ["color","fontSize","fontFamily","fontWeight","letterSpacing","backgroundColor","transform","width","padding"].forEach(prop => {
          delete saved[prop];
          element.style[prop] = "";
        });
        if (Object.keys(saved).length) settings.styles[key] = saved;
        else delete settings.styles[key];
        closeMenu();
        await saveSettings(true);
        message("Le style d'origine du texte a été restauré.");
      } catch (error) {
        message("Impossible de restaurer le style : " + error.message);
      }
    };

    $("#esp-apply-text").onclick = async () => {
      try { await recordUndo("Modification d'un texte"); }
      catch (error) { message("Impossible de créer le point de retour : " + error.message); return; }
      const value = $("#esp-text-value").value;
      replaceTextSafely(element, value);
      settings.texts[key] = value;

      const color = $("#esp-text-color").value;
      const size = Math.max(8, Math.min(160, Number($("#esp-text-size").value || 16)));
      const font = $("#esp-text-font").value;
      const weight = $("#esp-text-weight").value;
      const bg = $("#esp-text-bg").value;
      const spacing = Number($("#esp-text-spacing").value || 0);
      const moveX = Number($("#esp-move-x").value || 0);
      const moveY = Number($("#esp-move-y").value || 0);
      const width = Number($("#esp-element-width").value || 0);
      const padding = Number($("#esp-element-padding").value || 0);
      element.style.color = color;
      element.style.fontSize = size + "px";
      element.style.fontWeight = weight;
      element.style.letterSpacing = spacing + "px";
      if (font) element.style.fontFamily = font;
      if (bg) element.style.backgroundColor = bg;
      element.style.transform = "translate(" + moveX + "px," + moveY + "px)";
      element.style.width = width ? width + "px" : "";
      element.style.padding = padding ? padding + "px" : "";
      settings.styles[key] ||= {};
      Object.assign(settings.styles[key], {
        color, fontSize: size + "px", fontWeight: weight,
        letterSpacing: spacing + "px", transform: element.style.transform,
        width: element.style.width, padding: element.style.padding,
        ...(font ? {fontFamily:font} : {}), backgroundColor:bg
      });

      if (isLink) {
        const rawUrl = $("#esp-link-value").value.trim();

        try {
          const url = new URL(rawUrl, location.href);
          if (!["http:", "https:", "mailto:", "tel:"].includes(url.protocol)) {
            throw new Error("Protocole non autorisé");
          }

          element.href = url.href;
          settings.links[key] = url.href;
        } catch {
          message("Lien invalide.");
          return;
        }
      }

      closeMenu();
      saveSettings(true).catch(error =>
        message("Erreur de sauvegarde : " + error.message)
      );
    };
    $("#esp-hide-element").onclick = async () => {
      if (!confirm("Masquer cet élément du site ?")) return;
      try { await recordUndo("Masquer un élément"); }
      catch (error) { message("Impossible de créer le point de retour : " + error.message); return; }
      element.style.display = "none";
      settings.styles[key] ||= {};
      settings.styles[key].display = "none";
      closeMenu();
      try { await saveSettings(true); message("Élément masqué."); }
      catch (error) { message("Erreur : " + error.message); }
    };
  }

  function toHex(color) {
    if (color.startsWith("#")) return color;
    const values = color.match(/\d+/g);
    if (!values || values.length < 3) return "#ffffff";
    return "#" + values.slice(0, 3)
      .map(value => Number(value).toString(16).padStart(2, "0"))
      .join("");
  }

  function replaceTextSafely(element, value) {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let first = null;
    const rest = [];

    while (walker.nextNode()) {
      if (walker.currentNode.nodeValue.trim()) {
        if (!first) first = walker.currentNode;
        else rest.push(walker.currentNode);
      }
    }

    if (first) {
      first.nodeValue = value;
      rest.forEach(node => node.remove());
    } else {
      element.append(document.createTextNode(value));
    }
  }


  function applyHeroStampSettings() {
    const stamp = document.querySelector(".hero-stamp");
    const saved = settings.heroStamp || {};
    if (!stamp) return;
    if (saved.imageUrl) {
      stamp.replaceChildren();
      const image = document.createElement("img");
      image.src = saved.imageUrl;
      image.alt = "European Satfeed Premium";
      image.style.cssText = "position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center;border-radius:50%;clip-path:circle(50% at 50% 50%);";
      stamp.style.borderRadius = "50%";
      stamp.append(image);
    } else if (Object.keys(saved).length) {
      stamp.innerHTML = '<span class="esp-stamp-top">EST.</span><b class="esp-stamp-center">ES+</b><span class="esp-stamp-bottom">PREMIUM</span>';
      const top = stamp.querySelector(".esp-stamp-top");
      const center = stamp.querySelector(".esp-stamp-center");
      const bottom = stamp.querySelector(".esp-stamp-bottom");
      top.textContent = saved.topText ?? "EST.";
      center.textContent = saved.centerText ?? "ES+";
      bottom.textContent = saved.bottomText ?? "PREMIUM";
      top.style.color = saved.smallColor || "#aab2bf";
      bottom.style.color = saved.smallColor || "#aab2bf";
      center.style.color = saved.centerColor || "#eaff00";
      top.style.fontSize = (saved.smallSize || 8) + "px";
      bottom.style.fontSize = (saved.smallSize || 8) + "px";
      center.style.fontSize = (saved.centerSize || 37) + "px";
      stamp.style.fontFamily = saved.fontFamily || "Barlow Condensed";
    }
    if (saved.diameter) { stamp.style.width = saved.diameter + "px"; stamp.style.height = saved.diameter + "px"; }
    if (saved.borderColor) stamp.style.borderColor = saved.borderColor;
    if (saved.borderWidth !== undefined) stamp.style.borderWidth = saved.borderWidth + "px";
    if (saved.backgroundColor) stamp.style.backgroundColor = saved.backgroundColor;
    if (saved.rotation !== undefined) stamp.style.transform = "rotate(" + saved.rotation + "deg)";
    if (saved.glowColor) stamp.style.boxShadow = "0 0 28px " + saved.glowColor + "66";
    if (saved.right !== undefined) stamp.style.right = saved.right + "%";
    if (saved.bottom !== undefined) stamp.style.bottom = saved.bottom + "%";
  }

  function openHeroStampEditor(stamp) {
    const saved = settings.heroStamp || {};
    const current = stamp.querySelector(".esp-stamp-center") || stamp.querySelector("b");
    const top = stamp.querySelector(".esp-stamp-top") || stamp.querySelector("span:first-of-type");
    const bottom = stamp.querySelector(".esp-stamp-bottom") || stamp.querySelector("span:last-of-type");
    const html = [
      "<h3>MODIFIER LE LOGO CIRCULAIRE</h3>",
      "<p class='esp-muted'>Ce panneau modifie le logo EST. / ES+ / PREMIUM de la bannière, pas le petit logo du menu.</p>",
      "<label>Texte supérieur</label><input id='esp-seal-top' type='text'>",
      "<label>Texte central</label><input id='esp-seal-center' type='text'>",
      "<label>Texte inférieur</label><input id='esp-seal-bottom' type='text'>",
      "<label>Couleur du texte central</label><input id='esp-seal-center-color' type='color'>",
      "<label>Couleur des textes secondaires</label><input id='esp-seal-small-color' type='color'>",
      "<label>Taille du texte central (px)</label><input id='esp-seal-center-size' type='number' min='12' max='100'>",
      "<label>Taille des textes secondaires (px)</label><input id='esp-seal-small-size' type='number' min='6' max='40'>",
      "<label>Police</label><select id='esp-seal-font'><option value='Barlow Condensed'>Barlow Condensed</option><option value='DM Sans'>DM Sans</option><option value='Arial'>Arial</option><option value='Georgia'>Georgia</option></select>",
      "<label>Diamètre du cercle (px)</label><input id='esp-seal-diameter' type='number' min='60' max='500'>",
      "<label>Couleur du contour</label><input id='esp-seal-border' type='color'>",
      "<label>Épaisseur du contour (px)</label><input id='esp-seal-border-width' type='number' min='0' max='12'>",
      "<label>Couleur de fond</label><input id='esp-seal-background' type='color'>",
      "<label>Rotation (degrés)</label><input id='esp-seal-rotation' type='number' min='-180' max='180'>",
      "<label>Position droite (%)</label><input id='esp-seal-right' type='number' min='0' max='90'>",
      "<label>Position bas (%)</label><input id='esp-seal-bottom' type='number' min='0' max='90'>",
      "<label>Couleur du halo lumineux</label><input id='esp-seal-glow' type='color'>",
      "<label>Ou remplacer par une image complète</label><input id='esp-seal-image' type='file' accept='image/*'>",
      "<button class='esp-btn primary' id='esp-seal-save'>ENREGISTRER</button>",
      "<button class='esp-btn' id='esp-seal-reset'>RESTAURER LE LOGO ORIGINAL</button>",
      "<button class='esp-btn' id='esp-seal-cancel'>ANNULER</button>"
    ].join("");
    showMenu(html);
    $("#esp-seal-top").value = saved.topText ?? top?.textContent ?? "EST.";
    $("#esp-seal-center").value = saved.centerText ?? current?.textContent ?? "ES+";
    $("#esp-seal-bottom").value = saved.bottomText ?? bottom?.textContent ?? "PREMIUM";
    $("#esp-seal-center-color").value = saved.centerColor || "#eaff00";
    $("#esp-seal-small-color").value = saved.smallColor || "#aab2bf";
    $("#esp-seal-center-size").value = saved.centerSize || 37;
    $("#esp-seal-small-size").value = saved.smallSize || 8;
    $("#esp-seal-font").value = saved.fontFamily || "Barlow Condensed";
    $("#esp-seal-diameter").value = saved.diameter || Math.round(stamp.getBoundingClientRect().width) || 165;
    $("#esp-seal-border").value = saved.borderColor || "#ffffff";
    $("#esp-seal-border-width").value = saved.borderWidth ?? 1;
    $("#esp-seal-background").value = saved.backgroundColor || "#080b12";
    $("#esp-seal-rotation").value = saved.rotation ?? 12;
    $("#esp-seal-right").value = saved.right ?? 18;
    $("#esp-seal-bottom").value = saved.bottom ?? 15;
    $("#esp-seal-glow").value = saved.glowColor || "#eaff00";
    $("#esp-seal-cancel").onclick = closeMenu;
    $("#esp-seal-save").onclick = async () => {
      try {
        await recordUndo("Modifier le logo circulaire");
        const file = $("#esp-seal-image").files?.[0];
        const next = {
          topText: $("#esp-seal-top").value,
          centerText: $("#esp-seal-center").value,
          bottomText: $("#esp-seal-bottom").value,
          centerColor: $("#esp-seal-center-color").value,
          smallColor: $("#esp-seal-small-color").value,
          centerSize: Math.max(12, Math.min(100, Number($("#esp-seal-center-size").value || 37))),
          smallSize: Math.max(6, Math.min(40, Number($("#esp-seal-small-size").value || 8))),
          fontFamily: $("#esp-seal-font").value,
          diameter: Math.max(60, Math.min(500, Number($("#esp-seal-diameter").value || 165))),
          borderColor: $("#esp-seal-border").value,
          borderWidth: Math.max(0, Math.min(12, Number($("#esp-seal-border-width").value || 0))),
          backgroundColor: $("#esp-seal-background").value,
          rotation: Math.max(-180, Math.min(180, Number($("#esp-seal-rotation").value || 0))),
          right: Math.max(0, Math.min(90, Number($("#esp-seal-right").value || 18))),
          bottom: Math.max(0, Math.min(90, Number($("#esp-seal-bottom").value || 15))),
          glowColor: $("#esp-seal-glow").value
        };
        if (file) next.imageUrl = await uploadImage(file);
        else if (saved.imageUrl) next.imageUrl = saved.imageUrl;
        settings.heroStamp = next;
        applyHeroStampSettings();
        await saveSettings(true);
        closeMenu();
        message("Logo circulaire modifié et enregistré.");
      } catch (error) {
        message("Impossible d'enregistrer le logo : " + error.message);
      }
    };
    $("#esp-seal-reset").onclick = async () => {
      try {
        await recordUndo("Restaurer le logo circulaire");
        delete settings.heroStamp;
        stamp.innerHTML = "<span>EST.</span><b>ES+</b><span>PREMIUM</span>";
        stamp.removeAttribute("style");
        await saveSettings(true);
        closeMenu();
        message("Le logo circulaire original est restauré.");
      } catch (error) {
        message("Impossible de restaurer le logo : " + error.message);
      }
    };
  }



  function applyPremiumStampSettings() {
    const aside = document.querySelector(".premium-aside");
    const saved = settings.premiumStamp || {};
    if (!aside) return;

    if (!saved.enabled) {
      aside.classList.remove("esp-premium-round");
      aside.innerHTML = "<span>EUROPEAN<br>SATFEED<br>PREMIUM</span><b>ES+</b><span>MEMBERS ONLY</span>";
      aside.removeAttribute("style");
      return;
    }

    aside.innerHTML = "";
    aside.classList.add("esp-premium-round");
    aside.style.position = "relative";
    aside.style.boxSizing = "border-box";
    aside.style.width = (saved.diameter || 240) + "px";
    aside.style.height = (saved.diameter || 240) + "px";
    aside.style.minWidth = (saved.diameter || 240) + "px";
    aside.style.padding = "0";
    aside.style.borderRadius = "50%";
    aside.style.overflow = "hidden";
    aside.style.display = "flex";
    aside.style.flexDirection = "column";
    aside.style.alignItems = "center";
    aside.style.justifyContent = "space-between";
    aside.style.transform = "rotate(" + (saved.rotation || 0) + "deg)";
    aside.style.background = saved.backgroundColor || "#080b12";
    aside.style.border = (saved.borderWidth ?? 1) + "px solid " + (saved.borderColor || "#ffffff55");
    aside.style.boxShadow = "0 0 30px " + (saved.glowColor || "#eaff00") + "66";

    if (saved.imageUrl) {
      const image = document.createElement("img");
      image.src = saved.imageUrl;
      image.alt = "Logo European Satfeed Premium";
      image.style.cssText = "position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center;border-radius:50%;clip-path:circle(50% at 50% 50%);";
      aside.append(image);
    } else {
      const center = document.createElement("b");
      center.textContent = saved.centerText || "ES+";
      center.style.cssText = "position:absolute;left:8%;right:8%;top:50%;transform:translateY(-50%);text-align:center;z-index:2;font:900 " + (saved.centerSize || 82) + "px 'Barlow Condensed',sans-serif;color:" + (saved.centerColor || "#eaff00") + ";line-height:.9;";
      aside.append(center);
    }

    if (saved.topText) {
      const top = document.createElement("span");
      top.textContent = saved.topText;
      top.style.cssText = "position:absolute;top:13%;left:8%;right:8%;z-index:3;text-align:center;color:" + (saved.smallColor || "#aab2bf") + ";font:700 " + (saved.smallSize || 9) + "px 'DM Sans',sans-serif;letter-spacing:2px;";
      aside.append(top);
    }
    if (saved.bottomText) {
      const bottom = document.createElement("span");
      bottom.textContent = saved.bottomText;
      bottom.style.cssText = "position:absolute;bottom:13%;left:8%;right:8%;z-index:3;text-align:center;color:" + (saved.smallColor || "#aab2bf") + ";font:700 " + (saved.smallSize || 9) + "px 'DM Sans',sans-serif;letter-spacing:2px;";
      aside.append(bottom);
    }
  }

  function openPremiumStampEditor(aside) {
    const saved = settings.premiumStamp || {};
    const html = [
      "<h3>MODIFIER LE LOGO ES+ DE LA SECTION PREMIUM</h3>",
      "<p class='esp-muted'>Ce réglage concerne le grand ES+ à droite de GO PREMIUM, indépendamment du logo circulaire de la bannière.</p>",
      "<label><input type='checkbox' id='esp-premium-round-enabled' style='width:auto' checked> Afficher en logo rond</label>",
      "<label>Texte supérieur (facultatif)</label><input id='esp-premium-top' type='text'>",
      "<label>Texte central</label><input id='esp-premium-center' type='text'>",
      "<label>Texte inférieur (facultatif)</label><input id='esp-premium-bottom' type='text'>",
      "<label>Image de logo complète (facultatif)</label><input id='esp-premium-image' type='file' accept='image/*'>",
      "<label>Diamètre du cercle (px)</label><input id='esp-premium-diameter' type='number' min='80' max='600'>",
      "<label>Taille du texte central (px)</label><input id='esp-premium-center-size' type='number' min='12' max='180'>",
      "<label>Taille des petits textes (px)</label><input id='esp-premium-small-size' type='number' min='6' max='30'>",
      "<label>Couleur du texte central</label><input id='esp-premium-center-color' type='color'>",
      "<label>Couleur des textes secondaires</label><input id='esp-premium-small-color' type='color'>",
      "<label>Couleur du fond</label><input id='esp-premium-background' type='color'>",
      "<label>Couleur du contour</label><input id='esp-premium-border' type='color'>",
      "<label>Épaisseur du contour (px)</label><input id='esp-premium-border-width' type='number' min='0' max='12'>",
      "<label>Couleur du halo</label><input id='esp-premium-glow' type='color'>",
      "<label>Rotation (degrés)</label><input id='esp-premium-rotation' type='number' min='-180' max='180'>",
      "<button class='esp-btn primary' id='esp-premium-save'>ENREGISTRER LE LOGO</button>",
      "<button class='esp-btn' id='esp-premium-reset'>RESTAURER LE ES+ RECTANGULAIRE</button>",
      "<button class='esp-btn' id='esp-premium-cancel'>ANNULER</button>"
    ].join("");

    showMenu(html);
    $("#esp-premium-round-enabled").checked = saved.enabled !== false;
    $("#esp-premium-top").value = saved.topText ?? "EUROPEAN SATFEED PREMIUM";
    $("#esp-premium-center").value = saved.centerText ?? "ES+";
    $("#esp-premium-bottom").value = saved.bottomText ?? "MEMBERS ONLY";
    $("#esp-premium-diameter").value = saved.diameter || 240;
    $("#esp-premium-center-size").value = saved.centerSize || 82;
    $("#esp-premium-small-size").value = saved.smallSize || 9;
    $("#esp-premium-center-color").value = saved.centerColor || "#eaff00";
    $("#esp-premium-small-color").value = saved.smallColor || "#aab2bf";
    $("#esp-premium-background").value = saved.backgroundColor || "#080b12";
    $("#esp-premium-border").value = saved.borderColor || "#ffffff";
    $("#esp-premium-border-width").value = saved.borderWidth ?? 1;
    $("#esp-premium-glow").value = saved.glowColor || "#eaff00";
    $("#esp-premium-rotation").value = saved.rotation || 0;
    $("#esp-premium-cancel").onclick = closeMenu;

    $("#esp-premium-save").onclick = async () => {
      try {
        await recordUndo("Modifier le logo ES+ de la section Premium");
        const file = $("#esp-premium-image").files?.[0];
        const next = {
          enabled: $("#esp-premium-round-enabled").checked,
          topText: $("#esp-premium-top").value.trim(),
          centerText: $("#esp-premium-center").value.trim() || "ES+",
          bottomText: $("#esp-premium-bottom").value.trim(),
          diameter: Math.max(80, Math.min(600, Number($("#esp-premium-diameter").value || 240))),
          centerSize: Math.max(12, Math.min(180, Number($("#esp-premium-center-size").value || 82))),
          smallSize: Math.max(6, Math.min(30, Number($("#esp-premium-small-size").value || 9))),
          centerColor: $("#esp-premium-center-color").value,
          smallColor: $("#esp-premium-small-color").value,
          backgroundColor: $("#esp-premium-background").value,
          borderColor: $("#esp-premium-border").value,
          borderWidth: Math.max(0, Math.min(12, Number($("#esp-premium-border-width").value || 0))),
          glowColor: $("#esp-premium-glow").value,
          rotation: Math.max(-180, Math.min(180, Number($("#esp-premium-rotation").value || 0)))
        };
        if (file) next.imageUrl = await uploadImage(file);
        else if (saved.imageUrl) next.imageUrl = saved.imageUrl;
        settings.premiumStamp = next;
        applyPremiumStampSettings();
        await saveSettings(true);
        closeMenu();
        message("Logo ES+ de la section Premium enregistré.");
      } catch (error) {
        message("Impossible d'enregistrer le logo Premium : " + error.message);
      }
    };

    $("#esp-premium-reset").onclick = async () => {
      try {
        await recordUndo("Restaurer le ES+ Premium original");
        delete settings.premiumStamp;
        applyPremiumStampSettings();
        await saveSettings(true);
        closeMenu();
        message("Le ES+ rectangulaire original est restauré.");
      } catch (error) {
        message("Impossible de restaurer le ES+ : " + error.message);
      }
    };
  }


  function openImageEditor(image) {
    const current = image.currentSrc || image.src || "";
    showMenu(`
      <h3>MODIFIER L'IMAGE / LOGO</h3>
      <img src="${escapeHTML(current)}" alt="" style="width:100%;max-height:180px;object-fit:contain;margin-bottom:12px">
      <label>Remplacer par une image</label>
      <input type="file" id="esp-image-file" accept="image/*">
      <button class="esp-btn primary" id="esp-image-save">REMPLACER</button>
      <button class="esp-btn" id="esp-image-cancel">ANNULER</button>
    `);
    $("#esp-image-cancel").onclick = closeMenu;
    $("#esp-image-save").onclick = async () => {
      const file = $("#esp-image-file").files?.[0];
      if (!file) { message("Choisis une image."); return; }
      try {
        await recordUndo("Remplacer une image");
        const url = await uploadImage(file);
        image.src = url;
        image.removeAttribute("srcset");
        const key = image.dataset.espKey ||= elementKey(image);
        settings.images ||= {};
        settings.images[key] = url;
        await saveSettings(true);
        closeMenu();
        message("Image remplacée et enregistrée.");
      } catch (error) {
        message("Remplacement impossible : " + error.message);
      }
    };
  }

  function openLogoEditor(element) {
    const key = element.dataset.espKey ||= elementKey(element);
    showMenu(`
      <h3>MODIFIER LE LOGO</h3>
      <p class="esp-muted">Tu peux remplacer le logo texte par une image, ou revenir au logo ES+ d'origine.</p>
      <label>Nouvelle image du logo</label>
      <input type="file" id="esp-logo-file" accept="image/*">
      <button class="esp-btn primary" id="esp-logo-save">REMPLACER LE LOGO</button>
      <button class="esp-btn" id="esp-logo-reset">REVENIR AU LOGO ES+ TEXTE</button>
      <button class="esp-btn" id="esp-logo-cancel">ANNULER</button>
    `);
    $("#esp-logo-cancel").onclick = closeMenu;
    $("#esp-logo-save").onclick = async () => {
      const file = $("#esp-logo-file").files?.[0];
      if (!file) { message("Choisis une image de logo."); return; }
      try {
        await recordUndo("Remplacer le logo");
        const url = await uploadImage(file);
        settings.logos ||= {};
        settings.logos[key] = url;
        const img = document.createElement("img");
        img.src = url;
        img.alt = "European Satfeed Premium";
        img.className = "esp-custom-logo";
        img.style.cssText = "display:block;width:auto;max-width:110px;max-height:54px;object-fit:contain";
        element.replaceChildren(img);
        await saveSettings(true);
        closeMenu();
        message("Logo remplacé et enregistré.");
      } catch (error) { message("Remplacement du logo impossible : " + error.message); }
    };
    $("#esp-logo-reset").onclick = async () => {
      try {
        await recordUndo("Restaurer le logo texte");
        delete settings.logos[key];
        element.innerHTML = "ES<span>+</span>";
        await saveSettings(true);
        closeMenu();
        message("Logo texte d'origine restauré.");
      } catch (error) { message("Impossible de restaurer le logo : " + error.message); }
    };
  }

  function openSectionEditor(element) {
    const isGlobalBackground = element === document.body;
    const key = isGlobalBackground ? "global:body" : (element.dataset.espKey ||= elementKey(element));
    const backgroundColor = isGlobalBackground
      ? (settings.global?.backgroundColor || getComputedStyle(element).backgroundColor)
      : getComputedStyle(element).backgroundColor;

    showMenu(`
      <h3>APPARENCE DE LA SECTION</h3>
      <label>Couleur du fond</label>
      <input type="color" id="esp-section-color" value="${toHex(backgroundColor)}">
      <p class="esp-muted">${isGlobalBackground ? "Fond général de tout le site" : "Fond de cette section"}</p>
      <label>Image de fond</label>
      <input type="file" id="esp-section-image" accept="image/*">
      <button class="esp-btn" id="esp-section-remove-image" type="button">RETIRER L'IMAGE DE FOND</button>
      <label>Opacité de la section (%)</label>
      <input type="number" min="10" max="100" id="esp-section-opacity" value="${Math.round((Number(getComputedStyle(element).opacity) || 1) * 100)}">
      <label>Effet lumineux (glow)</label>
      <input type="color" id="esp-section-glow" value="#eaff00">
      <button class="esp-btn primary" id="esp-section-save">ENREGISTRER</button>
      <button class="esp-btn" id="esp-section-cancel">FERMER</button>
    `);

    $("#esp-section-cancel").onclick = closeMenu;

    $("#esp-section-save").onclick = async () => {
      try { await recordUndo("Modifier le fond d'une section"); }
      catch (error) { message("Impossible de créer le point de retour : " + error.message); return; }
      const color = $("#esp-section-color").value;
      const opacity = Math.max(10, Math.min(100, Number($("#esp-section-opacity").value || 100))) / 100;
      const glow = $("#esp-section-glow").value;
      if (isGlobalBackground) {
        settings.global ||= {};
        settings.global.backgroundColor = color;
        document.documentElement.style.setProperty("--bg", color);
        document.body.style.backgroundColor = color;
      } else {
        element.style.backgroundColor = color;
        settings.styles[key] ||= {};
        settings.styles[key].backgroundColor = color;
        element.style.opacity = opacity;
        element.style.boxShadow = "0 0 35px " + glow + "55";
        settings.styles[key].opacity = String(opacity);
        settings.styles[key].boxShadow = element.style.boxShadow;
      }
      const file = $("#esp-section-image").files?.[0];

      try {
        if (file) {
          const imageUrl = await uploadImage(file);
          const backgroundImage = `url("${imageUrl}")`;

          element.style.backgroundImage = backgroundImage;
          element.style.backgroundSize = "cover";
          element.style.backgroundPosition = "center";

          if (isGlobalBackground) {
            settings.global ||= {};
            settings.global.backgroundImage = backgroundImage;
            settings.global.backgroundSize = "cover";
            settings.global.backgroundPosition = "center";
            document.body.style.backgroundAttachment = "fixed";
          } else {
            settings.styles[key] ||= {};
            settings.styles[key].backgroundImage = backgroundImage;
          }
        }

        await saveSettings(true);
        closeMenu();
        message("Apparence enregistrée.");
      } catch (error) {
        message("Erreur : " + error.message);
      }
    };
    $("#esp-section-remove-image").onclick = async () => {
      try {
        await recordUndo("Retirer une image de fond");
        element.style.backgroundImage = "none";
        if (isGlobalBackground) {
          settings.global ||= {};
          delete settings.global.backgroundImage;
        } else if (settings.styles[key]) {
          delete settings.styles[key].backgroundImage;
        }
        await saveSettings(true);
        message("Image de fond retirée.");
      } catch (error) {
        message("Impossible de retirer l'image : " + error.message);
      }
    };
  }

  function switchTab(tab) {
    currentTab = tab;

    document.querySelectorAll(".esp-admin-tabs button").forEach(button => {
      button.classList.toggle("active", button.dataset.tab === tab);
    });

    ["catalogue", "hidden", "site", "appearance"].forEach(name => {
      const section = $(`#esp-tab-${name}`);
      if (section) section.hidden = name !== tab;
    });
  }

  async function openAdmin() {
    if (!(await checkOwner())) {
      showLogin();
      return;
    }

    admin.classList.add("open");
    toolbar.style.display = "none";
    switchTab("catalogue");

    try {
      await loadCatalogueAdmin();
      await loadSettings();
      switchTab("catalogue");
    } catch (error) {
      message("Erreur de chargement ADMIN : " + error.message);
    }
  }

  $("#esp-login-close").onclick = () => login.classList.remove("open");

  $("#esp-login-form").addEventListener("submit", async event => {
    event.preventDefault();

    const output = $("#esp-login-message");
    output.textContent = "Connexion…";

    const { error } = await db.auth.signInWithPassword({
      email: $("#esp-email").value.trim(),
      password: $("#esp-password").value
    });

    if (error) {
      output.textContent = error.message;
      return;
    }

    try {
      if (!(await checkOwner())) {
        await db.auth.signOut();
        throw new Error("Ce compte n'est pas autorisé.");
      }

      login.classList.remove("open");
      admin.classList.remove("open");
      editing = true;
      document.body.classList.add("esp-editing");
      toolbar.style.display = "none";
      await loadCatalogueAdmin();
      await loadSettings();
      prepareEditableElements();
      editControls.style.display = "flex";
      message("Mode édition direct activé. Clique sur ↶ RETOUR ARRIÈRE pour annuler la dernière modification.");
    } catch (error) {
      output.textContent = error.message;
    }
  });

  $("#esp-logout").onclick = async () => {
    await db.auth.signOut();
    admin.classList.remove("open");
    toolbar.style.display = "none";
    editing = false;
    document.body.classList.remove("esp-editing");
    editControls.style.display = "none";
  };

  $("#esp-view-site").onclick = async () => { admin.classList.remove("open"); editing = true; document.body.classList.add("esp-editing"); toolbar.style.display = "none"; await loadCatalogueAdmin(); await loadSettings(); prepareEditableElements(); editControls.style.display = "flex"; };




  $("#esp-add-cover").addEventListener("click", () => {
    switchTab("catalogue");
    openCoverEditor(null);
  });
  $("#esp-bulk-files").addEventListener("change", () => {
    const count = $("#esp-bulk-files").files?.length || 0;
    $("#esp-bulk-count").textContent = count
      ? count + " image(s) sélectionnée(s)."
      : "Aucune image sélectionnée.";
  });
  $("#esp-bulk-upload").onclick = importBulkCovers;

  $("#esp-search").addEventListener("input", renderAdminCatalogue);
  $("#esp-filter").addEventListener("change", renderAdminCatalogue);

  document.querySelectorAll(".esp-admin-tabs button").forEach(button => {
    button.addEventListener("click", () => switchTab(button.dataset.tab));
  });

  $("#esp-toggle-edit").onclick = () => {
    editing = !editing;
    document.body.classList.toggle("esp-editing", editing);
    $("#esp-toggle-edit").textContent = editing
      ? "TERMINER L'ÉDITION DIRECTE"
      : "ACTIVER L'ÉDITION DIRECTE";
    prepareEditableElements();
  };

  $("#esp-save-settings").onclick = async () => {
    try {
      await saveSettings();
    } catch (error) {
      message("Sauvegarde impossible : " + error.message);
    }
  };

  $("#esp-save-appearance").onclick = async () => {
    try {
      await recordUndo("Modifier l'apparence générale");
    } catch (error) {
      message("Impossible de créer le point de retour : " + error.message);
      return;
    }
    const main = $("#esp-main-color").value;
    const background = $("#esp-bg-color").value;

    document.documentElement.style.setProperty("--yellow", main);
    document.documentElement.style.setProperty("--bg", background);

    settings.global ||= {};
    settings.global.mainColor = main;
    settings.global.backgroundColor = background;

    try {
      await saveSettings();
      message("Apparence enregistrée.");
    } catch (error) {
      message("Erreur : " + error.message);
    }
  };

  document.addEventListener("click", event => {
    if (!owner || !editing || admin.classList.contains("open")) return;

    if (event.target.closest("#esp-edit-controls")) return;
    if (event.target.closest("#esp-admin,#esp-login,#esp-menu,.esp-toolbar")) return;

    const card = event.target.closest(".archive-card");

    if (card) {
      event.preventDefault();
      event.stopPropagation();

      const item = allItems.find(entry =>
        String(entry.id) === String(card.dataset.catalogueId)
      );

      if (item) {
        openCoverEditor(item);
      } else if (card.dataset.catalogueSource === "github") {
        const image = card.querySelector(".cover img");
        const title = card.querySelector(".catalogue-title");
        const tag = card.querySelector(".card-tag");
        openCoverEditor({
          id: card.dataset.catalogueId,
          source: "github",
          title: { fr: title?.textContent || "", en: title?.textContent || "" },
          description: { fr: "", en: "" },
          category: (tag?.textContent || "unclassified").toLowerCase(),
          image_url: image?.currentSrc || image?.src || "",
          published: true,
          position: window.ESP_CATALOGUE?.getItems?.().length || 0
        });
      } else {
        message("Cette cover n'a pas pu être identifiée.");
      }
      return;
    }

    const premiumStamp = event.target.closest(".premium-aside");
    if (premiumStamp) {
      event.preventDefault();
      event.stopPropagation();
      openPremiumStampEditor(premiumStamp);
      return;
    }

    const heroStamp = event.target.closest(".hero-stamp");
    if (heroStamp) {
      event.preventDefault();
      event.stopPropagation();
      openHeroStampEditor(heroStamp);
      return;
    }

    const logo = event.target.closest(".brand-mark");
    if (logo) {
      event.preventDefault();
      event.stopPropagation();
      openLogoEditor(logo);
      return;
    }

    const image = event.target.closest("img");
    if (image && (image.closest(".brand") || image.closest(".hero"))) {
      event.preventDefault();
      event.stopPropagation();
      openImageEditor(image);
      return;
    }

    const editable = event.target.closest('[data-esp-editable="true"]');

    if (editable) {
      event.preventDefault();
      event.stopPropagation();
      openTextEditor(editable);
      return;
    }

    const section = event.target.closest(
      ".topline,.header,.hero,.ticker,.archive-section," +
      ".latest-section,.included-section,.premium-section," +
      ".faq-section,.footer,.header,.brand,main,body"
    );

    if (section) {
      event.preventDefault();
      event.stopPropagation();
      section.dataset.espKey ||= elementKey(section);
      openSectionEditor(section);
    }
  }, true);

  // Raccourci ordinateur : Ctrl + Maj + E.
  document.addEventListener("keydown", async event => {
    if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "a") {
      event.preventDefault();
      try {
        if (await checkOwner()) await openAdmin();
        else showLogin();
      } catch (error) { message(error.message); }
      return;
    }

    if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "e") {
      event.preventDefault();

      try {
        if (!(await checkOwner())) {
          showLogin();
          return;
        }
        if (editing) {
          finishDirectEditing();
          message("Mode édition terminé. Tu peux naviguer normalement sur le site.");
          return;
        }
        admin.classList.remove("open");
        editing = true;
        document.body.classList.add("esp-editing");
        await loadCatalogueAdmin();
        await loadSettings();
        prepareEditableElements();
        editControls.style.display = "flex";
        message("Mode édition activé.");
      } catch (error) {
        message(error.message);
      }
    }

    if (event.key === "Escape") {
      closeMenu();
      login.classList.remove("open");
    }
  });

  // Raccourci téléphone : appuyer cinq fois sur le logo ES+.
  const brand = $(".brand");

  if (brand) {
    let taps = 0;
    let tapTimer;

    brand.addEventListener("click", event => {
      taps++;
      clearTimeout(tapTimer);

      tapTimer = setTimeout(() => {
        taps = 0;
      }, 1500);

      if (taps >= 5) {
        taps = 0;
        event.preventDefault();

        checkOwner().then(authorized => {
          if (authorized) {
            admin.classList.remove("open");
            editing = true;
            document.body.classList.add("esp-editing");
            toolbar.style.display = "none";
            Promise.all([loadCatalogueAdmin(), loadSettings()]).then(() => {
              prepareEditableElements();
              editControls.style.display = "flex";
            });
          } else showLogin();
        }).catch(error => message(error.message));
      }
    });
  }

  function finishDirectEditing() {
    editing = false;
    document.body.classList.remove("esp-editing");
    editControls.style.display = "none";
    closeMenu();
  }

  finishEditControl.addEventListener("click", finishDirectEditing);
  undoControl.addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();
    undoLastChange();
  });
  document.addEventListener("keydown", event => {
    if (owner && editing && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
      const active = document.activeElement;
      if (active && ["INPUT","TEXTAREA","SELECT"].includes(active.tagName)) return;
      event.preventDefault();
      undoLastChange();
    }
  });

  db.auth.onAuthStateChange((_event, session) => {
    owner = isOwnerSession(session);

    if (!owner) {
      admin.classList.remove("open");
      toolbar.style.display = "none";
      editing = false;
      document.body.classList.remove("esp-editing");
      editControls.style.display = "none";
    }
  });

  checkOwner().then(async authorized => {
    if (authorized) {
      await loadCatalogueAdmin();
      await loadSettings();
      editing = true;
      document.body.classList.add("esp-editing");
      editControls.style.display = "flex";
      prepareEditableElements();
    }
  }).catch(error => {
    console.warn("ADMIN :", error.message);
  });
})();
