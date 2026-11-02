/* EUROPEAN SATFEED PREMIUM — OWNER CMS */
(() => {
  "use strict";

  const SUPABASE_URL = "https://afipejmgjkigcbohsxkt.supabase.co";
  const SUPABASE_KEY = "sb_publishable_MWi4yR-uw_TfrXJJrKdS1Q_783VTF6Z";
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
          <button class="esp-btn" id="esp-view-site">VOIR LE SITE</button>
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
        <div class="esp-panel">
          <div class="esp-row">
            <div>
              <h3>TOUTES LES COVERS</h3>
              <p class="esp-muted">Gère tes covers depuis une seule liste.</p>
            </div>
            <button class="esp-btn primary" id="esp-add-cover">+ AJOUTER UNE COVER</button>
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
  toolbar.innerHTML = `
    <button id="esp-open-admin">OUVRIR ADMIN</button>
    <button id="esp-exit-edit">QUITTER ÉDITION</button>
  `;
  document.body.append(toolbar);

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
      "h1,h2,h3,p,a,button,summary,.topline,.hero,.ticker," +
      ".archive-section,.latest-section,.included-section," +
      ".premium-section,.faq-section,.footer"
    ).forEach(element => {
      if (element.closest("#esp-admin,#esp-login,#esp-menu,.esp-toolbar")) return;
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
  }

  async function loadCatalogueAdmin() {
    const { data, error } = await db
      .from("catalogue")
      .select("id,title,description,category,image_url,published,position")
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

    const hidden = allItems.filter(item => item.published === false);

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

      <button class="esp-btn primary" id="esp-cover-save">
        ENREGISTRER
      </button>
      <button class="esp-btn" id="esp-cover-cancel">ANNULER</button>
    `);

    $("#esp-cover-cancel").onclick = closeMenu;

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

        if (item) {
          result = await db.from("catalogue")
            .update(changes)
            .eq("id", item.id);
        } else {
          result = await db.from("catalogue").insert(changes);
        }

        if (result.error) throw result.error;

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

  async function togglePublished(item) {
    try {
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

    if (!confirm(`Supprimer la fiche « ${title} » ?\n\nLe fichier image ne sera pas supprimé du stockage.`)) {
      return;
    }

    try {
      const { error } = await db.from("catalogue")
        .delete()
        .eq("id", item.id);

      if (error) throw error;

      await refreshAdminAndPublic();
      message("Fiche supprimée. Le fichier image est conservé.");
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
      <button class="esp-btn primary" id="esp-apply-text">APPLIQUER</button>
      <button class="esp-btn" id="esp-cancel-text">ANNULER</button>
    `);

    $("#esp-cancel-text").onclick = closeMenu;

    $("#esp-apply-text").onclick = () => {
      const value = $("#esp-text-value").value;
      replaceTextSafely(element, value);
      settings.texts[key] = value;

      const color = $("#esp-text-color").value;
      element.style.color = color;
      settings.styles[key] ||= {};
      settings.styles[key].color = color;

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

  function openSectionEditor(element) {
    const key = element.dataset.espKey;

    showMenu(`
      <h3>APPARENCE DE LA SECTION</h3>
      <label>Couleur du fond</label>
      <input type="color" id="esp-section-color" value="${toHex(getComputedStyle(element).backgroundColor)}">
      <label>Image de fond</label>
      <input type="file" id="esp-section-image" accept="image/*">
      <button class="esp-btn primary" id="esp-section-save">ENREGISTRER</button>
      <button class="esp-btn" id="esp-section-cancel">FERMER</button>
    `);

    $("#esp-section-cancel").onclick = closeMenu;

    $("#esp-section-save").onclick = async () => {
      const color = $("#esp-section-color").value;
      element.style.backgroundColor = color;
      settings.styles[key] ||= {};
      settings.styles[key].backgroundColor = color;

      const file = $("#esp-section-image").files?.[0];

      try {
        if (file) {
          const imageUrl = await uploadImage(file);
          const backgroundImage = `url("${imageUrl}")`;

          element.style.backgroundImage = backgroundImage;
          element.style.backgroundSize = "cover";
          element.style.backgroundPosition = "center";

          settings.styles[key].backgroundImage = backgroundImage;
        }

        await saveSettings(true);
        closeMenu();
        message("Apparence enregistrée.");
      } catch (error) {
        message("Erreur : " + error.message);
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
    toolbar.style.display = "flex";

    try {
      await loadCatalogueAdmin();
      await loadSettings();
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
      await openAdmin();
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
  };

  $("#esp-view-site").onclick = () => admin.classList.remove("open");
  $("#esp-open-admin").onclick = openAdmin;

  $("#esp-exit-edit").onclick = () => {
    editing = false;
    document.body.classList.remove("esp-editing");
    toolbar.style.display = "none";
  };

  $("#esp-add-cover").onclick = () => openCoverEditor();

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

    if (event.target.closest("#esp-admin,#esp-login,#esp-menu,.esp-toolbar")) return;

    const card = event.target.closest(".archive-card");

    if (card) {
      event.preventDefault();
      event.stopPropagation();

      const item = allItems.find(entry =>
        String(entry.id) === String(card.dataset.catalogueId)
      );

      if (item) openCoverEditor(item);
      else message("Cette cover provient de GitHub. Importe-la dans Supabase depuis la gestion du catalogue pour la modifier.");
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
      ".faq-section,.footer"
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
    if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "e") {
      event.preventDefault();

      try {
        if (await checkOwner()) await openAdmin();
        else showLogin();
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
          if (authorized) openAdmin();
          else showLogin();
        }).catch(error => message(error.message));
      }
    });
  }

  db.auth.onAuthStateChange((_event, session) => {
    owner = isOwnerSession(session);

    if (!owner) {
      admin.classList.remove("open");
      toolbar.style.display = "none";
      editing = false;
      document.body.classList.remove("esp-editing");
    }
  });

  checkOwner().then(async authorized => {
    if (authorized) {
      toolbar.style.display = "flex";
      await loadCatalogueAdmin();
      await loadSettings();
    }
  }).catch(error => {
    console.warn("ADMIN :", error.message);
  });
})();
