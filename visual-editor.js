/* EUROPEAN SATFEED PREMIUM — DIRECT VISUAL EDITOR */
(() => {
  "use strict";

  const URL = "https://afipejmgjkigcbohsxkt.supabase.co";
  const KEY = "sb_publishable_MWi4yR-uw_TfrXJJrKdS1Q_783VTF6Z";
  const OWNER = "1f2e7add-fe3d-4792-8c8c-9708e584b9d6";
  const BUCKET = "covers";

  if (!window.supabase?.createClient) {
    console.error("Supabase JS introuvable.");
    return;
  }

  const db = window.supabase.createClient(URL, KEY);
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  let owner = false;
  let editing = false;
  let settingsRow = null;
  let settings = {};
  let selectedElement = null;

  const categories = [
    "comps",
    "folders",
    "old",
    "edits",
    "collections",
    "clubs",
    "national teams",
    "unclassified"
  ];

  const categoryLabels = {
    comps: "COMPS",
    folders: "FOLDERS",
    old: "OLD",
    edits: "EDITS",
    collections: "COLLECTIONS",
    clubs: "CLUBS",
    "national teams": "NATIONAL TEAMS",
    unclassified: "NON CLASSÉ"
  };

  const style = document.createElement("style");

  style.textContent = `
    #esp-login,
    #esp-context-menu,
    #esp-owner-tools {
      font-family:"DM Sans",Arial,sans-serif;
    }

    #esp-owner-tools {
      display:none;
      position:fixed;
      z-index:100000;
      right:18px;
      bottom:18px;
      background:#0d121c;
      color:#f4f5f7;
      border:1px solid #eaff00;
      padding:10px 13px;
      box-shadow:0 8px 35px #000b;
      font-size:12px;
    }

    #esp-owner-tools button,
    #esp-context-menu button,
    #esp-login button {
      background:#172131;
      color:#fff;
      border:1px solid #465267;
      padding:10px 12px;
      cursor:pointer;
      font-weight:700;
      font-size:11px;
      margin:3px;
    }

    #esp-owner-tools button.primary,
    #esp-context-menu button.primary,
    #esp-login button.primary {
      background:#eaff00;
      color:#080b12;
      border-color:#eaff00;
    }

    #esp-context-menu {
      display:none;
      position:fixed;
      z-index:100001;
      width:min(330px,calc(100vw - 24px));
      max-height:80vh;
      overflow:auto;
      background:#0d121c;
      color:#f4f5f7;
      border:1px solid #eaff00;
      padding:13px;
      box-shadow:0 10px 40px #000d;
      font-size:12px;
    }

    #esp-context-menu h3 {
      color:#eaff00;
      font-size:15px;
      margin:3px 0 10px;
    }

    #esp-context-menu button {
      display:block;
      width:100%;
      text-align:left;
      margin:4px 0;
    }

    #esp-context-menu button.danger {
      color:#ff929b;
    }

    #esp-context-menu label {
      display:block;
      color:#aeb9c9;
      margin:9px 0 4px;
    }

    #esp-context-menu input,
    #esp-context-menu textarea,
    #esp-context-menu select,
    #esp-login input {
      width:100%;
      box-sizing:border-box;
      padding:10px;
      margin:4px 0 9px;
      color:#fff;
      background:#080d15;
      border:1px solid #465267;
    }

    #esp-context-menu textarea {
      min-height:75px;
      resize:vertical;
    }

    #esp-context-menu .hint {
      color:#aeb9c9;
      font-size:11px;
      line-height:1.5;
    }

    #esp-login {
      display:none;
      position:fixed;
      z-index:100002;
      inset:0;
      background:#05070cf2;
      align-items:center;
      justify-content:center;
      padding:18px;
    }

    #esp-login.open {
      display:flex;
    }

    #esp-login .window {
      width:min(390px,100%);
      padding:24px;
      background:#111a27;
      border:1px solid #eaff00;
      color:#fff;
    }

    #esp-login h2 {
      color:#eaff00;
    }

    #esp-login label {
      display:block;
      margin-top:12px;
    }

    body.esp-editing .archive-card {
      outline:1px dashed #eaff00;
      outline-offset:3px;
      cursor:pointer;
    }

    body.esp-editing [data-esp-key]:hover {
      outline:1px dashed #eaff00;
      outline-offset:3px;
      cursor:pointer;
    }

    body.esp-editing .archive-card:hover {
      outline:2px solid #eaff00;
    }

    @media(max-width:600px) {
      #esp-owner-tools {
        right:8px;
        bottom:8px;
        max-width:calc(100vw - 16px);
      }

      #esp-owner-tools button {
        padding:8px;
        font-size:10px;
      }

      #esp-context-menu {
        max-height:75vh;
      }
    }
  `;

  document.head.append(style);

  const login = document.createElement("div");
  login.id = "esp-login";

  login.innerHTML = `
    <div class="window">
      <h2>ES+ OWNER ACCESS</h2>
      <p>Connexion réservée au propriétaire.</p>
      <form id="esp-login-form">
        <label>Adresse e-mail</label>
        <input id="esp-email" type="email" required autocomplete="username">
        <label>Mot de passe</label>
        <input id="esp-password" type="password" required autocomplete="current-password">
        <button class="primary" type="submit">SE CONNECTER</button>
        <button type="button" id="esp-login-close">ANNULER</button>
        <p id="esp-login-message"></p>
      </form>
    </div>
  `;

  document.body.append(login);

  const toolbar = document.createElement("div");
  toolbar.id = "esp-owner-tools";

  toolbar.innerHTML = `
    <strong style="color:#eaff00;display:block;margin-bottom:7px">
      ES+ OWNER
    </strong>
    <button class="primary" id="esp-toggle-edit">ACTIVER L'ÉDITION</button>
    <button id="esp-add-cover">+ COVER</button>
    <button id="esp-hidden-covers">COVERS MASQUÉES</button>
    <button id="esp-save-page">ENREGISTRER</button>
    <button id="esp-logout">DÉCONNEXION</button>
  `;

  document.body.append(toolbar);

  const menu = document.createElement("div");
  menu.id = "esp-context-menu";
  document.body.append(menu);

  const picker = document.createElement("input");
  picker.type = "file";
  picker.accept = "image/*";
  picker.hidden = true;
  document.body.append(picker);

  function notify(message) {
    window.alert(message);
  }

  function closeMenu() {
    menu.style.display = "none";
    selectedElement = null;
  }

  function showMenu(x, y, html) {
    menu.innerHTML = html;
    menu.style.display = "block";

    const width = menu.offsetWidth;
    const height = menu.offsetHeight;

    menu.style.left =
      Math.max(8, Math.min(x, window.innerWidth - width - 8)) + "px";

    menu.style.top =
      Math.max(8, Math.min(y, window.innerHeight - height - 8)) + "px";
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  function localizedValue(value, lang = "fr") {
    if (typeof value === "string") return value;
    return value?.[lang] || value?.fr || value?.en || "";
  }

  function categoryOptions(current = "edits") {
    return categories.map(category => `
      <option value="${escapeHTML(category)}"
        ${category === current ? "selected" : ""}>
        ${escapeHTML(categoryLabels[category])}
      </option>
    `).join("");
  }

  function makeElementKey(element) {
    if (element.id) return "id:" + element.id;

    const parts = [];
    let node = element;

    while (node && node !== document.body && parts.length < 8) {
      let part = node.tagName.toLowerCase();

      const classes = [...node.classList]
        .filter(name => !name.startsWith("esp-"))
        .slice(0, 2);

      if (classes.length) {
        part += "." + classes.join(".");
      }

      const parent = node.parentElement;

      if (parent) {
        const same = [...parent.children].filter(child =>
          child.tagName === node.tagName
        );

        if (same.length > 1) {
          part += `:nth-of-type(${same.indexOf(node) + 1})`;
        }
      }

      parts.unshift(part);
      node = parent;
    }

    return parts.join(">");
  }

  function prepareElements() {
    $$("body *").forEach(element => {
      if (element.closest(
        "#esp-login,#esp-owner-tools,#esp-context-menu"
      )) return;

      if (element.classList.contains("archive-card")) return;

      if (!element.dataset.espKey) {
        element.dataset.espKey = makeElementKey(element);
      }
    });
  }

  function findElement(key) {
    return $$("[data-esp-key]").find(element =>
      element.dataset.espKey === key
    );
  }

  function replaceVisibleText(element, value) {
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          return node.nodeValue.trim()
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT;
        }
      }
    );

    const firstTextNode = walker.nextNode();

    if (firstTextNode) {
      firstTextNode.nodeValue = value;
    } else {
      element.append(document.createTextNode(value));
    }
  }

  function applySettings() {
    prepareElements();

    Object.entries(settings.texts || {}).forEach(([key, value]) => {
      const element = findElement(key);
      if (element) replaceVisibleText(element, value);
    });

    Object.entries(settings.styles || {}).forEach(([key, saved]) => {
      const element = findElement(key);
      if (!element || !saved) return;

      if (saved.color) element.style.color = saved.color;

      if (saved.backgroundColor) {
        element.style.backgroundColor = saved.backgroundColor;
      }

      if (saved.backgroundImage) {
        element.style.backgroundImage = saved.backgroundImage;
        element.style.backgroundSize = "cover";
        element.style.backgroundPosition = "center";
      }
    });

    Object.entries(settings.links || {}).forEach(([key, value]) => {
      const element = findElement(key);
      if (element && element.tagName === "A") {
        element.href = value;
      }
    });
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

    const content = settingsRow?.content || {};

    settings = content.visual || {};
    settings.texts ||= {};
    settings.styles ||= {};
    settings.links ||= {};

    applySettings();
  }

  async function saveSettings(silent = false) {
    const content = {
      ...(settingsRow?.content || {}),
      visual: settings
    };

    let result;

    if (settingsRow?.id) {
      result = await db
        .from("site_settings")
        .update({ content })
        .eq("id", settingsRow.id);
    } else {
      result = await db
        .from("site_settings")
        .insert({ id: "public", content })
        .select()
        .single();

      if (!result.error) {
        settingsRow = result.data;
      }
    }

    if (result.error) throw result.error;

    if (settingsRow) settingsRow.content = content;

    if (!silent) {
      notify("Modifications enregistrées.");
    }
  }

  async function checkOwner() {
    const { data, error } = await db.auth.getSession();
    if (error) throw error;

    owner = !!data.session?.user &&
      data.session.user.id === OWNER;

    toolbar.style.display = owner ? "block" : "none";

    if (!owner) {
      editing = false;
      document.body.classList.remove("esp-editing");
      closeMenu();
    }

    return owner;
  }

  async function uploadImage(file, folder = "catalogue") {
    if (!file || !file.type.startsWith("image/")) {
      throw new Error("Sélectionne un fichier image valide.");
    }

    if (file.size > 12 * 1024 * 1024) {
      throw new Error("Image trop lourde : maximum 12 Mo.");
    }

    const extension = (
      file.name.split(".").pop() || "jpg"
    ).toLowerCase().replace(/[^a-z0-9]/g, "");

    const path =
      `${folder}/${Date.now()}-${crypto.randomUUID()}.${extension}`;

    const { error } = await db.storage
      .from(BUCKET)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type
      });

    if (error) throw error;

    return db.storage
      .from(BUCKET)
      .getPublicUrl(path).data.publicUrl;
  }

  async function updateCatalogue(item, changes) {
    const { error } = await db
      .from("catalogue")
      .update(changes)
      .eq("id", item.id);

    if (error) throw error;

    await window.ESP_CATALOGUE?.refresh?.();
    closeMenu();
  }

  function openCardMenu(card, x, y) {
    const id = card.dataset.catalogueId;

    const item = (window.ESP_CATALOGUE?.getItems?.() || [])
      .find(entry => String(entry.id) === String(id));

    if (!item) {
      notify("Cette cover n'a pas été retrouvée.");
      return;
    }

    if (item.source === "github") {
      showMenu(x, y, `
        <h3>ANCIENNE COVER GITHUB</h3>
        <p class="hint">
          Cette cover est encore dans ton ancien dossier GitHub.
          Elle ne sera pas supprimée de GitHub.
        </p>
        <label>Titre français</label>
        <input id="esp-legacy-title"
          value="${escapeHTML(localizedValue(item.title))}">
        <label>Catégorie de destination</label>
        <select id="esp-legacy-category">
          ${categoryOptions("edits")}
        </select>
        <button class="primary" id="esp-import-legacy">
          IMPORTER DANS SUPABASE
        </button>
        <button id="esp-close-menu">FERMER</button>
      `);

      $("#esp-import-legacy", menu).onclick = () =>
        importLegacy(item);

      $("#esp-close-menu", menu).onclick = closeMenu;
      return;
    }

    showMenu(x, y, `
      <h3>MODIFIER LA COVER</h3>

      <label>Titre français</label>
      <input id="esp-title-fr"
        value="${escapeHTML(localizedValue(item.title, "fr"))}">

      <label>Titre anglais</label>
      <input id="esp-title-en"
        value="${escapeHTML(localizedValue(item.title, "en"))}">

      <label>Description française</label>
      <textarea id="esp-desc-fr">${escapeHTML(localizedValue(item.description, "fr"))}</textarea>

      <label>Description anglaise</label>
      <textarea id="esp-desc-en">${escapeHTML(localizedValue(item.description, "en"))}</textarea>

      <label>Catégorie</label>
      <select id="esp-category">
        ${categoryOptions(item.category)}
      </select>

      <label>Position dans le catalogue</label>
      <input id="esp-position" type="number" min="0" step="1"
        value="${Number(item.position || 0)}">

      <button class="primary" id="esp-save-card">
        ENREGISTRER LES MODIFICATIONS
      </button>

      <button id="esp-replace-card">REMPLACER L'IMAGE</button>

      <button id="esp-visibility-card">
        ${item.published ? "MASQUER" : "REPUBLIER"}
      </button>

      <button class="danger" id="esp-delete-card">
        SUPPRIMER
      </button>

      <button id="esp-close-menu">FERMER</button>
    `);

    $("#esp-save-card", menu).onclick = async () => {
      try {
        await updateCatalogue(item, {
          title: {
            fr: $("#esp-title-fr", menu).value.trim(),
            en: $("#esp-title-en", menu).value.trim()
          },
          description: {
            fr: $("#esp-desc-fr", menu).value.trim(),
            en: $("#esp-desc-en", menu).value.trim()
          },
          category: $("#esp-category", menu).value,
          position: Math.max(
            0,
            Number($("#esp-position", menu).value || 0)
          )
        });

        notify("Cover mise à jour.");
      } catch (error) {
        notify("Erreur : " + error.message);
      }
    };

    $("#esp-replace-card", menu).onclick = () => {
      picker.dataset.action = "replace";
      picker.dataset.itemId = String(item.id);
      closeMenu();
      picker.click();
    };

    $("#esp-visibility-card", menu).onclick = async () => {
      try {
        await updateCatalogue(item, {
          published: !item.published
        });

        notify(item.published
          ? "Cover masquée."
          : "Cover republiée."
        );
      } catch (error) {
        notify("Erreur : " + error.message);
      }
    };

    $("#esp-delete-card", menu).onclick = async () => {
      const title = localizedValue(item.title) || "cette cover";

      if (!confirm(
        `Supprimer définitivement « ${title} » du catalogue ?`
      )) return;

      try {
        const { error } = await db
          .from("catalogue")
          .delete()
          .eq("id", item.id);

        if (error) throw error;

        await window.ESP_CATALOGUE?.refresh?.();
        closeMenu();

        notify(
          "Fiche supprimée. Le fichier image du stockage est conservé."
        );
      } catch (error) {
        notify("Erreur : " + error.message);
      }
    };

    $("#esp-close-menu", menu).onclick = closeMenu;
  }

  async function importLegacy(item) {
    const title = $("#esp-legacy-title", menu).value.trim();
    const category = $("#esp-legacy-category", menu).value;

    if (!title) {
      notify("Ajoute un titre avant l'importation.");
      return;
    }

    try {
      const items = window.ESP_CATALOGUE?.getItems?.() || [];

      const { error } = await db.from("catalogue").insert({
        title: { fr: title, en: title },
        description: { fr: "", en: "" },
        category,
        image_url: item.image_url,
        published: true,
        position: items.length
      });

      if (error) throw error;

      await window.ESP_CATALOGUE?.refresh?.();
      closeMenu();

      notify("Cover importée. L'original GitHub est conservé.");
    } catch (error) {
      notify("Importation impossible : " + error.message);
    }
  }

  function openAddCoverMenu() {
    showMenu(
      Math.max(12, (window.innerWidth - 330) / 2),
      Math.max(12, (window.innerHeight - 500) / 2),
      `
        <h3>AJOUTER UNE NOUVELLE COVER</h3>

        <label>Image de la cover</label>
        <input id="esp-new-image" type="file" accept="image/*">

        <label>Titre français</label>
        <input id="esp-new-title-fr" placeholder="Ex : UCL RUN">

        <label>Titre anglais</label>
        <input id="esp-new-title-en" placeholder="Ex : UCL RUN">

        <label>Description française</label>
        <textarea id="esp-new-desc-fr"
          placeholder="Description facultative"></textarea>

        <label>Description anglaise</label>
        <textarea id="esp-new-desc-en"
          placeholder="Optional description"></textarea>

        <label>Catégorie</label>
        <select id="esp-new-category">
          ${categoryOptions("edits")}
        </select>

        <button class="primary" id="esp-create-cover">
          AJOUTER AU CATALOGUE
        </button>

        <button id="esp-cancel-new-cover">ANNULER</button>

        <p class="hint">
          JPG, PNG ou WEBP. Maximum 12 Mo.
        </p>
      `
    );

    $("#esp-cancel-new-cover", menu).onclick = closeMenu;

    $("#esp-create-cover", menu).onclick = async () => {
      const file = $("#esp-new-image", menu).files?.[0];
      const titleFr = $("#esp-new-title-fr", menu).value.trim();
      const titleEn = $("#esp-new-title-en", menu).value.trim();
      const descFr = $("#esp-new-desc-fr", menu).value.trim();
      const descEn = $("#esp-new-desc-en", menu).value.trim();
      const category = $("#esp-new-category", menu).value;

      if (!file) {
        notify("Sélectionne une image.");
        return;
      }

      if (!titleFr) {
        notify("Ajoute au moins un titre français.");
        return;
      }

      if (!categories.includes(category)) {
        notify("Catégorie non reconnue.");
        return;
      }

      const button = $("#esp-create-cover", menu);
      button.disabled = true;
      button.textContent = "IMPORTATION EN COURS…";

      try {
        const imageUrl = await uploadImage(file);
        const items = window.ESP_CATALOGUE?.getItems?.() || [];

        const { error } = await db.from("catalogue").insert({
          title: {
            fr: titleFr,
            en: titleEn || titleFr
          },
          description: {
            fr: descFr,
            en: descEn
          },
          category,
          image_url: imageUrl,
          published: true,
          position: items.length
        });

        if (error) throw error;

        closeMenu();
        await window.ESP_CATALOGUE?.refresh?.();

        notify("Nouvelle cover ajoutée au catalogue !");
      } catch (error) {
        button.disabled = false;
        button.textContent = "RÉESSAYER";
        notify("Erreur : " + error.message);
      }
    };
  }

  async function openHiddenCovers() {
    try {
      const { data, error } = await db
        .from("catalogue")
        .select("id,title,description,category,image_url,published,position")
        .eq("published", false)
        .order("position", { ascending: true });

      if (error) throw error;

      if (!data?.length) {
        showMenu(
          20,
          20,
          `
            <h3>COVERS MASQUÉES</h3>
            <p class="hint">Aucune cover masquée.</p>
            <button id="esp-close-menu">FERMER</button>
          `
        );

        $("#esp-close-menu", menu).onclick = closeMenu;
        return;
      }

      showMenu(
        20,
        20,
        `
          <h3>COVERS MASQUÉES (${data.length})</h3>
          <p class="hint">
            Tu peux republier une cover ou supprimer sa fiche.
          </p>
          <div id="esp-hidden-list"></div>
          <button id="esp-close-menu">FERMER</button>
        `
      );

      const list = $("#esp-hidden-list", menu);

      data.forEach(item => {
        const entry = document.createElement("div");
        entry.style.cssText =
          "border-top:1px solid #465267;padding:10px 0;margin-top:8px";

        const title = document.createElement("strong");
        title.textContent = localizedValue(item.title) || "Sans titre";

        const category = document.createElement("p");
        category.className = "hint";
        category.textContent = categoryLabels[item.category] || item.category;

        const publish = document.createElement("button");
        publish.textContent = "REPUBLIER";
        publish.onclick = async () => {
          try {
            const { error } = await db
              .from("catalogue")
              .update({ published: true })
              .eq("id", item.id);

            if (error) throw error;

            await window.ESP_CATALOGUE?.refresh?.();
            notify("Cover republiée.");
            openHiddenCovers();
          } catch (error) {
            notify("Erreur : " + error.message);
          }
        };

        const remove = document.createElement("button");
        remove.className = "danger";
        remove.textContent = "SUPPRIMER";
        remove.onclick = async () => {
          if (!confirm("Supprimer définitivement cette fiche ?")) return;

          try {
            const { error } = await db
              .from("catalogue")
              .delete()
              .eq("id", item.id);

            if (error) throw error;

            notify("Fiche supprimée.");
            openHiddenCovers();
          } catch (error) {
            notify("Erreur : " + error.message);
          }
        };

        entry.append(title, category, publish, remove);
        list.append(entry);
      });

      $("#esp-close-menu", menu).onclick = closeMenu;
    } catch (error) {
      notify("Impossible de charger les covers masquées : " + error.message);
    }
  }

  function openTextMenu(element, x, y) {
    selectedElement = element;

    const key = element.dataset.espKey;
    const currentText = element.innerText || element.textContent || "";

    showMenu(x, y, `
      <h3>MODIFIER CET ÉLÉMENT</h3>

      <label>Texte</label>
      <textarea id="esp-element-text">${escapeHTML(currentText)}</textarea>

      <button class="primary" id="esp-apply-text">
        APPLIQUER LE TEXTE
      </button>

      <button id="esp-text-color">COULEUR DU TEXTE</button>
      <button id="esp-background-color">COULEUR DU FOND</button>
      <button id="esp-background-image">IMAGE DE FOND</button>

      ${element.tagName === "A"
        ? '<button id="esp-edit-url">MODIFIER LE LIEN</button>'
        : ""}

      <button id="esp-close-menu">FERMER</button>
    `);

    $("#esp-apply-text", menu).onclick = () => {
      const value = $("#esp-element-text", menu).value;

      replaceVisibleText(element, value);
      settings.texts[key] = value;

      closeMenu();
    };

    $("#esp-text-color", menu).onclick = () => {
      const color = prompt(
        "Nouvelle couleur du texte (ex. #ffffff) :",
        getComputedStyle(element).color
      );

      if (color === null) return;

      element.style.color = color;
      settings.styles[key] ||= {};
      settings.styles[key].color = color;
    };

    $("#esp-background-color", menu).onclick = () => {
      const color = prompt(
        "Nouvelle couleur de fond (ex. #080b12) :",
        getComputedStyle(element).backgroundColor
      );

      if (color === null) return;

      element.style.backgroundColor = color;
      settings.styles[key] ||= {};
      settings.styles[key].backgroundColor = color;
    };

    $("#esp-background-image", menu).onclick = () => {
      picker.dataset.action = "page-background";
      picker.dataset.elementKey = key;
      closeMenu();
      picker.click();
    };

    const linkButton = $("#esp-edit-url", menu);

    if (linkButton) {
      linkButton.onclick = () => {
        const url = prompt("Nouvelle adresse du lien :", element.href);
        if (url === null) return;

        try {
          const parsed = new URL(url, location.href);

          if (!["http:", "https:", "mailto:", "tel:"].includes(parsed.protocol)) {
            throw new Error("Adresse non autorisée.");
          }

          element.href = parsed.href;
          settings.links[key] = parsed.href;
          closeMenu();
        } catch {
          notify("Adresse de lien invalide.");
        }
      };
    }

    $("#esp-close-menu", menu).onclick = closeMenu;
  }

  function openSectionMenu(element, x, y) {
    selectedElement = element;

    showMenu(x, y, `
      <h3>APPARENCE DE LA ZONE</h3>
      <p class="hint">
        Modifie le fond ou la couleur de cette zone.
      </p>

      <button id="esp-section-bg">CHANGER LA COULEUR DU FOND</button>
      <button id="esp-section-image">METTRE UNE IMAGE DE FOND</button>
      <button id="esp-section-text">CHANGER LA COULEUR DU TEXTE</button>
      <button id="esp-close-menu">FERMER</button>
    `);

    $("#esp-section-bg", menu).onclick = () => {
      const color = prompt(
        "Couleur du fond :",
        getComputedStyle(element).backgroundColor
      );

      if (color === null) return;

      element.style.backgroundColor = color;

      const key = element.dataset.espKey;
      settings.styles[key] ||= {};
      settings.styles[key].backgroundColor = color;
    };

    $("#esp-section-text", menu).onclick = () => {
      const color = prompt(
        "Couleur du texte :",
        getComputedStyle(element).color
      );

      if (color === null) return;

      element.style.color = color;

      const key = element.dataset.espKey;
      settings.styles[key] ||= {};
      settings.styles[key].color = color;
    };

    $("#esp-section-image", menu).onclick = () => {
      picker.dataset.action = "page-background";
      picker.dataset.elementKey = element.dataset.espKey;
      closeMenu();
      picker.click();
    };

    $("#esp-close-menu", menu).onclick = closeMenu;
  }

  picker.addEventListener("change", async () => {
    const file = picker.files?.[0];
    const action = picker.dataset.action;
    const itemId = picker.dataset.itemId;
    const elementKey = picker.dataset.elementKey;

    picker.value = "";

    if (!file) return;

    try {
      const imageUrl = await uploadImage(file);

      if (action === "replace" && itemId) {
        const { error } = await db
          .from("catalogue")
          .update({ image_url: imageUrl })
          .eq("id", itemId);

        if (error) throw error;

        await window.ESP_CATALOGUE?.refresh?.();
        notify("Image de la cover remplacée.");
      }

      if (action === "page-background" && elementKey) {
        const element = findElement(elementKey);

        if (!element) {
          throw new Error("Élément introuvable.");
        }

        const backgroundImage = `url("${imageUrl}")`;

        element.style.backgroundImage = backgroundImage;
        element.style.backgroundSize = "cover";
        element.style.backgroundPosition = "center";

        settings.styles[elementKey] ||= {};
        settings.styles[elementKey].backgroundImage = backgroundImage;

        await saveSettings(true);
        notify("Image de fond enregistrée.");
      }
    } catch (error) {
      notify("Erreur : " + error.message);
    }
  });

  function getEditableTarget(target) {
    let node = target;

    while (node && node !== document.body) {
      if (node.closest(
        "#esp-login,#esp-owner-tools,#esp-context-menu"
      )) return null;

      if (node.closest(".archive-card")) return null;

      if (node.matches(
        "a,button,h1,h2,h3,p,span,strong,b,em,summary,small"
      )) {
        return node;
      }

      node = node.parentElement;
    }

    return null;
  }

  document.addEventListener("click", event => {
    if (!owner || !editing) return;

    if (event.target.closest(
      "#esp-login,#esp-owner-tools,#esp-context-menu"
    )) return;

    const card = event.target.closest(".archive-card");

    if (card) {
      event.preventDefault();
      event.stopPropagation();
      openCardMenu(card, event.clientX, event.clientY);
      return;
    }

    const editable = getEditableTarget(event.target);

    if (editable) {
      event.preventDefault();
      event.stopPropagation();

      prepareElements();
      openTextMenu(editable, event.clientX, event.clientY);
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

      prepareElements();
      openSectionMenu(section, event.clientX, event.clientY);
    }
  }, true);

  document.addEventListener("click", event => {
    if (
      menu.style.display === "block" &&
      !event.target.closest("#esp-context-menu") &&
      !event.target.closest(".archive-card")
    ) {
      closeMenu();
    }
  });

  $("#esp-toggle-edit").onclick = () => {
    editing = !editing;

    document.body.classList.toggle("esp-editing", editing);

    $("#esp-toggle-edit").textContent = editing
      ? "TERMINER L'ÉDITION"
      : "ACTIVER L'ÉDITION";

    if (editing) {
      prepareElements();
    } else {
      closeMenu();
    }
  };

  $("#esp-add-cover").onclick = openAddCoverMenu;
  $("#esp-hidden-covers").onclick = openHiddenCovers;

  $("#esp-save-page").onclick = async () => {
    try {
      await saveSettings();
    } catch (error) {
      notify("Erreur de sauvegarde : " + error.message);
    }
  };

  $("#esp-logout").onclick = async () => {
    await db.auth.signOut();
    await checkOwner();
    notify("Déconnexion effectuée.");
  };

  $("#esp-login-close").onclick = () => {
    login.classList.remove("open");
  };

  $("#esp-login-form").addEventListener("submit", async event => {
    event.preventDefault();

    $("#esp-login-message").textContent = "Connexion…";

    const { error } = await db.auth.signInWithPassword({
      email: $("#esp-email").value.trim(),
      password: $("#esp-password").value
    });

    if (error) {
      $("#esp-login-message").textContent = error.message;
      return;
    }

    try {
      if (!(await checkOwner())) {
        await db.auth.signOut();
        throw new Error("Ce compte n'est pas autorisé.");
      }

      await loadSettings();
      login.classList.remove("open");

      notify("Connexion propriétaire réussie.");
    } catch (error) {
      $("#esp-login-message").textContent = error.message;
    }
  });

  document.addEventListener("keydown", async event => {
    if (
      event.ctrlKey &&
      event.shiftKey &&
      event.key.toLowerCase() === "e"
    ) {
      event.preventDefault();

      try {
        if (await checkOwner()) {
          toolbar.style.display =
            toolbar.style.display === "block" ? "none" : "block";
        } else {
          login.classList.add("open");
        }
      } catch (error) {
        notify(error.message);
      }
    }

    if (event.key === "Escape") {
      closeMenu();
      login.classList.remove("open");
    }
  });

  db.auth.onAuthStateChange((_event, session) => {
    owner = !!session?.user && session.user.id === OWNER;

    toolbar.style.display = owner ? "block" : "none";

    if (!owner) {
      editing = false;
      document.body.classList.remove("esp-editing");
      closeMenu();
    }
  });

  checkOwner()
    .then(async authorized => {
      if (authorized) {
        await loadSettings();
      }
    })
    .catch(error => {
      console.warn("Éditeur visuel :", error.message);
    });
})();
