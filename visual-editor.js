
(() => {
  "use strict";

  const SUPABASE_URL = "https://afipejmgjkigcbohsxkt.supabase.co";
  const SUPABASE_KEY = "sb_publishable_MWi4yR-uw_TfrxJJrKdS1Q_783VTF6Z";
  const OWNER_ID = "1f2e7add-fe3d-4792-8c8c-9708e584b9d6";

  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  const SETTINGS_ID = "main";
  let settings = {};
  let selectedElement = null;
  let selectedKey = null;

  const style = document.createElement("style");
  style.textContent = `
    #es-editor-launcher {
      position:fixed;right:20px;bottom:20px;z-index:99999;
      background:#eaff00;color:#080b12;border:0;border-radius:5px;
      padding:14px 19px;font-weight:900;cursor:pointer;
      box-shadow:0 5px 25px #0008
    }
    #es-editor-panel {
      position:fixed;right:20px;bottom:80px;z-index:99999;
      width:min(360px,calc(100vw - 30px));max-height:75vh;
      overflow:auto;background:#101722;color:#fff;
      border:1px solid #39465b;border-radius:8px;padding:20px;
      font:13px Arial;box-shadow:0 10px 40px #000a
    }
    #es-editor-panel h2 {font-size:20px;margin:0 0 12px}
    #es-editor-panel label {display:block;margin:13px 0 6px;color:#c5ccd6}
    #es-editor-panel input,#es-editor-panel textarea {
      box-sizing:border-box;width:100%;padding:10px;
      color:white;background:#080d16;border:1px solid #39465b;
      border-radius:4px
    }
    #es-editor-panel textarea {min-height:75px}
    #es-editor-panel button {
      border:0;border-radius:4px;padding:11px;margin:8px 5px 0 0;
      font-weight:bold;cursor:pointer
    }
    .es-save {background:#eaff00;color:#080b12}
    .es-close {background:#293548;color:white}
    .es-editing {outline:2px dashed #eaff00!important;outline-offset:4px}
    #es-editor-status {color:#eaff00;white-space:pre-wrap;margin-top:10px}
  `;
  document.head.appendChild(style);

  function elementKey(element) {
    if (element.id) return "#" + element.id;

    if (!element.dataset.esEditId) {
      element.dataset.esEditId = "es-" + crypto.randomUUID();
    }
    return '[data-es-edit-id="' + element.dataset.esEditId + '"]';
  }

  function applySettings() {
    const patches = settings.texts || {};

    Object.entries(patches).forEach(([key, value]) => {
      const element = document.querySelector(key);
      if (element) element.textContent = value;
    });

    if (settings.accent) {
      document.documentElement.style.setProperty("--yellow", settings.accent);
      document.documentElement.style.setProperty("--accent", settings.accent);
    }

    if (settings.background) {
      document.body.style.backgroundImage =
        `linear-gradient(#080b12aa,#080b12aa),url("${settings.background}")`;
      document.body.style.backgroundSize = "cover";
      document.body.style.backgroundAttachment = "fixed";
    }
  }

  async function loadSettings() {
    const { data, error } = await supabase
      .from("site_settings")
      .select("content")
      .eq("id", SETTINGS_ID)
      .maybeSingle();

    if (error) {
      console.error("Settings:", error.message);
      return;
    }

    settings = data?.content || {};
    applySettings();
  }

  async function saveSettings() {
    const { error } = await supabase
      .from("site_settings")
      .upsert({
        id: SETTINGS_ID,
        content: settings,
        updated_at: new Date().toISOString()
      }, { onConflict: "id" });

    if (error) throw error;
  }

  function createEditor() {
    const launcher = document.createElement("button");
    launcher.id = "es-editor-launcher";
    launcher.textContent = "✎ EDIT SITE";
    document.body.appendChild(launcher);

    const panel = document.createElement("section");
    panel.id = "es-editor-panel";
    panel.hidden = true;
    panel.innerHTML = `
      <h2>EUROPEAN SATFEED — EDITOR</h2>
      <p>Clique sur un texte du site pour le modifier.</p>

      <label for="es-text">Texte sélectionné</label>
      <textarea id="es-text" placeholder="Sélectionne un texte sur la page"></textarea>

      <label for="es-accent">Couleur principale</label>
      <input id="es-accent" type="color" value="#eaff00">

      <label for="es-background">Image de fond (URL)</label>
      <input id="es-background" type="url" placeholder="https://...">

      <div>
        <button class="es-save" id="es-save-text">ENREGISTRER</button>
        <button class="es-close" id="es-close">FERMER</button>
      </div>
      <p id="es-editor-status"></p>
      <p style="color:#929baa">Les modifications sont enregistrées dans Supabase.</p>
    `;
    document.body.appendChild(panel);

    const textInput = panel.querySelector("#es-text");
    const accentInput = panel.querySelector("#es-accent");
    const backgroundInput = panel.querySelector("#es-background");
    const status = panel.querySelector("#es-editor-status");

    accentInput.value = settings.accent || "#eaff00";
    backgroundInput.value = settings.background || "";

    launcher.addEventListener("click", () => {
      panel.hidden = !panel.hidden;
    });

    panel.querySelector("#es-close").addEventListener("click", () => {
      panel.hidden = true;
      clearSelection();
    });

    document.addEventListener("click", event => {
      if (panel.contains(event.target) || launcher.contains(event.target)) return;

      const element = event.target.closest(
        "h1,h2,h3,h4,p,a,button,span,.brand,.brand-name,.eyebrow"
      );

      if (!element || element.closest("#es-editor-panel")) return;

      event.preventDefault();
      event.stopPropagation();

      clearSelection();
      selectedElement = element;
      selectedKey = elementKey(element);
      element.classList.add("es-editing");
      textInput.value = element.textContent.trim();
      status.textContent = "Élément sélectionné.";
      panel.hidden = false;
    }, true);

    panel.querySelector("#es-save-text").addEventListener("click", async () => {
      try {
        if (selectedElement && selectedKey) {
          settings.texts = settings.texts || {};
          settings.texts[selectedKey] = textInput.value;
          selectedElement.textContent = textInput.value;
        }

        settings.accent = accentInput.value;
        settings.background = backgroundInput.value.trim();

        await saveSettings();
        applySettings();
        status.textContent = "Modifications enregistrées !";
        clearSelection();
      } catch (error) {
        status.textContent = "Erreur : " + error.message;
      }
    });
  }

  function clearSelection() {
    document.querySelectorAll(".es-editing").forEach(element => {
      element.classList.remove("es-editing");
    });
    selectedElement = null;
    selectedKey = null;
  }

  async function start() {
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user || data.user.id !== OWNER_ID) {
      await loadSettings();
      return;
    }

    await loadSettings();
    createEditor();
  }

  start();
})();
