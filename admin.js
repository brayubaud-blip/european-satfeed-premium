
const SUPABASE_URL = "https://afipejmgjkigcbohsxkt.supabase.co";
const SUPABASE_KEY = "sb_publishable_MWi4yR-uw_TfrxJJrKdS1Q_783VTF6Z";

const OWNER_ID = "1f2e7add-fe3d-4792-8c8c-9708e584b9d6";

const client = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const $ = id => document.getElementById(id);

const loginPanel = $("loginPanel");
const dashboard = $("dashboard");
const loginStatus = $("loginStatus");
const formStatus = $("formStatus");
const listStatus = $("listStatus");
const coverList = $("coverList");

function message(element, text, type = "") {
  element.textContent = text;
  element.className = "status " + type;
}

function showDashboard(visible) {
  loginPanel.classList.toggle("hidden", visible);
  dashboard.classList.toggle("hidden", !visible);
}

function isImage(file) {
  return file && /^image\/(jpeg|png|webp|gif)$/.test(file.type);
}

async function migrateOldClips() {
  const { error } = await client
    .from("catalogue")
    .update({
      category: "edits",
      updated_at: new Date().toISOString()
    })
    .eq("category", "clips");

  if (error) {
    console.error("Migration des anciennes catégories :", error);
  }
}

async function checkOwner() {
  const { data, error } = await client.auth.getUser();

  if (error || !data.user) {
    showDashboard(false);
    return false;
  }

  if (data.user.id !== OWNER_ID) {
    await client.auth.signOut();
    showDashboard(false);
    message(loginStatus, "Ce compte n'est pas autorisé.", "bad");
    return false;
  }

  showDashboard(true);

  await migrateOldClips();
  await loadCovers();

  return true;
}

$("loginForm").addEventListener("submit", async event => {
  event.preventDefault();
  message(loginStatus, "Connexion…");

  const email = $("email").value.trim();
  const password = $("password").value;

  const { error } = await client.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    message(
      loginStatus,
      "Connexion impossible : " + error.message,
      "bad"
    );
    return;
  }

  await checkOwner();
});

$("logoutBtn").addEventListener("click", async () => {
  await client.auth.signOut();

  showDashboard(false);
  $("password").value = "";

  message(loginStatus, "Déconnecté.", "good");
});

function resetForm() {
  $("coverForm").reset();
  $("coverId").value = "";
  $("position").value = "0";
  $("published").value = "false";
  $("formTitle").textContent = "ADD A COVER";

  message(formStatus, "");
}

$("resetBtn").addEventListener("click", resetForm);

async function uploadCover(file) {
  if (!isImage(file)) {
    throw new Error("Choisis une image JPG, PNG, WEBP ou GIF.");
  }

  const extension = file.name.split(".").pop().toLowerCase();
  const path = `${crypto.randomUUID()}.${extension}`;

  const { error } = await client.storage
    .from("covers")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type
    });

  if (error) throw error;

  const { data } = client.storage
    .from("covers")
    .getPublicUrl(path);

  return data.publicUrl;
}

$("coverForm").addEventListener("submit", async event => {
  event.preventDefault();

  message(formStatus, "Enregistrement en cours…");

  try {
    const { data: authData, error: authError } =
      await client.auth.getUser();

    if (authError || authData.user?.id !== OWNER_ID) {
      throw new Error("Session propriétaire invalide. Reconnecte-toi.");
    }

    const id = $("coverId").value || crypto.randomUUID();
    const file = $("coverImage").files[0];
    const existing = await getCover(id);

    let imageUrl = existing?.image_url || "";

    if (file) {
      imageUrl = await uploadCover(file);
    }

    if (!imageUrl) {
      throw new Error("Ajoute une image avant d'enregistrer.");
    }

    const record = {
      id,
      title: {
        fr: $("titleFr").value.trim(),
        en: $("titleEn").value.trim()
      },
      description: {
        fr: $("descFr").value.trim(),
        en: $("descEn").value.trim()
      },
      category: $("category").value,
      image_url: imageUrl,
      published: $("published").value === "true",
      position: Number($("position").value) || 0,
      updated_at: new Date().toISOString()
    };

    const { error } = await client
      .from("catalogue")
      .upsert(record, { onConflict: "id" });

    if (error) throw error;

    message(formStatus, "Cover enregistrée avec succès.", "good");

    resetForm();
    await loadCovers();

  } catch (error) {
    message(formStatus, "Erreur : " + error.message, "bad");
  }
});

async function getCover(id) {
  if (!id) return null;

  const { data, error } = await client
    .from("catalogue")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;

  return data;
}

function createCoverCard(item) {
  const card = document.createElement("article");
  card.className = "item";

  const img = document.createElement("img");
  img.src = item.image_url;
  img.alt = item.title?.fr || "Archive cover";
  img.loading = "lazy";

  const body = document.createElement("div");
  body.className = "item-body";

  const title = document.createElement("h3");
  title.textContent =
    item.title?.fr || item.title?.en || "Sans titre";

  const category = document.createElement("p");
  category.textContent = (item.category || "unclassified").toUpperCase();

  const status = document.createElement("div");
  status.className = "tag";
  status.textContent = item.published
    ? "● PUBLISHED"
    : "○ DRAFT";

  const actions = document.createElement("div");
  actions.className = "actions";

  const edit = document.createElement("button");
  edit.className = "btn secondary";
  edit.textContent = "EDIT";
  edit.addEventListener("click", () => editCover(item));

  const remove = document.createElement("button");
  remove.className = "btn danger";
  remove.textContent = "DELETE";
  remove.addEventListener("click", () => deleteCover(item));

  actions.append(edit, remove);
  body.append(title, category, status, actions);
  card.append(img, body);

  return card;
}

async function loadCovers() {
  message(listStatus, "Chargement des covers…");
  coverList.replaceChildren();

  const { data, error } = await client
    .from("catalogue")
    .select("*")
    .order("position", { ascending: true });

  if (error) {
    message(listStatus, "Erreur : " + error.message, "bad");
    return;
  }

  if (!data.length) {
    message(listStatus, "Aucune cover enregistrée pour le moment.");
    return;
  }

  data.forEach(item => {
    coverList.append(createCoverCard(item));
  });

  message(
    listStatus,
    `${data.length} cover(s) dans ton catalogue.`,
    "good"
  );
}

function editCover(item) {
  $("coverId").value = item.id;

  $("titleFr").value = item.title?.fr || "";
  $("titleEn").value = item.title?.en || "";

  $("descFr").value = item.description?.fr || "";
  $("descEn").value = item.description?.en || "";

  $("category").value =
    item.category === "clips" ? "edits" : (item.category || "comps");

  $("position").value = item.position ?? 0;
  $("published").value = String(item.published);

  $("coverImage").value = "";
  $("formTitle").textContent = "EDIT COVER";

  message(
    formStatus,
    "Laisse le champ image vide pour conserver la couverture actuelle."
  );

  $("coverForm").scrollIntoView({ behavior: "smooth" });
}

async function deleteCover(item) {
  const confirmed = confirm(
    `Supprimer "${item.title?.fr || item.title?.en || "cette cover"}" du catalogue ?`
  );

  if (!confirmed) return;

  const { error } = await client
    .from("catalogue")
    .delete()
    .eq("id", item.id);

  if (error) {
    message(
      listStatus,
      "Suppression impossible : " + error.message,
      "bad"
    );
    return;
  }

  message(listStatus, "Cover supprimée du catalogue.", "good");

  await loadCovers();
}

$("refreshBtn").addEventListener("click", loadCovers);

checkOwner();
