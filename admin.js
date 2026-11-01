
"use strict";

/* =========================================
   EUROPEAN SATFEED PREMIUM — ADMIN
========================================= */

const SUPABASE_URL = "https://afipejmgjkigcbohsxkt.supabase.co";
const SUPABASE_KEY = "sb_publishable_MWi4yR-uw_TfrxJJrKdS1Q_783VTF6Z";
const OWNER_ID = "1f2e7add-fe3d-4792-8c8c-9708e584b9d6";
const BUCKET = "covers";
const SETTINGS_ID = "main";

const DEFAULT_CATEGORIES = [
  { slug: "comps", label: "COMPS" },
  { slug: "folders", label: "FOLDERS" },
  { slug: "old", label: "OLD" },
  { slug: "edits", label: "EDITS" },
  { slug: "collections", label: "COLLECTIONS" }
];

const $ = (id) => document.getElementById(id);

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let catalogue = [];
let settings = {};
let categories = [...DEFAULT_CATEGORIES];
let currentUser = null;
let isInitialized = false;

/* =========================================
   UTILITAIRES
========================================= */

function message(id, text, type = "") {
  const element = $(id);
  if (!element) return;

  element.textContent = text;
  element.className = "status" + (type ? " " + type : "");
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function makeId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return "item-" + Date.now() + "-" + Math.random().toString(36).slice(2, 10);
}

function safeUrl(value) {
  if (!value) return "";
  try {
    const url = new URL(value, window.location.href);
    if (url.protocol === "https:" || url.protocol === "http:") {
      return url.href;
    }
  } catch (_) {}
  return "";
}

function categoryLabel(slug) {
  const found = categories.find((item) => item.slug === slug);
  return found ? found.label : String(slug || "SANS CATÉGORIE").toUpperCase();
}

function getTitle(item) {
  if (item.title && typeof item.title === "object") {
    return item.title.fr || item.title.en || "Sans titre";
  }
  return item.title || "Sans titre";
}

/* =========================================
   NAVIGATION ET AFFICHAGE
========================================= */

function setLoggedIn(connected) {
  $("loginView").classList.toggle("hidden", connected);
  $("adminApp").classList.toggle("hidden", !connected);
}

function showPage(pageName) {
  document.querySelectorAll(".page").forEach((page) => {
    page.classList.toggle("active", page.id === "page-" + pageName);
  });

  document.querySelectorAll(".nav-btn").forEach((button) => {
    button.classList.toggle("active", button.dataset.page === pageName);
  });
}

/* =========================================
   AUTHENTIFICATION
========================================= */

async function checkOwner() {
  const { data, error } = await db.auth.getSession();

  if (error) {
    console.error("Erreur de session :", error);
    setLoggedIn(false);
    return false;
  }

  const session = data.session;

  if (!session || !session.user) {
    setLoggedIn(false);
    return false;
  }

  if (session.user.id !== OWNER_ID) {
    await db.auth.signOut();
    setLoggedIn(false);
    message("loginStatus", "Ce compte n'est pas autorisé à accéder à l'administration.", "error");
    return false;
  }

  currentUser = session.user;
  setLoggedIn(true);
  await initializeAdmin();
  return true;
}

async function login(event) {
  event.preventDefault();

  const email = $("loginEmail").value.trim();
  const password = $("loginPassword").value;

  if (!email || !password) {
    message("loginStatus", "Renseigne ton adresse e-mail et ton mot de passe.", "error");
    return;
  }

  const button = $("loginForm").querySelector('button[type="submit"]');
  button.disabled = true;
  button.textContent = "Connexion…";
  message("loginStatus", "Vérification des identifiants…");

  try {
    const { data, error } = await db.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    if (!data.user || data.user.id !== OWNER_ID) {
      await db.auth.signOut();
      throw new Error("Ce compte n'est pas autorisé à accéder à l'administration.");
    }

    currentUser = data.user;
    message("loginStatus", "Connexion réussie.", "success");
    setLoggedIn(true);
    await initializeAdmin();

  } catch (error) {
    console.error(error);
    message("loginStatus", error.message || "Impossible de se connecter.", "error");
  } finally {
    button.disabled = false;
    button.textContent = "SE CONNECTER";
  }
}

async function logout() {
  await db.auth.signOut();
  currentUser = null;
  setLoggedIn(false);
  $("loginPassword").value = "";
  message("loginStatus", "Tu es déconnecté.");
}

/* =========================================
   INITIALISATION
========================================= */

async function initializeAdmin() {
  if (isInitialized) {
    await loadSettings();
    await loadCatalogue();
    return;
  }

  isInitialized = true;

  try {
    await loadSettings();
    await loadCatalogue();
    showPage("dashboard");
  } catch (error) {
    console.error("Erreur d'initialisation :", error);
    alert("Une erreur est survenue pendant le chargement de l'administration. Consulte la console du navigateur.");
  }
}

/* =========================================
   PARAMÈTRES SUPABASE
========================================= */

async function loadSettings() {
  const { data, error } = await db
    .from("site_settings")
    .select("content")
    .eq("id", SETTINGS_ID)
    .maybeSingle();

  if (error) throw error;

  settings = data && data.content && typeof data.content === "object"
    ? data.content
    : {};

  if (!settings.visual) settings.visual = {};
  if (!settings.commerce) settings.commerce = {};
  if (!Array.isArray(settings.customCategories)) settings.customCategories = [];

  categories = [...DEFAULT_CATEGORIES];

  settings.customCategories.forEach((item) => {
    if (
      item &&
      item.slug &&
      item.label &&
      !categories.some((category) => category.slug === item.slug)
    ) {
      categories.push(item);
    }
  });

  fillVisualForm();
  fillCommerceForm();
  renderCategoryOptions();
  renderCategoryList();
}

async function saveSettingsData() {
  const { error } = await db
    .from("site_settings")
    .upsert({
      id: SETTINGS_ID,
      content: settings,
      updated_at: new Date().toISOString()
    }, { onConflict: "id" });

  if (error) throw error;
}

/* =========================================
   ÉDITEUR VISUEL
========================================= */

function fillVisualForm() {
  const visual = settings.visual || {};
  const texts = visual.texts || {};

  $("siteName").value = visual.siteName || "EUROPEAN SATFEED PREMIUM";
  $("logoText").value = visual.logoText || "EUROPEAN SATFEED PREMIUM";
  $("accentColor").value = visual.accentColor || "#e8ff38";
  $("backgroundColor").value = visual.backgroundColor || "#080b12";
  $("logoUrl").value = visual.logoUrl || "";
  $("backgroundUrl").value = visual.backgroundUrl || "";

  $("heroTitle").value = texts.heroTitle || "";
  $("heroDescription").value = texts.heroDescription || "";
  $("archiveTitle").value = texts.archiveTitle || "";
  $("archiveDescription").value = texts.archiveDescription || "";
  $("premiumTitle").value = texts.premiumTitle || "";
  $("premiumDescription").value = texts.premiumDescription || "";

  updateVisualPreview();
}

async function saveVisual() {
  const visual = {
    siteName: $("siteName").value.trim(),
    logoText: $("logoText").value.trim(),
    accentColor: $("accentColor").value,
    backgroundColor: $("backgroundColor").value,
    logoUrl: $("logoUrl").value.trim(),
    backgroundUrl: $("backgroundUrl").value.trim(),
    texts: {
      heroTitle: $("heroTitle").value.trim(),
      heroDescription: $("heroDescription").value.trim(),
      archiveTitle: $("archiveTitle").value.trim(),
      archiveDescription: $("archiveDescription").value.trim(),
      premiumTitle: $("premiumTitle").value.trim(),
      premiumDescription: $("premiumDescription").value.trim()
    }
  };

  if (visual.logoUrl && !safeUrl(visual.logoUrl)) {
    message("visualStatus", "L'URL du logo n'est pas valide.", "error");
    return;
  }

  if (visual.backgroundUrl && !safeUrl(visual.backgroundUrl)) {
    message("visualStatus", "L'URL de l'image de fond n'est pas valide.", "error");
    return;
  }

  settings.visual = visual;

  try {
    await saveSettingsData();
    message("visualStatus", "Paramètres visuels enregistrés dans Supabase.", "success");
  } catch (error) {
    console.error(error);
    message("visualStatus", error.message || "Erreur lors de l'enregistrement.", "error");
  }
}

function updateVisualPreview() {
  const name = $("logoText").value.trim() || "EUROPEAN SATFEED PREMIUM";
  const accent = $("accentColor").value;
  const background = $("backgroundColor").value;

  $("brandPreview").textContent = name;
  $("brandPreview").style.color = accent;
  $("colorPreview").style.background = background;
  $("colorPreview").style.color = accent;
  $("colorPreview").style.borderColor = accent;
  $("colorPreview").textContent = "EUROPEAN SATFEED PREMIUM";
}

/* =========================================
   PARAMÈTRES COMMERCIAUX
========================================= */

function fillCommerceForm() {
  const commerce = settings.commerce || {};

  $("price").value = commerce.price ?? "4.20";
  $("priceLabel").value = commerce.priceLabel || "4.20 €";
  $("payhipUrl").value = commerce.payhipUrl || "https://payhip.com/NJredit10";
  $("telegramUrl").value = commerce.telegramUrl || "https://t.me/EUROPEAN_PREM_TEASER";
  $("supportUrl").value = commerce.supportUrl || "https://t.me/Njr_edit_10";
}

async function saveCommerceSettings() {
  const price = Number($("price").value);

  if (!Number.isFinite(price) || price < 0) {
    message("settingsStatus", "Le prix doit être un nombre valide.", "error");
    return;
  }

  const commerce = {
    price: price,
    priceLabel: $("priceLabel").value.trim(),
    payhipUrl: $("payhipUrl").value.trim(),
    telegramUrl: $("telegramUrl").value.trim(),
    supportUrl: $("supportUrl").value.trim()
  };

  for (const [label, value] of [
    ["Payhip", commerce.payhipUrl],
    ["Telegram", commerce.telegramUrl],
    ["Support", commerce.supportUrl]
  ]) {
    if (value && !safeUrl(value)) {
      message("settingsStatus", "Le lien " + label + " n'est pas une URL valide.", "error");
      return;
    }
  }

  settings.commerce = commerce;

  try {
    await saveSettingsData();
    message("settingsStatus", "Paramètres commerciaux enregistrés.", "success");
  } catch (error) {
    console.error(error);
    message("settingsStatus", error.message || "Erreur lors de l'enregistrement.", "error");
  }
}

/* =========================================
   CATÉGORIES
========================================= */

function renderCategoryOptions() {
  const select = $("itemCategory");
  const currentValue = select.value;

  select.innerHTML = categories.map((item) => {
    return `<option value="${escapeHtml(item.slug)}">${escapeHtml(item.label)}</option>`;
  }).join("");

  if (categories.some((item) => item.slug === currentValue)) {
    select.value = currentValue;
  }
}

function renderCategoryList() {
  const container = $("categoryList");

  if (!categories.length) {
    container.textContent = "Aucune catégorie.";
    return;
  }

  container.innerHTML = categories.map((item) => {
    const isDefault = DEFAULT_CATEGORIES.some((base) => base.slug === item.slug);

    return `
      <div class="category-row">
        <div>
          <strong>${escapeHtml(item.label)}</strong>
          <div class="muted">${escapeHtml(item.slug)}</div>
        </div>
        ${
          isDefault
            ? '<span class="pill">CATÉGORIE DE BASE</span>'
            : `<button class="btn btn-danger btn-small" type="button" data-remove-category="${escapeHtml(item.slug)}">Supprimer</button>`
        }
      </div>
    `;
  }).join("");
}

async function addCategory() {
  const label = $("newCategory").value.trim();
  const slug = slugify($("newCategorySlug").value.trim() || label);

  if (!label || !slug) {
    message("categoryStatus", "Renseigne le nom de la catégorie.", "error");
    return;
  }

  if (categories.some((item) => item.slug === slug)) {
    message("categoryStatus", "Cette catégorie existe déjà.", "error");
    return;
  }

  const newItem = { slug, label: label.toUpperCase() };
  settings.customCategories.push(newItem);

  try {
    await saveSettingsData();
    categories.push(newItem);
    $("newCategory").value = "";
    $("newCategorySlug").value = "";
    renderCategoryOptions();
    renderCategoryList();
    updateDashboard();
    message("categoryStatus", "Catégorie ajoutée.", "success");
  } catch (error) {
    settings.customCategories = settings.customCategories.filter((item) => item.slug !== slug);
    console.error(error);
    message("categoryStatus", error.message || "Impossible d'ajouter la catégorie.", "error");
  }
}

async function removeCategory(slug) {
  const used = catalogue.some((item) => item.category === slug);

  if (used) {
    message("categoryStatus", "Cette catégorie est encore utilisée par des éléments du catalogue. Modifie d'abord leur catégorie.", "error");
    return;
  }

  if (!confirm("Supprimer cette catégorie ?")) return;

  const previous = [...settings.customCategories];
  settings.customCategories = settings.customCategories.filter((item) => item.slug !== slug);

  try {
    await saveSettingsData();
    categories = categories.filter((item) => item.slug !== slug);
    renderCategoryOptions();
    renderCategoryList();
    updateDashboard();
    message("categoryStatus", "Catégorie supprimée.", "success");
  } catch (error) {
    settings.customCategories = previous;
    console.error(error);
    message("categoryStatus", error.message || "Erreur lors de la suppression.", "error");
  }
}

/* =========================================
   CATALOGUE — CHARGEMENT ET AFFICHAGE
========================================= */

async function loadCatalogue() {
  const { data, error } = await db
    .from("catalogue")
    .select("*")
    .order("position", { ascending: true })
    .order("updated_at", { ascending: false });

  if (error) throw error;

  catalogue = data || [];
  renderCatalogue();
  updateDashboard();
}

function renderCatalogue() {
  const tbody = $("catalogueRows");

  if (!catalogue.length) {
    tbody.innerHTML = '<tr><td colspan="5">Aucun élément dans le catalogue.</td></tr>';
    return;
  }

  tbody.innerHTML = catalogue.map((item) => {
    const title = getTitle(item);
    const image = safeUrl(item.image_url);
    const published = item.published === true;

    return `
      <tr>
        <td>
          ${
            image
              ? `<img src="${escapeHtml(image)}" alt="" loading="lazy">`
              : '<span class="muted">Pas d’image</span>'
          }
        </td>
        <td><strong>${escapeHtml(title)}</strong></td>
        <td>${escapeHtml(categoryLabel(item.category))}</td>
        <td>
          <span class="pill ${published ? "live" : "off"}">
            ${published ? "PUBLIÉ" : "MASQUÉ"}
          </span>
        </td>
        <td>
          <button class="btn btn-small" type="button" data-edit="${escapeHtml(item.id)}">Modifier</button>
          <button class="btn btn-danger btn-small" type="button" data-delete="${escapeHtml(item.id)}">Supprimer</button>
        </td>
      </tr>
    `;
  }).join("");
}

function updateDashboard() {
  $("statTotal").textContent = catalogue.length;
  $("statPublished").textContent = catalogue.filter((item) => item.published === true).length;
  $("statCategories").textContent = categories.length;

  const recent = [...catalogue]
    .sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0))
    .slice(0, 5);

  $("recentList").innerHTML = recent.length
    ? recent.map((item) => `
        <div class="recent-row">
          <strong>${escapeHtml(getTitle(item))}</strong>
          <span class="muted">${escapeHtml(categoryLabel(item.category))}</span>
        </div>
      `).join("")
    : '<p class="muted">Ton catalogue est encore vide.</p>';
}

/* =========================================
   CATALOGUE — AJOUT / MODIFICATION
========================================= */

function resetCatalogueForm() {
  $("catalogueForm").reset();
  $("itemId").value = "";
  $("itemPosition").value = "0";
  $("itemPublished").checked = true;
  $("coverUrl").value = "";
  $("coverFile").value = "";
  $("coverPreview").textContent = "Aperçu de la couverture";
  $("catalogueFormTitle").textContent = "Ajouter un élément";
  $("saveItem").textContent = "Enregistrer l'élément";
  $("cancelEdit").classList.add("hidden");
  message("catalogueStatus", "");
}

function editCatalogueItem(id) {
  const item = catalogue.find((entry) => entry.id === id);
  if (!item) return;

  $("itemId").value = item.id;

  $("titleFr").value = item.title && typeof item.title === "object"
    ? item.title.fr || ""
    : item.title || "";

  $("titleEn").value = item.title && typeof item.title === "object"
    ? item.title.en || ""
    : "";

  $("descriptionFr").value = item.description && typeof item.description === "object"
    ? item.description.fr || ""
    : item.description || "";

  $("descriptionEn").value = item.description && typeof item.description === "object"
    ? item.description.en || ""
    : "";

  renderCategoryOptions();

  if (categories.some((category) => category.slug === item.category)) {
    $("itemCategory").value = item.category;
  }

  $("itemPosition").value = item.position ?? 0;
  $("itemPublished").checked = item.published === true;
  $("coverUrl").value = item.image_url || "";
  $("coverFile").value = "";

  const image = safeUrl(item.image_url);
  $("coverPreview").innerHTML = image
    ? `<img src="${escapeHtml(image)}" alt="Aperçu de la couverture">`
    : "Aperçu de la couverture";

  $("catalogueFormTitle").textContent = "Modifier un élément";
  $("saveItem").textContent = "Enregistrer les modifications";
  $("cancelEdit").classList.remove("hidden");

  showPage("catalogue");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* =========================================
   COUVERTURES — STORAGE
========================================= */

async function uploadCover(file) {
  if (!file) return null;

  if (!file.type.startsWith("image/")) {
    throw new Error("Le fichier sélectionné doit être une image.");
  }

  const extension = (file.name.split(".").pop() || "jpg")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  const path = `${Date.now()}-${makeId()}.${extension}`;

  const { error } = await db.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type
    });

  if (error) throw error;

  const { data } = db.storage
    .from(BUCKET)
    .getPublicUrl(path);

  return data.publicUrl;
}

async function saveCatalogueItem(event) {
  event.preventDefault();

  const titleFr = $("titleFr").value.trim();

  if (!titleFr) {
    message("catalogueStatus", "Le titre français est obligatoire.", "error");
    return;
  }

  const id = $("itemId").value.trim();
  const file = $("coverFile").files[0];

  let imageUrl = $("coverUrl").value.trim();

  if (imageUrl && !safeUrl(imageUrl)) {
    message("catalogueStatus", "L'URL de la couverture n'est pas valide.", "error");
    return;
  }

  const button = $("saveItem");
  button.disabled = true;
  button.textContent = "Enregistrement…";

  try {
    const existing = id ? catalogue.find((item) => item.id === id) : null;

    if (file) {
      message("catalogueStatus", "Envoi de la couverture…");
      imageUrl = await uploadCover(file);
    } else if (!imageUrl && existing) {
      imageUrl = existing.image_url || "";
    }

    const record = {
      title: {
        fr: titleFr,
        en: $("titleEn").value.trim() || titleFr
      },
      description: {
        fr: $("descriptionFr").value.trim(),
        en: $("descriptionEn").value.trim()
      },
      category: $("itemCategory").value,
      image_url: imageUrl || null,
      published: $("itemPublished").checked,
      position: Number($("itemPosition").value) || 0,
      updated_at: new Date().toISOString()
    };

    let result;

    if (id) {
      result = await db
        .from("catalogue")
        .update(record)
        .eq("id", id);
    } else {
      record.id = makeId();
      result = await db
        .from("catalogue")
        .insert(record);
    }

    if (result.error) throw result.error;

    message("catalogueStatus", "Élément enregistré avec succès.", "success");
    resetCatalogueForm();
    await loadCatalogue();

  } catch (error) {
    console.error(error);
    message("catalogueStatus", error.message || "Une erreur est survenue.", "error");
  } finally {
    button.disabled = false;
    button.textContent = $("itemId").value
      ? "Enregistrer les modifications"
      : "Enregistrer l'élément";
  }
}

/* =========================================
   CATALOGUE — SUPPRESSION
========================================= */

async function deleteCatalogueItem(id) {
  const item = catalogue.find((entry) => entry.id === id);
  if (!item) return;

  const confirmed = confirm(
    `Supprimer "${getTitle(item)}" du catalogue ? Cette action ne peut pas être annulée.`
  );

  if (!confirmed) return;

  try {
    const { error } = await db
      .from("catalogue")
      .delete()
      .eq("id", id);

    if (error) throw error;

    if ($("itemId").value === id) {
      resetCatalogueForm();
    }

    await loadCatalogue();
    message("catalogueStatus", "Élément supprimé du catalogue.", "success");

  } catch (error) {
    console.error(error);
    message("catalogueStatus", error.message || "Impossible de supprimer cet élément.", "error");
  }
}

/* =========================================
   APERÇU IMAGE
========================================= */

function previewCover() {
  const file = $("coverFile").files[0];
  const url = $("coverUrl").value.trim();

  if (file) {
    const reader = new FileReader();

    reader.onload = () => {
      $("coverPreview").innerHTML =
        `<img src="${reader.result}" alt="Aperçu de la couverture">`;
    };

    reader.readAsDataURL(file);
    return;
  }

  if (url && safeUrl(url)) {
    $("coverPreview").innerHTML =
      `<img src="${escapeHtml(url)}" alt="Aperçu de la couverture">`;
    return;
  }

  $("coverPreview").textContent = "Aperçu de la couverture";
}

/* =========================================
   ÉVÉNEMENTS
========================================= */

function bindEvents() {
  // Connexion et déconnexion
  $("loginForm").addEventListener("submit", login);
  $("logoutBtn").addEventListener("click", logout);

  // Navigation latérale
  document.querySelectorAll(".nav-btn").forEach((button) => {
    button.addEventListener("click", () => showPage(button.dataset.page));
  });

  document.querySelectorAll("[data-goto]").forEach((button) => {
    button.addEventListener("click", () => showPage(button.dataset.goto));
  });

  // Éditeur visuel
  $("saveVisual").addEventListener("click", saveVisual);

  ["logoText", "accentColor", "backgroundColor"].forEach((id) => {
    $(id).addEventListener("input", updateVisualPreview);
  });

  // Paramètres commerciaux
  $("saveSettings").addEventListener("click", saveCommerceSettings);

  // Catégories
  $("addCategory").addEventListener("click", addCategory);

  $("newCategory").addEventListener("input", () => {
    if (!$("newCategorySlug").value.trim()) {
      $("newCategorySlug").value = slugify($("newCategory").value);
    }
  });

  $("categoryList").addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-category]");
    if (button) removeCategory(button.dataset.removeCategory);
  });

  // Catalogue
  $("catalogueForm").addEventListener("submit", saveCatalogueItem);
  $("cancelEdit").addEventListener("click", resetCatalogueForm);
  $("refreshCatalogue").addEventListener("click", async () => {
    try {
      await loadCatalogue();
      message("catalogueStatus", "Catalogue actualisé.", "success");
    } catch (error) {
      message("catalogueStatus", error.message || "Erreur d'actualisation.", "error");
    }
  });

  $("catalogueRows").addEventListener("click", (event) => {
    const editButton = event.target.closest("[data-edit]");
    const deleteButton = event.target.closest("[data-delete]");

    if (editButton) editCatalogueItem(editButton.dataset.edit);
    if (deleteButton) deleteCatalogueItem(deleteButton.dataset.delete);
  });

  $("coverFile").addEventListener("change", previewCover);
  $("coverUrl").addEventListener("input", previewCover);
}

/* =========================================
   DÉMARRAGE
========================================= */

async function start() {
  // Les événements sont attachés avant la vérification de session.
  // Le formulaire de connexion fonctionne donc même sans session active.
  bindEvents();

  try {
    await checkOwner();
  } catch (error) {
    console.error("Erreur au démarrage :", error);
    setLoggedIn(false);
    message("loginStatus", error.message || "Impossible de charger l'administration.", "error");
  }
}

start();
