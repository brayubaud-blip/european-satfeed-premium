/* EUROPEAN SATFEED PREMIUM — PUBLIC SITE */
"use strict";

(() => {
  const SUPABASE_URL = "https://afipejmgjkigcbohsxkt.supabase.co";
  const SUPABASE_KEY = "sb_publishable_MWi4yR-uw_TfrxJJrKdS1Q_783VTF6Z";

  const GITHUB_COVERS_URL =
    "https://api.github.com/repos/brayubaud-blip/european-satfeed-premium/contents/covers?ref=main";

  const $ = (selector, root = document) => root.querySelector(selector);

  const LANGUAGE_OPTIONS = [
    { code:"fr", name:"Français", native:"Français", flag:"🇫🇷" },
    { code:"en", name:"English", native:"English", flag:"🇬🇧" },
    { code:"es", name:"Español", native:"Español", flag:"🇪🇸" },
    { code:"uk", name:"Українська", native:"Українська", flag:"🇺🇦" },
    { code:"zh", name:"中文", native:"中文", flag:"🇨🇳" },
    { code:"ar", name:"العربية", native:"العربية", flag:"🌙" }
  ];
  let language = (() => {
    try {
      const saved = localStorage.getItem("esp-language");
      if (LANGUAGE_OPTIONS.some(item => item.code === saved)) return saved;
    } catch (_) {}
    return "fr";
  })();
  document.documentElement.lang = language;
  document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  let activeFilter = "all";
  const CATALOGUE_PAGE_SIZE = 12;
  let cardsLimit = CATALOGUE_PAGE_SIZE;
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
    { id:"all", icon:"◎", fr:"TOUT", en:"ALL", es:"TODO", uk:"УСЕ", zh:"全部", ar:"الكل" },
    { id:"comps", icon:"▶", fr:"COMPS", en:"COMPS", es:"COMPS", uk:"КОМПІЛЯЦІЇ", zh:"集锦", ar:"تجميعات" },
    { id:"folders", icon:"▰", fr:"DOSSIERS", en:"FOLDERS", es:"CARPETAS", uk:"ПАПКИ", zh:"文件夹", ar:"مجلدات" },
    { id:"old", icon:"◷", fr:"ANCIEN", en:"OLD", es:"CLÁSICO", uk:"АРХІВ", zh:"经典", ar:"قديم" },
    { id:"edits", icon:"♪", fr:"EDITS", en:"EDITS", es:"EDITS", uk:"ЕДІТИ", zh:"剪辑", ar:"تعديلات" },
    { id:"collections", icon:"▦", fr:"COLLECTIONS", en:"COLLECTIONS", es:"COLECCIONES", uk:"КОЛЕКЦІЇ", zh:"收藏", ar:"مجموعات" }
  ];

  const translations = {
    fr: {
      topline:"FOOTBALL CULTURE. ARCHIVÉE.", navArchive:"Archive", navLatest:"Derniers drops",
      navIncluded:"Contenu", navPremium:"Premium", navFaq:"FAQ", join:"REJOINDRE PREMIUM ↗",
      eyebrow:"L'ARCHIVE FOOTBALL",
      heroCopy:"Une archive dédiée à la culture football : images, clips, edits et ressources soigneusement sélectionnés.",
      explore:"EXPLORER L'ARCHIVE", preview:"APERÇU GRATUIT ↗",
      heroMeta:"UNE NOUVELLE FAÇON DE COLLECTIONNER LE FOOTBALL",
      archiveEyebrow:"EXPLORER LA COLLECTION", archiveTitle:"L'ARCHIVE.",
      archiveDesc:"Un aperçu des collections disponibles. Les fichiers complets sont réservés aux membres Premium.",
      favorite:"Favoris", favorited:"Dans les favoris", addCoverAdmin:"+ AJOUTER UNE COVER",
      archiveFoot:"DE NOUVELLES COLLECTIONS SONT AJOUTÉES RÉGULIÈREMENT.",
      latestEyebrow:"NOUVEAUTÉS DE L'ARCHIVE", latestTitle:"DERNIERS<br><span>DROPS.</span>",
      latestDesc:"Les nouveautés, les sélections récentes et les prochains ajouts. Reste connecté pour ne rien manquer.",
      followTelegram:"SUIVRE LE CANAL TELEGRAM ↗", dropText:"NOUVEAU CONTENU. MÊME PASSION.",
      updating:"MIS À JOUR RÉGULIÈREMENT", includedEyebrow:"L'EXPÉRIENCE PREMIUM",
      includedTitle:"QU'Y A-T-IL<br>DANS LE PACK ?",
      includedDesc:"Tout ce qu'il faut pour nourrir ta créativité et suivre la culture football.",
      feature1Title:"DOSSIERS HAUTE QUALITÉ", feature1Desc:"Des dossiers organisés avec des images et ressources en haute qualité.",
      feature2Title:"CLIPS VIRAUX", feature2Desc:"Des clips football sélectionnés pour tes montages et tes idées.",
      feature3Title:"COMP DROPS RAPIDES", feature3Desc:"De nouvelles sélections et compilations publiées régulièrement.",
      feature4Title:"DEMANDES & PLUS", feature4Desc:"Possibilité de proposer des demandes et de découvrir d'autres contenus.",
      premiumEyebrow:"TON ACCÈS COMMENCE ICI",
      premiumDesc:"Accède au contenu complet de EUROPEAN SATFEED PREMIUM et rejoins la communauté.",
      oneTime:"/ ACCÈS", getAccess:"OBTENIR L'ACCÈS PREMIUM",
      secureNote:"Paiement via Payhip. Après l'achat, suis les instructions pour obtenir ton accès privé.",
      faqEyebrow:"BON À SAVOIR", faqDesc:"Les réponses aux questions les plus fréquentes.",
      q1:"Que comprend l'accès Premium ?",
      a1:"L'accès aux dossiers et contenus complets proposés dans le canal privé, selon les publications disponibles.",
      q2:"Comment obtenir l'accès après le paiement ?",
      a2:"Effectue ton achat via Payhip, puis suis les instructions indiquées après le paiement. En cas de problème, contacte le support Telegram.",
      q3:"Le contenu est-il gratuit ?",
      a3:"Les aperçus sont publics. Les dossiers et contenus complets sont réservés aux membres Premium.",
      q4:"Comment contacter le support ?",
      a4:"Tu peux contacter le support sur Telegram : @Njr_edit_10.",
      footerLine:"LA CULTURE FOOTBALL, COLLECTIONNÉE.",
      loading:"Chargement du catalogue…", empty:"Aucun contenu disponible dans cette catégorie.",
      error:"Impossible de charger le catalogue.", browseCategories:"CATÉGORIES",
      searchPlaceholder:"Rechercher dans l’archive...", allTeams:"Toutes les équipes",
      allSeasons:"Toutes les saisons", allCreators:"Tous les créateurs",
      noResults:"Aucun résultat pour cette recherche.", refreshCatalogue:"ACTUALISER",
      refreshing:"ACTUALISATION…", refreshDone:"Catalogue actualisé.",
      refreshError:"Impossible d'actualiser le catalogue.", prevCover:"Cover précédente",
      nextCover:"Cover suivante", closePreview:"Fermer l'aperçu", chooseLanguage:"Choisir la langue",
      languageHeading:"CHOISIR UNE LANGUE",
      heroTitle:"LE JEU.<br><span>AU-DELÀ</span> DU TERRAIN.",
      heroScroll:"FAIS DÉFILER POUR DÉCOUVRIR ↓",
      tickerArchive:"ARCHIVE FOOTBALL", tickerPremium:"CONTENU PREMIUM",
      tickerDrops:"NOUVEAUX DROPS", tickerCulture:"CULTURE FOOTBALL",
      premiumTitle:"PASSE EN<br><span>PREMIUM.</span>", faqTitle:"FAQ.",
      footerBuild:"CRÉÉ POUR LA CULTURE FOOTBALL.",
      payhipLink:"PAYHIP ↗", supportLink:"SUPPORT ↗",
      navReviews:"Avis", showMore:"AFFICHER PLUS",
      reviewsEyebrow:"AVIS DES ACHETEURS", reviewsTitle:"LA COMMUNAUTÉ<br><span class=\"yellow\">S'EXPRIME.</span>",
      reviewsDescription:"Les retours partagés par les personnes qui ont rejoint European Satfeed Premium.",
      buyersSoFar:"ACHETEURS AU TOTAL", nextDropTitle:"PROCHAIN OBJECTIF COMMUNAUTAIRE",
      unlockMessage:"À 20 acheteurs, je publierai 6 comps gratuits sur le canal teaser public.",
      joinTeaser:"SUIVRE LE TEASER PUBLIC ↗"
    },
    en: {
      topline:"FOOTBALL CULTURE. ARCHIVED.", navArchive:"Archive", navLatest:"Latest drops",
      navIncluded:"What's inside", navPremium:"Premium", navFaq:"FAQ", join:"JOIN PREMIUM ↗",
      eyebrow:"THE FOOTBALL ARCHIVE",
      heroCopy:"An archive dedicated to football culture: carefully selected images, clips, edits and resources.",
      explore:"EXPLORE THE ARCHIVE", preview:"FREE PREVIEW ↗",
      heroMeta:"A NEW WAY TO COLLECT FOOTBALL",
      archiveEyebrow:"EXPLORE THE COLLECTION", archiveTitle:"THE ARCHIVE.",
      archiveDesc:"A preview of available collections. Full files are reserved for Premium members.",
      favorite:"Favorite", favorited:"Added to favorites", addCoverAdmin:"+ ADD A COVER",
      archiveFoot:"MORE COLLECTIONS ARE ADDED REGULARLY.",
      latestEyebrow:"FRESH FROM THE ARCHIVE", latestTitle:"LATEST<br><span>DROPS.</span>",
      latestDesc:"New content, recent selections and upcoming additions. Stay connected.",
      followTelegram:"FOLLOW THE TELEGRAM CHANNEL ↗", dropText:"NEW CONTENT. SAME PASSION.",
      updating:"REGULARLY UPDATED", includedEyebrow:"THE PREMIUM EXPERIENCE",
      includedTitle:"WHAT'S<br>INSIDE?",
      includedDesc:"Everything you need to fuel your creativity and follow football culture.",
      feature1Title:"HIGH-QUALITY FOLDERS", feature1Desc:"Organized folders with high-quality images and resources.",
      feature2Title:"VIRAL CLIPS", feature2Desc:"Selected football clips for your edits and ideas.",
      feature3Title:"FAST COMP DROPS", feature3Desc:"New selections and compilations published regularly.",
      feature4Title:"REQUESTS & MORE", feature4Desc:"Suggest requests and discover more content.",
      premiumEyebrow:"YOUR ACCESS STARTS HERE",
      premiumDesc:"Access the full EUROPEAN SATFEED PREMIUM content and join the community.",
      oneTime:"/ ACCESS", getAccess:"GET PREMIUM ACCESS",
      secureNote:"Payment via Payhip. After purchase, follow the instructions to get your private access.",
      faqEyebrow:"GOOD TO KNOW", faqDesc:"Answers to frequently asked questions.",
      q1:"What is included in Premium access?",
      a1:"Access to the full folders and content shared in the private channel, depending on available posts.",
      q2:"How do I get access after payment?",
      a2:"Purchase through Payhip and follow the instructions after payment. Contact Telegram support if you need help.",
      q3:"Is the content free?",
      a3:"Previews are public. Full folders and content are reserved for Premium members.",
      q4:"How can I contact support?",
      a4:"You can contact support on Telegram: @Njr_edit_10.",
      footerLine:"FOOTBALL CULTURE, COLLECTED.",
      loading:"Loading catalogue…", empty:"No content available in this category.",
      error:"Unable to load the catalogue.", browseCategories:"CATEGORIES",
      searchPlaceholder:"Search the archive...", allTeams:"All teams",
      allSeasons:"All seasons", allCreators:"All creators", noResults:"No results for this search.",
      refreshCatalogue:"REFRESH", refreshing:"REFRESHING…", refreshDone:"Catalogue refreshed.",
      refreshError:"Could not refresh the catalogue.", prevCover:"Previous cover",
      nextCover:"Next cover", closePreview:"Close preview", chooseLanguage:"Choose language",
      languageHeading:"CHOOSE YOUR LANGUAGE",
      heroTitle:"THE GAME.<br><span>BEYOND</span> THE PITCH.",
      heroScroll:"SCROLL TO DISCOVER ↓",
      tickerArchive:"FOOTBALL ARCHIVE", tickerPremium:"PREMIUM CONTENT",
      tickerDrops:"FRESH DROPS", tickerCulture:"FOOTBALL CULTURE",
      premiumTitle:"GO<br><span>PREMIUM.</span>", faqTitle:"FAQ.",
      footerBuild:"BUILT FOR FOOTBALL CULTURE.",
      payhipLink:"PAYHIP ↗", supportLink:"SUPPORT ↗",
      navReviews:"Reviews", showMore:"SHOW MORE",
      reviewsEyebrow:"REAL BUYER FEEDBACK", reviewsTitle:"THE COMMUNITY<br><span class=\"yellow\">SPEAKS.</span>",
      reviewsDescription:"Feedback shared by people who have joined European Satfeed Premium.",
      buyersSoFar:"BUYERS SO FAR", nextDropTitle:"NEXT COMMUNITY MILESTONE",
      unlockMessage:"At 20 buyers, I'll release 6 free comps on the public teaser channel.",
      joinTeaser:"FOLLOW THE PUBLIC TEASER ↗"
    },
    es: {
      topline:"CULTURA DEL FÚTBOL. ARCHIVADA.", navArchive:"Archivo", navLatest:"Últimas novedades",
      navIncluded:"Contenido", navPremium:"Premium", navFaq:"FAQ", join:"UNIRME A PREMIUM ↗",
      eyebrow:"EL ARCHIVO DE FÚTBOL",
      heroCopy:"Un archivo dedicado a la cultura del fútbol: imágenes, clips, edits y recursos seleccionados con cuidado.",
      explore:"EXPLORAR EL ARCHIVO", preview:"VISTA PREVIA GRATIS ↗",
      heroMeta:"UNA NUEVA FORMA DE COLECCIONAR FÚTBOL",
      archiveEyebrow:"EXPLORAR LA COLECCIÓN", archiveTitle:"EL ARCHIVO.",
      archiveDesc:"Una muestra de las colecciones disponibles. Los archivos completos están reservados para miembros Premium.",
      favorite:"Favorito", favorited:"Guardado en favoritos", addCoverAdmin:"+ AÑADIR COVER",
      archiveFoot:"SE AÑADEN NUEVAS COLECCIONES CON REGULARIDAD.",
      latestEyebrow:"LO ÚLTIMO DEL ARCHIVO", latestTitle:"ÚLTIMOS<br><span>DROPS.</span>",
      latestDesc:"Nuevos contenidos, selecciones recientes y próximas incorporaciones. Sigue conectado.",
      followTelegram:"SEGUIR EL CANAL DE TELEGRAM ↗", dropText:"NUEVO CONTENIDO. LA MISMA PASIÓN.",
      updating:"ACTUALIZADO REGULARMENTE", includedEyebrow:"LA EXPERIENCIA PREMIUM",
      includedTitle:"¿QUÉ<br>INCLUYE?",
      includedDesc:"Todo lo que necesitas para impulsar tu creatividad y seguir la cultura del fútbol.",
      feature1Title:"CARPETAS DE ALTA CALIDAD", feature1Desc:"Carpetas organizadas con imágenes y recursos en alta calidad.",
      feature2Title:"CLIPS VIRALES", feature2Desc:"Clips de fútbol seleccionados para tus edits e ideas.",
      feature3Title:"NUEVOS COMPS RÁPIDOS", feature3Desc:"Nuevas selecciones y compilaciones publicadas regularmente.",
      feature4Title:"PETICIONES Y MÁS", feature4Desc:"Puedes proponer peticiones y descubrir otros contenidos.",
      premiumEyebrow:"TU ACCESO EMPIEZA AQUÍ",
      premiumDesc:"Accede al contenido completo de EUROPEAN SATFEED PREMIUM y únete a la comunidad.",
      oneTime:"/ ACCESO", getAccess:"OBTENER ACCESO PREMIUM",
      secureNote:"Pago a través de Payhip. Después de comprar, sigue las instrucciones para obtener tu acceso privado.",
      faqEyebrow:"INFORMACIÓN ÚTIL", faqDesc:"Respuestas a las preguntas más frecuentes.",
      q1:"¿Qué incluye el acceso Premium?",
      a1:"Acceso a las carpetas y al contenido completo del canal privado, según las publicaciones disponibles.",
      q2:"¿Cómo consigo el acceso después del pago?",
      a2:"Compra a través de Payhip y sigue las instrucciones posteriores al pago. Contacta con el soporte de Telegram si necesitas ayuda.",
      q3:"¿El contenido es gratuito?",
      a3:"Las vistas previas son públicas. Las carpetas y el contenido completo están reservados para miembros Premium.",
      q4:"¿Cómo puedo contactar con soporte?",
      a4:"Puedes contactar con soporte por Telegram: @Njr_edit_10.",
      footerLine:"LA CULTURA DEL FÚTBOL, COLECCIONADA.",
      loading:"Cargando catálogo…", empty:"No hay contenido disponible en esta categoría.",
      error:"No se puede cargar el catálogo.", browseCategories:"CATEGORÍAS",
      searchPlaceholder:"Buscar en el archivo...", allTeams:"Todos los equipos",
      allSeasons:"Todas las temporadas", allCreators:"Todos los creadores",
      noResults:"No hay resultados para esta búsqueda.", refreshCatalogue:"ACTUALIZAR",
      refreshing:"ACTUALIZANDO…", refreshDone:"Catálogo actualizado.",
      refreshError:"No se pudo actualizar el catálogo.", prevCover:"Cover anterior",
      nextCover:"Cover siguiente", closePreview:"Cerrar vista previa", chooseLanguage:"Elegir idioma",
      languageHeading:"ELIGE TU IDIOMA",
      heroTitle:"EL JUEGO.<br><span>MÁS ALLÁ</span> DEL CAMPO.",
      heroScroll:"DESLIZA PARA DESCUBRIR ↓",
      tickerArchive:"ARCHIVO DE FÚTBOL", tickerPremium:"CONTENIDO PREMIUM",
      tickerDrops:"NUEVAS PUBLICACIONES", tickerCulture:"CULTURA DEL FÚTBOL",
      premiumTitle:"PÁSATE A<br><span>PREMIUM.</span>", faqTitle:"PREGUNTAS FRECUENTES.",
      footerBuild:"HECHO PARA LA CULTURA DEL FÚTBOL.",
      payhipLink:"PAYHIP ↗", supportLink:"SOPORTE ↗",
      navReviews:"Opiniones", showMore:"MOSTRAR MÁS",
      reviewsEyebrow:"OPINIONES DE COMPRADORES", reviewsTitle:"LA COMUNIDAD<br><span class=\"yellow\">OPINA.</span>",
      reviewsDescription:"Opiniones compartidas por quienes se han unido a European Satfeed Premium.",
      buyersSoFar:"COMPRADORES EN TOTAL", nextDropTitle:"PRÓXIMO OBJETIVO DE LA COMUNIDAD",
      unlockMessage:"Al llegar a 20 compradores, publicaré 6 comps gratis en el canal teaser público.",
      joinTeaser:"SEGUIR EL TEASER PÚBLICO ↗"
    },
    uk: {
      topline:"ФУТБОЛЬНА КУЛЬТУРА. В АРХІВІ.", navArchive:"Архів", navLatest:"Нові надходження",
      navIncluded:"Вміст", navPremium:"Преміум", navFaq:"Питання", join:"ОТРИМАТИ PREMIUM ↗",
      eyebrow:"ФУТБОЛЬНИЙ АРХІВ",
      heroCopy:"Архів футбольної культури: ретельно відібрані зображення, кліпи, едіти та матеріали.",
      explore:"ВІДКРИТИ АРХІВ", preview:"БЕЗКОШТОВНИЙ ПЕРЕГЛЯД ↗",
      heroMeta:"НОВИЙ СПОСІБ КОЛЕКЦІОНУВАТИ ФУТБОЛ",
      archiveEyebrow:"ПЕРЕГЛЯНУТИ КОЛЕКЦІЮ", archiveTitle:"АРХІВ.",
      archiveDesc:"Огляд доступних колекцій. Повні файли доступні лише учасникам Premium.",
      favorite:"В обране", favorited:"Додано в обране", addCoverAdmin:"+ ДОДАТИ ОБКЛАДИНКУ",
      archiveFoot:"НОВІ КОЛЕКЦІЇ ДОДАЮТЬСЯ РЕГУЛЯРНО.",
      latestEyebrow:"НОВЕ В АРХІВІ", latestTitle:"ОСТАННІ<br><span>ДОДАВАННЯ.</span>",
      latestDesc:"Новий контент, свіжі добірки та майбутні оновлення. Залишайся на зв'язку.",
      followTelegram:"СТЕЖИТИ ЗА TELEGRAM-КАНАЛОМ ↗", dropText:"НОВИЙ КОНТЕНТ. ТА САМА ПРИСТРАСТЬ.",
      updating:"РЕГУЛЯРНЕ ОНОВЛЕННЯ", includedEyebrow:"PREMIUM-ДОСВІД",
      includedTitle:"ЩО<br>ВСЕРЕДИНІ?",
      includedDesc:"Усе необхідне для творчості та знайомства зі світом футбольної культури.",
      feature1Title:"ПАПКИ ВИСОКОЇ ЯКОСТІ", feature1Desc:"Упорядковані папки із зображеннями та матеріалами високої якості.",
      feature2Title:"ВІРУСНІ КЛІПИ", feature2Desc:"Відібрані футбольні кліпи для твоїх монтажів та ідей.",
      feature3Title:"ШВИДКІ COMP-ДОБІРКИ", feature3Desc:"Нові добірки та компіляції публікуються регулярно.",
      feature4Title:"ЗАПИТИ ТА ІНШЕ", feature4Desc:"Можна пропонувати запити й відкривати для себе новий контент.",
      premiumEyebrow:"ТВІЙ ДОСТУП ПОЧИНАЄТЬСЯ ТУТ",
      premiumDesc:"Отримай повний доступ до EUROPEAN SATFEED PREMIUM та приєднуйся до спільноти.",
      oneTime:"/ ДОСТУП", getAccess:"ОТРИМАТИ PREMIUM",
      secureNote:"Оплата через Payhip. Після покупки дотримуйся інструкцій, щоб отримати приватний доступ.",
      faqEyebrow:"КОРИСНО ЗНАТИ", faqDesc:"Відповіді на найпоширеніші запитання.",
      q1:"Що входить до Premium-доступу?",
      a1:"Доступ до повних папок і матеріалів у приватному каналі відповідно до доступних публікацій.",
      q2:"Як отримати доступ після оплати?",
      a2:"Здійсни покупку через Payhip і виконай інструкції після оплати. За потреби звернися до підтримки Telegram.",
      q3:"Контент безкоштовний?",
      a3:"Попередній перегляд відкритий. Повні папки та матеріали доступні лише учасникам Premium.",
      q4:"Як зв'язатися з підтримкою?",
      a4:"Напиши до підтримки в Telegram: @Njr_edit_10.",
      footerLine:"ФУТБОЛЬНА КУЛЬТУРА, ЗІБРАНА В АРХІВІ.",
      loading:"Завантаження каталогу…", empty:"У цій категорії поки немає контенту.",
      error:"Не вдалося завантажити каталог.", browseCategories:"КАТЕГОРІЇ",
      searchPlaceholder:"Пошук в архіві...", allTeams:"Усі команди",
      allSeasons:"Усі сезони", allCreators:"Усі автори",
      noResults:"За цим запитом нічого не знайдено.", refreshCatalogue:"ОНОВИТИ",
      refreshing:"ОНОВЛЕННЯ…", refreshDone:"Каталог оновлено.",
      refreshError:"Не вдалося оновити каталог.", prevCover:"Попередня обкладинка",
      nextCover:"Наступна обкладинка", closePreview:"Закрити перегляд", chooseLanguage:"Обрати мову",
      languageHeading:"ОБЕРИ МОВУ",
      heroTitle:"ГРА.<br><span>БІЛЬШЕ</span> ЗА ФУТБОЛ.",
      heroScroll:"ГОРТАЙ, ЩОБ ВІДКРИТИ ↓",
      tickerArchive:"ФУТБОЛЬНИЙ АРХІВ", tickerPremium:"PREMIUM-КОНТЕНТ",
      tickerDrops:"НОВІ ДОДАВАННЯ", tickerCulture:"ФУТБОЛЬНА КУЛЬТУРА",
      premiumTitle:"ОБИРАЙ<br><span>PREMIUM.</span>", faqTitle:"ПИТАННЯ ТА ВІДПОВІДІ.",
      footerBuild:"СТВОРЕНО ДЛЯ ФУТБОЛЬНОЇ КУЛЬТУРИ.",
      payhipLink:"PAYHIP ↗", supportLink:"ПІДТРИМКА ↗",
      navReviews:"Відгуки", showMore:"ПОКАЗАТИ БІЛЬШЕ",
      reviewsEyebrow:"ВІДГУКИ ПОКУПЦІВ", reviewsTitle:"ДУМКА<br><span class=\"yellow\">СПІЛЬНОТИ.</span>",
      reviewsDescription:"Відгуки людей, які приєдналися до European Satfeed Premium.",
      buyersSoFar:"ПОКУПЦІВ ЗАГАЛОМ", nextDropTitle:"НАСТУПНА ЦІЛЬ СПІЛЬНОТИ",
      unlockMessage:"Коли буде 20 покупців, я опублікую 6 безкоштовних компіляцій у відкритому каналі.",
      joinTeaser:"СТЕЖИТИ ЗА ВІДКРИТИМ КАНАЛОМ ↗"
    },
    zh: {
      topline:"足球文化 · 精选典藏", navArchive:"档案", navLatest:"最新更新",
      navIncluded:"内容", navPremium:"高级会员", navFaq:"常见问题", join:"加入高级会员 ↗",
      eyebrow:"足球影像档案",
      heroCopy:"专注足球文化的精选档案：图片、短片、混剪和优质素材。",
      explore:"探索档案", preview:"免费预览 ↗",
      heroMeta:"收藏足球的全新方式",
      archiveEyebrow:"探索精选", archiveTitle:"足球档案。",
      archiveDesc:"这里展示部分精选内容。完整素材仅向 Premium 会员开放。",
      favorite:"收藏", favorited:"已加入收藏", addCoverAdmin:"+ 添加封面",
      archiveFoot:"我们会定期加入新的精选内容。",
      latestEyebrow:"档案最新内容", latestTitle:"最新<br><span>发布。</span>",
      latestDesc:"查看新内容、近期精选和即将更新的素材。记得持续关注。",
      followTelegram:"关注 TELEGRAM 频道 ↗", dropText:"新内容，同样的热爱。",
      updating:"定期更新", includedEyebrow:"PREMIUM 专属体验",
      includedTitle:"包含<br>哪些内容？",
      includedDesc:"为你的创作提供灵感，持续探索足球文化。",
      feature1Title:"高清素材文件夹", feature1Desc:"分类整理的文件夹，包含高清图片和创作素材。",
      feature2Title:"热门足球短片", feature2Desc:"为你的剪辑和创意精选的足球短片。",
      feature3Title:"快速 COMP 更新", feature3Desc:"定期发布新的精选内容和混剪合集。",
      feature4Title:"定制请求及更多", feature4Desc:"你可以提出素材需求，发现更多内容。",
      premiumEyebrow:"从这里开启你的访问",
      premiumDesc:"获取 EUROPEAN SATFEED PREMIUM 完整内容，加入我们的社区。",
      oneTime:"/ 访问权限", getAccess:"获取 PREMIUM 权限",
      secureNote:"通过 Payhip 付款。购买后请按照说明获取私人访问权限。",
      faqEyebrow:"你需要了解", faqDesc:"常见问题解答。",
      q1:"Premium 权限包含什么？",
      a1:"可访问私人频道中提供的完整文件夹和内容，具体以实际发布为准。",
      q2:"付款后如何获得访问权限？",
      a2:"通过 Payhip 完成购买，并按照付款后的说明操作。如需帮助，请联系 Telegram 客服。",
      q3:"内容是免费的吗？",
      a3:"预览内容公开开放。完整文件夹和素材仅供 Premium 会员使用。",
      q4:"如何联系客服？",
      a4:"你可以通过 Telegram 联系客服：@Njr_edit_10。",
      footerLine:"收藏足球文化。",
      loading:"正在加载档案…", empty:"此分类暂时没有可用内容。",
      error:"无法加载档案。", browseCategories:"浏览分类",
      searchPlaceholder:"搜索足球档案...", allTeams:"所有球队",
      allSeasons:"所有赛季", allCreators:"所有创作者",
      noResults:"没有找到符合条件的内容。", refreshCatalogue:"刷新",
      refreshing:"正在刷新…", refreshDone:"档案已更新。",
      refreshError:"暂时无法刷新档案。", prevCover:"上一张封面",
      nextCover:"下一张封面", closePreview:"关闭预览", chooseLanguage:"选择语言",
      languageHeading:"选择你的语言",
      heroTitle:"热爱这场比赛。<br><span>不止</span> 于球场。",
      heroScroll:"向下探索 ↓",
      tickerArchive:"足球档案", tickerPremium:"高级会员内容",
      tickerDrops:"最新发布", tickerCulture:"足球文化",
      premiumTitle:"解锁<br><span>PREMIUM.</span>", faqTitle:"常见问题。",
      footerBuild:"为足球文化而打造。",
      payhipLink:"PAYHIP ↗", supportLink:"客服 ↗",
      navReviews:"买家评价", showMore:"显示更多",
      reviewsEyebrow:"真实买家反馈", reviewsTitle:"社区<br><span class=\"yellow\">怎么说。</span>",
      reviewsDescription:"来自已加入 European Satfeed Premium 用户的反馈。",
      buyersSoFar:"累计买家", nextDropTitle:"下一个社区目标",
      unlockMessage:"达到 20 位买家后，我将在公开预览频道免费发布 6 个 comps。",
      joinTeaser:"关注公开预览频道 ↗"
    },
    ar: {
      topline:"ثقافة كرة القدم. محفوظة في الأرشيف.", navArchive:"الأرشيف", navLatest:"أحدث الإضافات",
      navIncluded:"المحتوى", navPremium:"بريميوم", navFaq:"الأسئلة الشائعة", join:"انضم إلى بريميوم ↗",
      eyebrow:"أرشيف كرة القدم",
      heroCopy:"أرشيف مخصص لثقافة كرة القدم: صور ومقاطع ومونتاجات وموارد مختارة بعناية.",
      explore:"استكشف الأرشيف", preview:"معاينة مجانية ↗",
      heroMeta:"طريقة جديدة لجمع محتوى كرة القدم",
      archiveEyebrow:"استكشف المجموعة", archiveTitle:"الأرشيف.",
      archiveDesc:"نظرة على المجموعات المتاحة. الملفات الكاملة مخصصة لأعضاء بريميوم.",
      favorite:"المفضلة", favorited:"أُضيفت إلى المفضلة", addCoverAdmin:"+ إضافة غلاف",
      archiveFoot:"تُضاف مجموعات جديدة بانتظام.",
      latestEyebrow:"أحدث محتوى الأرشيف", latestTitle:"أحدث<br><span>الإضافات.</span>",
      latestDesc:"اكتشف المحتوى الجديد والاختيارات الأخيرة والإضافات القادمة. تابعنا باستمرار.",
      followTelegram:"تابع قناة تيليجرام ↗", dropText:"محتوى جديد. الشغف نفسه.",
      updating:"تحديثات منتظمة", includedEyebrow:"تجربة بريميوم",
      includedTitle:"ماذا<br>تتضمن؟",
      includedDesc:"كل ما تحتاجه لإلهام إبداعك ومتابعة ثقافة كرة القدم.",
      feature1Title:"مجلدات عالية الجودة", feature1Desc:"مجلدات منظمة تضم صوراً وموارد عالية الجودة.",
      feature2Title:"مقاطع رائجة", feature2Desc:"مقاطع كرة قدم مختارة لمونتاجاتك وأفكارك.",
      feature3Title:"إضافات COMP سريعة", feature3Desc:"اختيارات وتجميعات جديدة تُنشر بانتظام.",
      feature4Title:"طلبات والمزيد", feature4Desc:"يمكنك اقتراح طلبات واكتشاف محتوى إضافي.",
      premiumEyebrow:"ابدأ وصولك من هنا",
      premiumDesc:"احصل على محتوى EUROPEAN SATFEED PREMIUM الكامل وانضم إلى المجتمع.",
      oneTime:"/ وصول", getAccess:"احصل على وصول بريميوم",
      secureNote:"الدفع عبر Payhip. بعد الشراء، اتبع التعليمات للحصول على وصولك الخاص.",
      faqEyebrow:"معلومات مهمة", faqDesc:"إجابات عن الأسئلة الأكثر شيوعاً.",
      q1:"ماذا يشمل وصول بريميوم؟",
      a1:"الوصول إلى المجلدات والمحتوى الكامل المنشور في القناة الخاصة، وفقاً للمنشورات المتاحة.",
      q2:"كيف أحصل على الوصول بعد الدفع؟",
      a2:"اشترِ عبر Payhip واتبع التعليمات بعد الدفع. تواصل مع دعم تيليجرام عند الحاجة.",
      q3:"هل المحتوى مجاني؟",
      a3:"المعاينات متاحة للجميع. المجلدات والملفات الكاملة مخصصة لأعضاء بريميوم.",
      q4:"كيف أتواصل مع الدعم؟",
      a4:"يمكنك التواصل مع الدعم عبر تيليجرام: @Njr_edit_10.",
      footerLine:"ثقافة كرة القدم في مجموعة واحدة.",
      loading:"جارٍ تحميل الأرشيف…", empty:"لا يوجد محتوى متاح في هذه الفئة.",
      error:"تعذّر تحميل الأرشيف.", browseCategories:"تصفّح الفئات",
      searchPlaceholder:"ابحث في الأرشيف...", allTeams:"كل الفرق",
      allSeasons:"كل المواسم", allCreators:"كل المنشئين",
      noResults:"لم يتم العثور على نتائج لهذا البحث.", refreshCatalogue:"تحديث",
      refreshing:"جارٍ التحديث…", refreshDone:"تم تحديث الأرشيف.",
      refreshError:"تعذّر تحديث الأرشيف.", prevCover:"الغلاف السابق",
      nextCover:"الغلاف التالي", closePreview:"إغلاق المعاينة", chooseLanguage:"اختر اللغة",
      languageHeading:"اختر لغتك",
      heroTitle:"اللعبة.<br><span>أبعد</span> من الملعب.",
      heroScroll:"مرّر لاكتشاف المزيد ↓",
      tickerArchive:"أرشيف كرة القدم", tickerPremium:"محتوى بريميوم",
      tickerDrops:"إضافات جديدة", tickerCulture:"ثقافة كرة القدم",
      premiumTitle:"انتقل إلى<br><span>بريميوم.</span>", faqTitle:"الأسئلة الشائعة.",
      footerBuild:"صُمّم لعشاق ثقافة كرة القدم.",
      payhipLink:"PAYHIP ↗", supportLink:"الدعم ↗",
      navReviews:"آراء المشترين", showMore:"عرض المزيد",
      reviewsEyebrow:"آراء المشترين", reviewsTitle:"المجتمع<br><span class=\"yellow\">يتحدث.</span>",
      reviewsDescription:"آراء الأشخاص الذين انضموا إلى European Satfeed Premium.",
      buyersSoFar:"إجمالي المشترين", nextDropTitle:"الهدف المجتمعي القادم",
      unlockMessage:"عند الوصول إلى 20 مشتريًا، سأنشر 6 تجميعات مجانية في قناة المعاينة العامة.",
      joinTeaser:"تابع قناة المعاينة العامة ↗"
    }
  };

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;",
      '"': "&quot;", "'": "&#39;"
    })[char]);
  }

  function isVideoUrl(url) {
    return /\.(mp4|webm|mov|m4v)(?:[?#]|$)/i.test(String(url || ""));
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
    return value?.[language] || value?.en || value?.fr || "";
  }

  function t(key) {
    return translations[language]?.[key] ?? translations.fr[key] ?? key;
  }

  function updateTranslations() {
    document.querySelectorAll("[data-i18n]").forEach(element => {
      const value = t(element.dataset.i18n);
      if (value) element.innerHTML = value;
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(element => {
      element.placeholder = t(element.dataset.i18nPlaceholder);
    });
    document.querySelectorAll("[data-i18n-title]").forEach(element => {
      element.title = t(element.dataset.i18nTitle);
    });
    document.querySelectorAll("[data-i18n-aria-label]").forEach(element => {
      element.setAttribute("aria-label", t(element.dataset.i18nAriaLabel));
    });
    updateLanguagePicker();
  }

  function updateLanguagePicker() {
    const current = LANGUAGE_OPTIONS.find(option => option.code === language) || LANGUAGE_OPTIONS[0];
    const label = $("#currentLanguageLabel");
    const trigger = $("#langToggle");
    const menu = $("#languageMenu");
    if (label) label.textContent = current.code.toUpperCase();
    if (trigger) trigger.setAttribute("aria-label", t("chooseLanguage"));
    if (!menu) return;

    menu.replaceChildren();
    const heading = document.createElement("div");
    heading.className = "language-menu-heading";
    heading.textContent = t("languageHeading");
    menu.append(heading);
    LANGUAGE_OPTIONS.forEach(option => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "language-option" + (option.code === language ? " active" : "");
      button.dataset.language = option.code;
      button.setAttribute("role", "menuitemradio");
      button.setAttribute("aria-checked", String(option.code === language));
      button.innerHTML =
        '<span class="language-option-flag" aria-hidden="true">' + option.flag + '</span>' +
        '<span class="language-option-name">' + option.native + '</span>' +
        '<span class="language-option-code">' + option.code.toUpperCase() + '</span>';
      button.addEventListener("click", () => {
        setLanguage(option.code);
        closeLanguageMenu();
      });
      menu.append(button);
    });
  }

  function closeLanguageMenu() {
    const menu = $("#languageMenu");
    const trigger = $("#langToggle");
    if (menu) menu.hidden = true;
    if (trigger) trigger.setAttribute("aria-expanded", "false");
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
      { id: "favorites", icon:"★", fr: "FAVORIS", en: "FAVORITES", es:"FAVORITOS", uk:"ОБРАНЕ", zh:"收藏", ar:"المفضلة" }
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
      const filterIcon = category.icon || "◈";
      button.innerHTML = '<span class="filter-icon filter-icon-' + category.id + '" aria-hidden="true">' + filterIcon + '</span><span class="filter-label">' + category[language] + '</span><small>' + count + '</small>';
      if (category.id === activeFilter) button.classList.add('active');
      button.addEventListener('click', () => { activeFilter = category.id; cardsLimit = CATALOGUE_PAGE_SIZE; renderFilters(); renderCards(); });
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
    const url = item.image_url || item.image || "";
    const figure = lightbox.querySelector(".lightbox-figure");
    let media = figure.querySelector(".lightbox-image,.lightbox-video");

    if (isVideoUrl(url)) {
      if (media?.tagName !== "VIDEO") {
        const video = document.createElement("video");
        video.className = "lightbox-video";
        video.controls = true;
        video.playsInline = true;
        video.preload = "metadata";
        if (media) media.replaceWith(video);
        else figure.prepend(video);
        media = video;
      }
      if (media.src !== url) {
        media.src = url;
        media.load();
      }
      media.play().catch(() => {});
    } else {
      if (media?.tagName !== "IMG") {
        const image = document.createElement("img");
        image.className = "lightbox-image";
        if (media) media.replaceWith(image);
        else figure.prepend(image);
        media = image;
      }
      media.src = url;
      media.alt = localized(item.title) || "Football archive";
    }

    lightbox.querySelector(".lightbox-title").textContent = localized(item.title) || "";
    lightbox.querySelector(".lightbox-description").textContent = localized(item.description) || "";
    lightbox.querySelector(".lightbox-counter").textContent = (viewerIndex + 1) + " / " + viewerItems.length;
    lightbox.querySelector(".lightbox-prev").setAttribute("aria-label", t("prevCover"));
    lightbox.querySelector(".lightbox-next").setAttribute("aria-label", t("nextCover"));
    lightbox.querySelector(".lightbox-close").setAttribute("aria-label", t("closePreview"));
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
    const video = lightbox.querySelector(".lightbox-video");
    if (video) {
      video.pause();
      video.removeAttribute("src");
      video.load();
    }
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

    const moreWrap = $("#archiveMore");
    const moreButton = $("#catalogueShowMore");
    const remaining = $("#catalogueRemaining");
    if (!visible.length) {
      if (moreWrap) moreWrap.hidden = true;
      updateStatus(query || selectedTeam || selectedSeason || selectedCreator ? t('noResults') : t('empty'));
      return;
    }

    const shown = visible.slice(0, cardsLimit);
    if (moreWrap) moreWrap.hidden = visible.length <= shown.length;
    if (moreButton) moreButton.setAttribute("aria-label", t("showMore"));
    if (remaining) remaining.textContent = visible.length > shown.length ? "+" + (visible.length - shown.length) : "";

    shown.forEach((item, itemIndex) => {
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

      const mediaUrl = item.image_url || item.image || "";
      let media;
      if (isVideoUrl(mediaUrl)) {
        media = document.createElement("video");
        media.className = "cover-video";
        media.src = mediaUrl;
        media.muted = true;
        media.loop = true;
        media.autoplay = true;
        media.playsInline = true;
        media.preload = "metadata";
        media.setAttribute("aria-hidden", "true");
        media.addEventListener("error", () => cover.classList.add("image-error"));
      } else {
        media = document.createElement("img");
        media.src = mediaUrl;
        media.alt = localized(item.title) || "Football archive";
        media.loading = "lazy";
        media.addEventListener("error", () => {
          media.style.display = "none";
          cover.classList.add("image-error");
        });
      }

      const tag = document.createElement("span");
      tag.className = "card-tag";
      tag.textContent = normalizeCategory(item.category)
        .replace("national teams", "archive")
        .toUpperCase();

      cover.append(media, tag);
      if (isVideoUrl(mediaUrl)) {
        const videoLabel = document.createElement("span");
        videoLabel.className = "card-media-type";
        videoLabel.textContent = "VIDEO";
        cover.append(videoLabel);
      }

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
        ? `${shown.length} / ${visible.length} contenu(s) affiché(s).`
        : `${shown.length} / ${visible.length} item(s) shown.`
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
  async function loadCatalogue(forceRefresh = false) {
    if (loadingPromise && !forceRefresh) return loadingPromise;
    if (loadingPromise && forceRefresh) {
      const previousLoad = loadingPromise;
      try { await previousLoad; } catch (_) {}
      if (loadingPromise === previousLoad) loadingPromise = null;
    }

    loadingPromise = (async () => {
      if (forceRefresh) cardsLimit = CATALOGUE_PAGE_SIZE;
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
    if (!LANGUAGE_OPTIONS.some(option => option.code === nextLanguage)) return;

    language = nextLanguage;
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    try { localStorage.setItem("esp-language", language); } catch (_) {}
    updateTranslations();
    applyPublicVisualSettings();
    refreshCatalogueControls();
    renderCards();
    if (lightbox && !lightbox.hidden) renderLightboxItem();
  }

  const resetCataloguePage = () => { cardsLimit = CATALOGUE_PAGE_SIZE; renderCards(); };
  [searchInput, teamSelect, seasonSelect, creatorSelect].forEach(control => control && control.addEventListener('input', resetCataloguePage));
  [teamSelect, seasonSelect, creatorSelect].forEach(control => control && control.addEventListener('change', resetCataloguePage));
  $("#catalogueShowMore")?.addEventListener("click", () => {
    cardsLimit += CATALOGUE_PAGE_SIZE;
    renderCards();
  });

  $("#langToggle")?.addEventListener("click", event => {
    event.stopPropagation();
    const menu = $("#languageMenu");
    const trigger = $("#langToggle");
    if (!menu || !trigger) return;
    const willOpen = menu.hidden;
    menu.hidden = !willOpen;
    trigger.setAttribute("aria-expanded", String(willOpen));
  });

  document.addEventListener("click", event => {
    if (!event.target.closest(".language-picker")) closeLanguageMenu();
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeLanguageMenu();
  });

  $("#catalogueRefresh")?.addEventListener("click", async () => {
    const button = $("#catalogueRefresh");
    const label = button?.querySelector("[data-i18n]");
    if (!button || button.disabled) return;
    button.disabled = true;
    button.classList.add("is-loading");
    if (label) label.textContent = t("refreshing");
    updateStatus(t("refreshing"));
    try {
      await loadCatalogue(true);
      updateStatus(t("refreshDone"));
    } catch (error) {
      console.error("Refresh catalogue:", error);
      updateStatus(t("refreshError"));
    } finally {
      button.disabled = false;
      button.classList.remove("is-loading");
      if (label) label.textContent = t("refreshCatalogue");
    }
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
