
/* EUROPEAN SATFEED PREMIUM — IN-PLACE VISUAL EDITOR */
(() => {
  "use strict";

  const URL = "https://afipejmgjkigcbohsxkt.supabase.co";
  const KEY = "sb_publishable_MWi4yR-uw_TfrxJJrKdS1Q_783VTF6Z";
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
  let selectedCard = null;

  const css = document.createElement("style");
  css.textContent = `
    #esp-owner-tools {
      display:none;
      position:fixed;
      z-index:100000;
      right:16px;
      bottom:16px;
      background:#090d15;
      color:#fff;
      border:1px solid #eaff00;
      padding:12px;
      box-shadow:0 8px 35px #000b;
      font:13px Arial,sans-serif;
      max-width:calc(100vw - 32px);
    }

    #esp-owner-tools button,
    #esp-owner-menu button,
    #esp-login button {
      background:#172131;
      color:white;
      border:1px solid #465267;
      padding:10px 12px;
      cursor:pointer;
      font-weight:bold;
      margin:3px;
    }

    #esp-owner-tools button.primary,
    #esp-owner-menu button.primary,
    #esp-login button.primary {
      background:#eaff00;
      color:#080b12;
      border-color:#eaff00;
    }

    #esp-owner-tools button.danger,
    #esp-owner-menu button.danger {
      color:#ff929b;
    }

    #esp-owner-tools strong {
      color:#eaff00;
      display:block;
      margin-bottom:7px;
    }

    #esp-owner-menu {
      display:none;
      position:fixed;
      z-index:100001;
      background:#0b111d;
      color:white;
      border:1px solid #eaff00;
      padding:12px;
      width:min(290px,calc(100vw - 30px));
      box-shadow:0 8px 35px #000b;
      font:13px Arial,sans-serif;
    }

    #esp-owner-menu h3 {
      color:#eaff00;
      margin:4px 0 10px;
      font-size:15px;
    }

    #esp-owner-menu button {
      display:block;
      width:100%;
      text-align:left;
      margin:4px 0;
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
      font:14px Arial,sans-serif;
    }

    #esp-login.open {
      display:flex;
    }

    #esp-login .window {
      background:#111a27;
      border:1px solid #eaff00;
      padding:24px;
      width:min(400px,100%);
      color:white;
    }

    #esp-login h2 {
      color:#eaff00;
    }

    #esp-login input,
    #esp-owner-menu input,
    #esp-owner-menu textarea,
    #esp-owner-menu select {
      width:100%;
      box-sizing:border-box;
      padding:10px;
      margin:5px 0 12px;
      background:#080d15;
      color:white;
      border:1px solid #465267;
    }

    #esp-owner-menu label {
      display:block;
      margin-top:10px;
      color:#ccd4df;
    }

    body.esp-editing .archive-card {
      outline:1px dashed #eaff00;
      outline-offset:2px;
      cursor:pointer;
    }

    body.esp-editing [data-esp-text]:hover {
      outline:2px dashed #eaff00;
      outline-offset:3px;
      cursor:text;
    }

    #esp-owner-menu .hint {
      color:#aeb9c9;
      font-size:11px;
      line-height:1.5;
    }
  `;
  document.head.append(css);

  /* ACCÈS PROPRIÉTAIRE */

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
    <strong>EUROPEAN SATFEED — ÉDITION</strong>
    <button class="primary" id="esp-edit-toggle">ACTIVER L'ÉDITION</button>
    <button id="esp-add-cover">+ AJOUTER UNE COVER</button>
    <button id="esp-edit-page">MODIFIER LES TEXTES</button>
    <button id="esp-edit-links">MODIFIER UN LIEN</button>
    <button id="esp-save-page">ENREGISTRER LA PAGE</button>
    <button id="esp-logout">DÉCONNEXION</button>
    <p style="color:#aeb9c9;font-size:11px;margin:7px 0 0">
      Raccourci propriétaire : Ctrl + Maj + E
    </p>
  `;
  document.body.append(toolbar);

  const menu = document.createElement("div");
  menu.id = "esp-owner-menu";
  document.body.append(menu);

  const filePicker = document.createElement("input");
  filePicker.type = "file";
  filePicker.accept = "image/*";
  filePicker.hidden = true;
  document.body.append(filePicker);

  function message(text) {
    alert(text);
  }

  function closeMenu() {
    menu.style.display = "none";
    selectedCard = null;
  }

  function showMenu(x, y, html) {
    menu.innerHTML = html;
    menu.style.display = "block";

    const width = menu.offsetWidth;
    const height = menu.offsetHeight;

    menu.style.left =
      Math.max(10, Math.min(x, innerWidth - width - 10)) + "px";

    menu.style.top =
      Math.max(10, Math.min(y, innerHeight - height - 10)) + "px";
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

  /* PARAMÈTRES ET TEXTES DU SITE */

  async function loadSettings() {
    const { data, error } = await db
      .from("site_settings")
      .select("*")
      .limit(20);

    if (error) throw error;

    settingsRow = (data || []).find(row =>
      row.content && typeof row.content === "object"
    ) || null;

    settings = settingsRow?.content?.visual || {};

    applySavedPageChanges();
  }

  function makeKey(element, prefix) {
    if (!element.dataset[prefix]) {
      const all = $$(`[data-${prefix}]`);
      element.dataset[prefix] = prefix + "_" + all.length;
    }
    return element.dataset[prefix];
  }

  function applySavedPageChanges() {
    Object.entries(settings.texts || {}).forEach(([key, value]) => {
      const node = $$("[data-esp-text]").find(
        el => el.dataset.espText === key
      );
      if (node) node.textContent = value;
    });

    Object.entries(settings.images || {}).forEach(([key, value]) => {
      const node = $$("[data-esp-image]").find(
        el => el.dataset.espImage === key
      );
      if (node) node.src = value;
    });

    Object.entries(settings.links || {}).forEach(([key, value]) => {
      const node = $$("[data-esp-link]").find(
        el => el.dataset.espLink === key
      );
      if (node) node.href = value;
    });

    if (settings.heroBackground) {
      const hero = $(".hero");
      if (hero) {
        hero.style.backgroundImage =
          `linear-gradient(90deg,#080b12e8,#080b1270),url("${settings.heroBackground}")`;
        hero.style.backgroundSize = "cover";
        hero.style.backgroundPosition = "center";
      }
    }
  }

  function preparePageElements() {
    const selectors = [
      "h1", "h2", "h3", "p",
      ".brand-name", ".topline span",
      ".hero-stamp", ".hero-side",
      ".footer span", ".footer p",
      ".premium-section a"
    ];

    const nodes = selectors.flatMap(selector => $$(selector));
    let count = 0;

    nodes.forEach(node => {
      if (
        node.closest("#esp-owner-tools,#esp-owner-menu,#esp-login") ||
        node.closest(".archive-card") ||
        node.children.length > 0
      ) return;

      if (!node.dataset.espText) {
        node.dataset.espText = "page_text_" + count++;
      }

      node.dataset.espEditable = "true";
    });

    $$("img").forEach((img, index) => {
      if (img.closest(".archive-card")) return;
      if (!img.dataset.espImage) {
        img.dataset.espImage = "page_image_" + index;
      }
    });

    $$("a").forEach((link, index) => {
      if (link.closest("#esp-owner-tools,#esp-owner-menu,#esp-login")) return;
      if (!link.dataset.espLink) {
        link.dataset.espLink = "page_link_" + index;
      }
    });
  }

  async function savePageSettings() {
    settings.texts = settings.texts || {};
    settings.images = settings.images || {};
    settings.links = settings.links || {};

    $$("[data-esp-text]").forEach(node => {
      settings.texts[node.dataset.espText] = node.innerText;
    });

    $$("[data-esp-image]").forEach(node => {
      settings.images[node.dataset.espImage] = node.src;
    });

    $$("[data-esp-link]").forEach(node => {
      settings.links[node.dataset.espLink] = node.href;
    });

    const previous = settingsRow?.content || {};
    const content = {
      ...previous,
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

      if (!result.error) settingsRow = result.data;
    }

    if (result.error) throw result.error;

    if (settingsRow) settingsRow.content = content;

    message("Modifications de la page enregistrées.");
  }

  /* UPLOAD D'IMAGES */

  async function uploadImage(file, folder = "catalogue") {
    if (!file || !file.type.startsWith("image/")) {
      throw new Error("Fichier image invalide.");
    }

    if (file.size > 12 * 1024 * 1024) {
      throw new Error("Image trop lourde : maximum 12 Mo.");
    }

    const ext = (file.name.split(".").pop() || "jpg")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

    const path = `${folder}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

    const { error } = await db.storage
      .from(BUCKET)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type
      });

    if (error) throw error;

    const { data } = db.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }

  /* MENU D'UNE COVER */

  function openCardMenu(card, x, y) {
    selectedCard = card;

    const id = card.dataset.catalogueId;
    const item = (window.ESP_CATALOGUE?.getItems() || [])
      .find(entry => String(entry.id) === String(id));

    if (!item || item.source === "github") {
      showMenu(x, y, `
        <h3>ANCIENNE COVER GITHUB</h3>
        <p class="hint">
          Cette image vient de l'ancien dossier GitHub.
          Elle n'est pas encore enregistrée comme fiche Supabase.
        </p>
        <button class="primary" id="esp-import-cover">IMPORTER DANS LE CATALOGUE</button>
        <button id="esp-menu-close">FERMER</button>
      `);

      $("#esp-import-cover", menu).onclick = () => importLegacyCover(item);
      $("#esp-menu-close", menu).onclick = closeMenu;
      return;
    }

    showMenu(x, y, `
      <h3>MODIFIER CETTE COVER</h3>
      <button class="primary" id="esp-replace">REMPLACER L'IMAGE</button>
      <button id="esp-rename">RENOMMER LE TITRE</button>
      <button id="esp-description">MODIFIER LA DESCRIPTION</button>
      <button id="esp-category">DÉPLACER DE CATÉGORIE</button>
      <button id="esp-visibility">MASQUER / PUBLIER</button>
      <button class="danger" id="esp-delete">SUPPRIMER LA COVER</button>
      <button id="esp-menu-close">FERMER</button>
    `);

    $("#esp-replace", menu).onclick = () => {
      closeMenu();
      selectedCard = card;
      filePicker.dataset.action = "replace";
      filePicker.click();
    };

    $("#esp-rename", menu).onclick = () => editCatalogueField(item, "title");

    $("#esp-description", menu).onclick = () =>
      editCatalogueField(item, "description");

    $("#esp-category", menu).onclick = () => moveCategory(item);

    $("#esp-visibility", menu).onclick = () => toggleVisibility(item);

    $("#esp-delete", menu).onclick = () => deleteCover(item);

    $("#esp-menu-close", menu).onclick = closeMenu;
  }

  async function editCatalogueField(item, field) {
    const fr = prompt(
      field === "title" ? "Nouveau titre français :" : "Nouvelle description française :",
      item[field]?.fr || ""
    );

    if (fr === null) return;

    const en = prompt(
      field === "title" ? "Nouveau titre anglais :" : "Nouvelle description anglaise :",
      item[field]?.en || ""
    );

    if (en === null) return;

    const { error } = await db
      .from("catalogue")
      .update({
        [field]: { fr, en }
      })
      .eq("id", item.id);

    if (error) return message(error.message);

    await refreshCatalogue();
    closeMenu();
  }

  async function moveCategory(item) {
    const value = prompt(
      "Nouvelle catégorie : comps, folders, old, edits ou collections",
      item.category
    );

    if (value === null) return;

    const allowed = ["comps", "folders", "old", "edits", "collections"];

    if (!allowed.includes(value.trim().toLowerCase())) {
      return message("Catégorie non reconnue.");
    }

    const { error } = await db
      .from("catalogue")
      .update({ category: value.trim().toLowerCase() })
      .eq("id", item.id);

    if (error) return message(error.message);

    await refreshCatalogue();
    closeMenu();
  }

  async function toggleVisibility(item) {
    const { error } = await db
      .from("catalogue")
      .update({ published: !item.published })
      .eq("id", item.id);

    if (error) return message(error.message);

    await refreshCatalogue();
    closeMenu();
  }

  async function deleteCover(item) {
    const title = item.title?.fr || "cette cover";

    if (!confirm(`Supprimer définitivement « ${title} » ?`)) return;

    const { error } = await db
      .from("catalogue")
      .delete()
      .eq("id", item.id);

    if (error) return message(error.message);

    await refreshCatalogue();
    closeMenu();
  }

  async function importLegacyCover(item) {
    if (!item) return;

    const title = prompt("Nom de cette cover :", item.title?.fr || "");
    if (title === null) return;

    const category = prompt(
      "Catégorie : comps, folders, old, edits ou collections",
      "edits"
    );

    if (!["comps", "folders", "old", "edits", "collections"].includes(category)) {
      return message("Catégorie invalide.");
    }

    const { error } = await db.from("catalogue").insert({
      title: { fr: title, en: title },
      description: { fr: "", en: "" },
      category,
      image_url: item.image_url,
      published: true,
      position: (window.ESP_CATALOGUE?.getItems() || []).length
    });

    if (error) return message(error.message);

    await refreshCatalogue();
    closeMenu();
  }

  async function refreshCatalogue() {
    if (window.ESP_CATALOGUE?.refresh) {
      await window.ESP_CATALOGUE.refresh();
    }
  }

  /* REMPLACEMENT D'IMAGE */

  filePicker.addEventListener("change", async () => {
    const file = filePicker.files[0];
    const action = filePicker.dataset.action;
    filePicker.value = "";

    if (!file) return;

    try {
      const url = await uploadImage(file);

      if (action === "replace" && selectedCard) {
        const id = selectedCard.dataset.catalogueId;

        const { error } = await db
          .from("catalogue")
          .update({ image_url: url })
          .eq("id", id);

        if (error) throw error;

        await refreshCatalogue();
        closeMenu();
        message("Couverture remplacée.");
      } else {
        settings.images = settings.images || {};
        const key = filePicker.dataset.imageKey;

        if (key) {
          settings.images[key] = url;
          const target = $$("[data-esp-image]").find(
            node => node.dataset.espImage === key
          );
          if (target) target.src = url;
          await savePageSettings();
        }
      }
    } catch (error) {
      message("Erreur : " + error.message);
    }
  });

  /* AJOUT D'UNE COVER */

  async function addCover() {
    const title = prompt("Titre français de la nouvelle cover :");
    if (title === null || !title.trim()) return;

    const category = prompt(
      "Catégorie : comps, folders, old, edits ou collections",
      "edits"
    );

    if (!["comps", "folders", "old", "edits", "collections"].includes(category)) {
      return message("Catégorie invalide.");
    }

    const file = document.createElement("input");
    file.type = "file";
    file.accept = "image/*";

    file.onchange = async () => {
      if (!file.files[0]) return;

      try {
        const imageUrl = await uploadImage(file.files[0]);

        const { error } = await db.from("catalogue").insert({
          title: { fr: title.trim(), en: title.trim() },
          description: { fr: "", en: "" },
          category,
          image_url: imageUrl,
          published: true,
          position: (window.ESP_CATALOGUE?.getItems() || []).length
        });

        if (error) throw error;

        await refreshCatalogue();
        message("Nouvelle cover ajoutée.");
      } catch (error) {
        message("Erreur : " + error.message);
      }
    };

    file.click();
  }

  /* ÉDITION DIRECTE DES TEXTES */

  function editPageText(event) {
    if (!editing || !owner) return;

    const node = event.target.closest("[data-esp-editable]");

    if (!node) return;
    if (node.closest("#esp-owner-tools,#esp-owner-menu,#esp-login")) return;

    event.preventDefault();
    event.stopPropagation();

    const current = node.innerText;
    const replacement = prompt("Modifier ce texte :", current);

    if (replacement === null) return;

    node.textContent = replacement;

    settings.texts = settings.texts || {};
    settings.texts[node.dataset.espText] = replacement;
  }

  /* LIENS */

  function editLink() {
    const links = $$("a").filter(link =>
      !link.closest("#esp-owner-tools,#esp-owner-menu,#esp-login")
    );

    const choice = prompt(
      "Quel lien modifier ?\n" +
      links.map((link, i) =>
        `${i + 1}. ${link.innerText.trim() || link.href}`
      ).join("\n") +
      "\n\nEntre le numéro :"
    );

    if (choice === null) return;

    const link = links[Number(choice) - 1];
    if (!link) return message("Lien introuvable.");

    const url = prompt("Nouvelle adresse :", link.href);
    if (url === null) return;

    try {
      const parsed = new URL(url, location.href);
      if (!["https:", "http:", "mailto:", "tel:"].includes(parsed.protocol)) {
        throw new Error();
      }

      link.href = parsed.href;
      settings.links = settings.links || {};
      settings.links[link.dataset.espLink] = parsed.href;

      message("Lien modifié. Clique sur ENREGISTRER LA PAGE pour conserver.");
    } catch {
      message("Adresse invalide.");
    }
  }

  /* OUTILS DE LA BARRE */

  $("#esp-edit-toggle").onclick = () => {
    editing = !editing;
    document.body.classList.toggle("esp-editing", editing);

    $("#esp-edit-toggle").textContent = editing
      ? "TERMINER L'ÉDITION"
      : "ACTIVER L'ÉDITION";

    if (editing) preparePageElements();
  };

  $("#esp-add-cover").onclick = addCover;

  $("#esp-edit-page").onclick = () => {
    preparePageElements();
    message("Clique maintenant sur un texte du site pour le modifier.");
  };

  $("#esp-edit-links").onclick = editLink;

  $("#esp-save-page").onclick = async () => {
    try {
      await savePageSettings();
    } catch (error) {
      message("Erreur de sauvegarde : " + error.message);
    }
  };

  $("#esp-logout").onclick = async () => {
    await db.auth.signOut();
    await checkOwner();
    message("Déconnexion effectuée.");
  };

  $("#esp-login-close").onclick = () => {
    login.classList.remove("open");
  };

  /* CLIC SUR LES ÉLÉMENTS DU SITE */

  document.addEventListener("click", event => {
    if (!owner || !editing) return;

    if (event.target.closest("#esp-owner-tools,#esp-owner-menu,#esp-login")) {
      return;
    }

    const card = event.target.closest(".archive-card");

    if (card) {
      event.preventDefault();
      event.stopPropagation();
      openCardMenu(card, event.clientX, event.clientY);
      return;
    }

    editPageText(event);
  }, true);

  document.addEventListener("click", event => {
    if (
      menu.style.display === "block" &&
      !event.target.closest("#esp-owner-menu") &&
      !event.target.closest(".archive-card")
    ) {
      closeMenu();
    }
  });

  /* CONNEXION */

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

      login.classList.remove("open");

      await loadSettings();
      preparePageElements();

      message("Connexion propriétaire réussie.");
    } catch (error) {
      $("#esp-login-message").textContent = error.message;
    }
  });

  /* RACCOURCI SECRET : CTRL + MAJ + E */

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
        message(error.message);
      }
    }

    if (event.key === "Escape") {
      closeMenu();
      login.classList.remove("open");
    }
  });

  /* RESTAURATION DES DROITS */

  db.auth.onAuthStateChange((_event, session) => {
    owner = !!session?.user && session.user.id === OWNER;

    toolbar.style.display = owner ? "block" : "none";

    if (!owner) {
      editing = false;
      document.body.classList.remove("esp-editing");
      closeMenu();
    }
  });

  checkOwner().then(async authorized => {
    if (authorized) {
      await loadSettings();
      preparePageElements();
    }
  }).catch(error => {
    console.warn("Éditeur visuel :", error.message);
  });

})();
