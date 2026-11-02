async function addCover() {
  showMenu(
    Math.max(12, (window.innerWidth - 320) / 2),
    Math.max(12, (window.innerHeight - 430) / 2),
    `
      <h3>AJOUTER UNE NOUVELLE COVER</h3>

      <label>Image de la cover</label>
      <input id="esp-new-image" type="file" accept="image/*">

      <label>Titre français</label>
      <input id="esp-new-title-fr" type="text" placeholder="Ex : UCL RUN">

      <label>Titre anglais</label>
      <input id="esp-new-title-en" type="text" placeholder="Ex : UCL RUN">

      <label>Description française</label>
      <textarea id="esp-new-desc-fr" placeholder="Description facultative"></textarea>

      <label>Description anglaise</label>
      <textarea id="esp-new-desc-en" placeholder="Optional description"></textarea>

      <label>Catégorie</label>
      <select id="esp-new-category">
        ${categoryOptions("edits")}
      </select>

      <button class="primary" id="esp-create-cover">AJOUTER AU CATALOGUE</button>
      <button id="esp-cancel-new-cover">ANNULER</button>
      <p class="hint">Formats image acceptés : JPG, PNG, WEBP. Maximum 12 Mo.</p>
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
      notify("Sélectionne une image depuis ton téléphone.");
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
