
/* EUROPEAN SATFEED PREMIUM — éditeur visuel intégré */
(() => {
  "use strict";

  const SUPABASE_URL = "https://afipejmgjkigcbohsxkt.supabase.co";
  const SUPABASE_KEY = "sb_publishable_MWi4yR-uw_TfrxJJrKdS1Q_783VTF6Z";
  const OWNER_UID = "1f2e7add-fe3d-4792-8c8c-9708e584b9d6";
  const BUCKET = "covers";

  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));

  if (!window.supabase?.createClient) {
    console.error("Supabase JS n'est pas chargé.");
    return;
  }

  const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  let isOwner = false;
  let editMode = false;
  let settingsRow = null;
  let visual = {};
  let selectedTarget = null;
  let catalogue = [];
  let editingItemId = null;

  const css = document.createElement("style");
  css.textContent = `
    #esp-launch{position:fixed;right:18px;bottom:18px;z-index:99990;background:#080b12;color:#eaff00;border:1px solid #eaff00;padding:12px 17px;font-weight:900;cursor:pointer}
    #esp-login,#esp-panel{position:fixed;inset:0;z-index:99999;background:#05070cef;color:white;display:none;align-items:center;justify-content:center;padding:16px;font:14px Arial}
    #esp-login.open,#esp-panel.open{display:flex}
    .esp-window{width:min(900px,100%);max-height:92vh;overflow:auto;background:#101722;border:1px solid #384354;padding:22px}
    .esp-window h2{color:#eaff00;font-size:25px;margin:0 0 8px}
    .esp-muted{color:#aab2bf;font-size:12px;line-height:1.5}
    .esp-row{display:flex;gap:9px;flex-wrap:wrap;margin:14px 0}
    .esp-btn{border:1px solid #536071;background:#182233;color:white;padding:10px 13px;cursor:pointer;font-weight:700}
    .esp-primary{background:#eaff00;color:#080b12;border-color:#eaff00}
    .esp-danger{color:#ff9aa1;border-color:#a43c46}
    .esp-field{display:grid;gap:6px;margin:10px 0;color:#cbd2dd;font-size:12px}
    .esp-field input,.esp-field textarea,.esp-field select{box-sizing:border-box;width:100%;background:#080d15;color:white;border:1px solid #3a4658;padding:11px;font:14px Arial}
    .esp-field textarea{min-height:70px}
    .esp-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px}
    .esp-divider{height:1px;background:#303b4c;margin:18px 0}
    .esp-item{display:flex;align-items:center;gap:12px;padding:10px;border:1px solid #303b4c;margin:8px 0}
    .esp-item img{width:58px;height:58px;object-fit:cover;background:#080d15}
    .esp-item-info{flex:1}
    .esp-item strong{display:block;margin-bottom:5px}
    .esp-hint{background:#eaff00;color:#080b12;padding:10px;margin:12px 0;font-weight:700;font-size:12px}
    body.esp-editing [data-esp-editable]:hover{outline:2px dashed #eaff00;outline-offset:3px;cursor:text}
    @media(max-width:600px){.esp-window{padding:14px}.esp-btn{font-size:11px}}
  `;
  document.head.append(css);

  function element(tag, attrs = {}, html = "") {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([k,v]) => {
      if (k === "class") el.className = v;
      else el.setAttribute(k,v);
    });
    el.innerHTML = html;
    return el;
  }

  const launch = element("button", {id:"esp-launch",type:"button"}, "ADMIN");
  launch.hidden = true;
  document.body.append(launch);

  const login = element("div", {id:"esp-login",role:"dialog"});
  login.innerHTML = `
    <div class="esp-window" style="max-width:420px">
      <h2>ES+ ADMIN</h2>
      <p class="esp-muted">Connexion réservée au propriétaire.</p>
      <form id="esp-login-form">
        <label class="esp-field">Adresse e-mail
          <input id="esp-email" type="email" autocomplete="username" required>
        </label>
        <label class="esp-field">Mot de passe
          <input id="esp-password" type="password" autocomplete="current-password" required>
        </label>
        <div class="esp-row">
          <button class="esp-btn esp-primary" type="submit">SE CONNECTER</button>
          <button class="esp-btn" type="button" data-close-login>ANNULER</button>
        </div>
        <p id="esp-login-message" class="esp-muted"></p>
      </form>
    </div>`;
  document.body.append(login);

  const panel = element("div", {id:"esp-panel",role:"dialog"});
  panel.innerHTML = `
    <div class="esp-window">
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:center">
        <div><h2>ÉDITEUR EUROPEAN SATFEED PREMIUM</h2>
        <p class="esp-muted">Modification directement depuis la page publique.</p></div>
        <button class="esp-btn" data-close>FERMER ✕</button>
      </div>

      <div class="esp-hint" id="esp-hint">Mode édition désactivé.</div>
      <div class="esp-row">
        <button class="esp-btn esp-primary" id="esp-toggle">ACTIVER L'ÉDITION</button>
        <button class="esp-btn" id="esp-save">ENREGISTRER</button>
        <button class="esp-btn" id="esp-bg">IMAGE DE FOND</button>
        <button class="esp-btn" id="esp-logo">REMPLACER LE LOGO</button>
      </div>
      <p class="esp-muted">Active l'édition puis clique sur un texte pour le modifier directement. Les changements de texte sont enregistrés avec le bouton ENREGISTRER.</p>
      <div class="esp-row">
        <button class="esp-btn" id="esp-links">MODIFIER UN LIEN</button>
        <button class="esp-btn" id="esp-reset">ANNULER ET RECHARGER</button>
      </div>

      <div class="esp-divider"></div>
      <h2>CATALOGUE</h2>
      <p class="esp-muted">Ajoute, modifie ou supprime les fiches enregistrées dans la table catalogue.</p>
      <div class="esp-row">
        <button class="esp-btn esp-primary" id="esp-new">＋ AJOUTER UN CONTENU</button>
        <button class="esp-btn" id="esp-refresh">ACTUALISER</button>
      </div>
      <div id="esp-list"></div>

      <div class="esp-divider"></div>
      <form id="esp-item-form" hidden>
        <h2 id="esp-form-title">NOUVEAU CONTENU</h2>
        <div class="esp-grid">
          <label class="esp-field">Titre français<input id="esp-title-fr" required></label>
          <label class="esp-field">Titre anglais<input id="esp-title-en"></label>
          <label class="esp-field">Description française<textarea id="esp-desc-fr"></textarea></label>
          <label class="esp-field">Description anglaise<textarea id="esp-desc-en"></textarea></label>
          <label class="esp-field">Catégorie
            <select id="esp-category">
              <option value="comps">COMPS</option>
              <option value="folders">FOLDERS</option>
              <option value="old">OLD</option>
              <option value="edits">EDITS</option>
              <option value="collections">COLLECTIONS</option>
            </select>
          </label>
          <label class="esp-field">Image de couverture<input id="esp-image" type="file" accept="image/*"></label>
          <label class="esp-field">URL de couverture<input id="esp-image-url" type="url"></label>
          <label class="esp-field">Position<input id="esp-position" type="number" value="0"></label>
        </div>
        <label class="esp-field"><span><input id="esp-published" type="checkbox" checked style="width:auto"> Publier sur le site</span></label>
        <div class="esp-row">
          <button class="esp-btn esp-primary" type="submit">ENREGISTRER LA FICHE</button>
          <button class="esp-btn" type="button" id="esp-cancel">ANNULER</button>
        </div>
        <p class="esp-muted" id="esp-item-message"></p>
      </form>
      <p class="esp-muted" id="esp-message"></p>
    </div>`;
  document.body.append(panel);

  const picker = element("input", {type:"file",accept:"image/*",hidden:"hidden"});
  document.body.append(picker);

  function say(text, target = "#esp-message") {
    const node = $(target);
    if (node) node.textContent = text;
  }

  async function checkOwner() {
    const {data,error} = await db.auth.getSession();
    if (error) throw error;
    isOwner = !!data.session?.user && data.session.user.id === OWNER_UID;
    launch.hidden = !isOwner;
    return isOwner;
  }

  async function loadSettings() {
    const {data,error} = await db.from("site_settings").select("*").limit(10);
    if (error) throw error;
    settingsRow = (data || []).find(row => row.content && typeof row.content === "object") || null;
    visual = settingsRow?.content?.visual || {};
    applyVisual();
  }

  function applyVisual() {
    const root = document.documentElement;
    if (visual.accent) root.style.setProperty("--yellow",visual.accent);
    if (visual.background) root.style.setProperty("--bg",visual.background);

    if (visual.heroBackground) {
      const hero = $(".hero");
      if (hero) {
        hero.style.backgroundImage = `linear-gradient(90deg,#080b12e8,#080b1280),url("${visual.heroBackground}")`;
        hero.style.backgroundSize = "cover";
        hero.style.backgroundPosition = "center";
      }
    }

    if (visual.logoUrl) {
      $$(".brand-mark").forEach(mark => {
        mark.innerHTML = `<img src="${esc(visual.logoUrl)}" alt="Logo" style="max-width:150px;max-height:48px;object-fit:contain">`;
      });
    }

    Object.entries(visual.texts || {}).forEach(([key,value]) => {
      const node = document.querySelector(`[data-esp-key="${CSS.escape(key)}"]`);
      if (node) node.textContent = value;
    });
  }

  function markEditable() {
    const selectors = [
      "main h1","main h2","main h3","main p",
      ".topline span:not(.pulse)",".brand-name",
      ".hero-side span",".hero-stamp span",".hero-stamp b",
      ".footer>p",".copyright span","summary","details p"
    ];
    const nodes = selectors.flatMap(s => $$(s));
    nodes.forEach((node,index) => {
      if (node.closest("#esp-panel,#esp-login")) return;
      if (!node.dataset.espKey) node.dataset.espKey = `text_${index}_${node.tagName.toLowerCase()}`;
      node.dataset.espEditable = "1";
      node.setAttribute("contenteditable",editMode ? "true" : "false");
    });
  }

  function collectTexts() {
    visual.texts = visual.texts || {};
    $$("[data-esp-key]").forEach(node => {
      visual.texts[node.dataset.espKey] = node.innerText;
    });
  }

  function toggleEdit() {
    editMode = !editMode;
    document.body.classList.toggle("esp-editing",editMode);
    markEditable();
    $("#esp-toggle").textContent = editMode ? "TERMINER L'ÉDITION" : "ACTIVER L'ÉDITION";
    $("#esp-hint").textContent = editMode
      ? "ÉDITION ACTIVE : clique sur les textes de la page pour les modifier."
      : "Mode édition désactivé.";
  }

  async function upload(file, folder) {
    if (!file || !file.type.startsWith("image/")) throw new Error("Choisis une image.");
    if (file.size > 12*1024*1024) throw new Error("Image trop lourde : maximum 12 Mo.");
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g,"");
    const path = `${folder}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const {error} = await db.storage.from(BUCKET).upload(path,file,{
      cacheControl:"3600",upsert:false,contentType:file.type
    });
    if (error) throw error;
    const {data} = db.storage.from(BUCKET).getPublicUrl(path);
    if (!data?.publicUrl) throw new Error("URL de l'image introuvable.");
    return data.publicUrl;
  }

  async function saveSettings() {
    collectTexts();
    const old = settingsRow?.content && typeof settingsRow.content === "object"
      ? settingsRow.content : {};
    const content = {...old,visual};
    let result;
    if (settingsRow?.id) {
      result = await db.from("site_settings").update({content}).eq("id",settingsRow.id);
    } else {
      result = await db.from("site_settings").insert({id:"public",content}).select().single();
      if (!result.error) settingsRow = result.data;
    }
    if (result.error) throw result.error;
    if (settingsRow) settingsRow.content = content;
    say("Modifications enregistrées dans Supabase.");
  }

  async function loadCatalogue() {
    const {data,error} = await db.from("catalogue")
      .select("id,title,description,category,image_url,published,position")
      .order("position",{ascending:true});
    if (error) throw error;
    catalogue = data || [];
    renderCatalogue();
  }

  function renderCatalogue() {
    const host = $("#esp-list");
    host.replaceChildren();
    if (!catalogue.length) {
      host.textContent = "Aucune fiche enregistrée dans Supabase.";
      return;
    }

    catalogue.forEach(item => {
      const title = item.title?.fr || item.title?.en || item.title || "Sans titre";
      const row = element("div",{class:"esp-item"});
      const img = element("img",{src:item.image_url || "",alt:""});
      const info = element("div",{class:"esp-item-info"});
      info.innerHTML = `<strong>${esc(title)}</strong><span class="esp-muted">${esc(item.category || "—")} · ${item.published ? "Publié" : "Masqué"}</span>`;
      const edit = element("button",{class:"esp-btn",type:"button"},"MODIFIER");
      edit.addEventListener("click",() => fillForm(item));
      const del = element("button",{class:"esp-btn esp-danger",type:"button"},"SUPPRIMER");
      del.addEventListener("click",() => deleteItem(item));
      row.append(img,info,edit,del);
      host.append(row);
    });
  }

  function fillForm(item = null) {
    editingItemId = item?.id || null;
    $("#esp-item-form").hidden = false;
    $("#esp-form-title").textContent = item ? "MODIFIER LE CONTENU" : "NOUVEAU CONTENU";
    $("#esp-title-fr").value = item?.title?.fr || "";
    $("#esp-title-en").value = item?.title?.en || "";
    $("#esp-desc-fr").value = item?.description?.fr || "";
    $("#esp-desc-en").value = item?.description?.en || "";
    $("#esp-category").value = item?.category || "comps";
    $("#esp-image").value = "";
    $("#esp-image-url").value = item?.image_url || "";
    $("#esp-position").value = item?.position ?? catalogue.length;
    $("#esp-published").checked = item?.published !== false;
    $("#esp-item-form").scrollIntoView({behavior:"smooth",block:"start"});
  }

  async function saveItem(event) {
    event.preventDefault();
    const button = $('#esp-item-form button[type="submit"]');
    button.disabled = true;

    try {
      let imageUrl = $("#esp-image-url").value.trim();
      const file = $("#esp-image").files[0];
      if (file) imageUrl = await upload(file,"catalogue");

      const payload = {
        title:{fr:$("#esp-title-fr").value.trim(),en:$("#esp-title-en").value.trim()},
        description:{fr:$("#esp-desc-fr").value.trim(),en:$("#esp-desc-en").value.trim()},
        category:$("#esp-category").value,
        image_url:imageUrl,
        published:$("#esp-published").checked,
        position:Number($("#esp-position").value) || 0,
        updated_at:new Date().toISOString()
      };

      if (!payload.title.fr) throw new Error("Le titre français est obligatoire.");

      const result = editingItemId
        ? await db.from("catalogue").update(payload).eq("id",editingItemId)
        : await db.from("catalogue").insert(payload);

      if (result.error) throw result.error;
      $("#esp-item-form").hidden = true;
      await loadCatalogue();
      say("Fiche catalogue enregistrée.");
    } catch (error) {
      say(error.message || "Erreur d'enregistrement.","#esp-item-message");
    } finally {
      button.disabled = false;
    }
  }

  async function deleteItem(item) {
    const title = item.title?.fr || "ce contenu";
    if (!confirm(`Supprimer définitivement « ${title} » ?`)) return;
    const {error} = await db.from("catalogue").delete().eq("id",item.id);
    if (error) return say(error.message);
    await loadCatalogue();
    say("Fiche supprimée.");
  }

  function editLink() {
    const links = $$(".header-cta,.hero-buttons a,.text-link,.premium-button,.footer-links a");
    const list = links.map((a,i) => `${i+1}. ${a.innerText.trim()} → ${a.href}`).join("\n");
    const n = Number(prompt(`Quel lien modifier ?\n${list}\n\nEntre le numéro :`))-1;
    if (!Number.isInteger(n) || !links[n]) return;
    const value = prompt("Nouvelle adresse :",links[n].getAttribute("href"));
    if (!value) return;
    try {
      const url = new URL(value,location.href);
      if (!["https:","http:","mailto:","tel:"].includes(url.protocol)) throw new Error();
      links[n].href = url.href;
      say("Lien modifié dans l'aperçu. Pour le conserver après rechargement, le HTML devra être mis à jour.");
    } catch {
      say("Adresse invalide.");
    }
  }

  launch.addEventListener("click",async () => {
    try {
      if (await checkOwner()) {
        panel.classList.add("open");
        await loadSettings();
        await loadCatalogue();
        markEditable();
      } else login.classList.add("open");
    } catch (error) {
      alert("Erreur : "+error.message);
    }
  });

  $("#esp-login-form").addEventListener("submit",async event => {
    event.preventDefault();
    const output = $("#esp-login-message");
    output.textContent = "Connexion…";
    const {error} = await db.auth.signInWithPassword({
      email:$("#esp-email").value.trim(),
      password:$("#esp-password").value
    });
    if (error) {
      output.textContent = error.message;
      return;
    }
    try {
      if (!(await checkOwner())) throw new Error("Compte non autorisé.");
      login.classList.remove("open");
      panel.classList.add("open");
      await loadSettings();
      await loadCatalogue();
      markEditable();
    } catch (err) {
      await db.auth.signOut();
      output.textContent = err.message;
    }
  });

  login.addEventListener("click",event => {
    if (event.target === login || event.target.closest("[data-close-login]")) login.classList.remove("open");
  });

  panel.addEventListener("click",event => {
    if (event.target === panel || event.target.closest("[data-close]")) {
      editMode = false;
      document.body.classList.remove("esp-editing");
      panel.classList.remove("open");
    }
  });

  $("#esp-toggle").addEventListener("click",toggleEdit);
  $("#esp-save").addEventListener("click",async () => {
    try { await saveSettings(); }
    catch (error) { say("Erreur : "+error.message); }
  });

  $("#esp-bg").addEventListener("click",() => {
    selectedTarget = "background";
    picker.click();
  });

  $("#esp-logo").addEventListener("click",() => {
    selectedTarget = "logo";
    picker.click();
  });

  $("#esp-links").addEventListener("click",editLink);
  $("#esp-reset").addEventListener("click",() => {
    if (confirm("Annuler les changements non enregistrés et recharger ?")) location.reload();
  });
  $("#esp-new").addEventListener("click",() => fillForm());
  $("#esp-refresh").addEventListener("click",async () => {
    try { await loadCatalogue(); say("Catalogue actualisé."); }
    catch (error) { say(error.message); }
  });
  $("#esp-item-form").addEventListener("submit",saveItem);
  $("#esp-cancel").addEventListener("click",() => $("#esp-item-form").hidden = true);

  picker.addEventListener("change",async () => {
    const file = picker.files[0];
    if (!file) return;
    try {
      const url = await upload(file,"site");
      if (selectedTarget === "logo") {
        visual.logoUrl = url;
        $$(".brand-mark").forEach(mark => {
          mark.innerHTML = `<img src="${esc(url)}" alt="Logo" style="max-width:150px;max-height:48px;object-fit:contain">`;
        });
      } else {
        visual.heroBackground = url;
        applyVisual();
      }
      await saveSettings();
      say("Image enregistrée.");
    } catch (error) {
      say("Erreur image : "+error.message);
    } finally {
      picker.value = "";
      selectedTarget = null;
    }
  });

  document.addEventListener("click",event => {
    if (!editMode || !isOwner || event.target.closest("#esp-panel,#esp-login,#esp-launch")) return;
    const image = event.target.closest("img");
    if (image && !image.closest(".archive-grid")) {
      event.preventDefault();
      selectedTarget = image;
      picker.click();
    }
  },true);

  db.auth.onAuthStateChange((_event,session) => {
    isOwner = !!session?.user && session.user.id === OWNER_UID;
    launch.hidden = !isOwner;
    if (!isOwner) {
      editMode = false;
      document.body.classList.remove("esp-editing");
      panel.classList.remove("open");
    }
  });

  checkOwner().catch(error => console.warn("Statut admin indisponible :",error));
})();
