const translations = {
  fr: {
    topline:"CULTURE FOOTBALL. ARCHIVÉE.",navArchive:"Archive",navLatest:"Nouveautés",navIncluded:"Contenu",navPremium:"Premium",navFaq:"FAQ",join:"REJOINDRE ↗",
    eyebrow:"L'ARCHIVE FOOTBALL",heroCopy:"Une archive dédiée à la culture football : images, clips, edits et ressources soigneusement sélectionnés.",explore:"EXPLORER L'ARCHIVE",preview:"APERÇU GRATUIT ↗",heroMeta:"UNE NOUVELLE FAÇON DE COLLECTIONNER LE FOOTBALL",
    archiveEyebrow:"EXPLORE LES COLLECTIONS",archiveTitle:"L'ARCHIVE",archiveDesc:"Un aperçu des collections disponibles. Les fichiers complets sont réservés aux membres Premium.",all:"TOUT",archiveFoot:"DE NOUVELLES COLLECTIONS SONT AJOUTÉES RÉGULIÈREMENT.",
    latestEyebrow:"FRAÎCHEMENT AJOUTÉ",latestTitle:"DERNIERS<br><span>DROPS.</span>",latestDesc:"Les nouveautés, les sélections récentes et les prochains ajouts. Reste connecté pour ne rien manquer.",followTelegram:"SUIVRE LE CANAL TELEGRAM ↗",dropText:"NOUVEAU CONTENU. MÊME PASSION.",updating:"MIS À JOUR RÉGULIÈREMENT",
    includedEyebrow:"L'EXPÉRIENCE PREMIUM",includedTitle:"CE QUI<br>EST INCLUS",includedDesc:"Tout ce qu'il faut pour nourrir ta créativité et suivre la culture football.",
    feature1Title:"DOSSIERS HAUTE QUALITÉ",feature1Desc:"Des dossiers organisés avec des images et ressources en haute qualité.",feature2Title:"CLIPS VIRAUX",feature2Desc:"Des clips football sélectionnés pour tes montages et tes idées.",feature3Title:"NOUVEAUX DROPS",feature3Desc:"De nouvelles sélections et compilations publiées régulièrement.",feature4Title:"DEMANDES & PLUS",feature4Desc:"Possibilité de proposer des demandes et de découvrir d'autres contenus.",
    premiumEyebrow:"TON ACCÈS COMMENCE ICI",premiumDesc:"Accède au contenu complet de EUROPEAN SATFEED PREMIUM et rejoins la communauté.",oneTime:"/ ACCÈS",getAccess:"OBTENIR L'ACCÈS PREMIUM",secureNote:"Paiement via Payhip. Après l'achat, suis les instructions pour obtenir ton accès privé.",
    faqEyebrow:"BON À SAVOIR",faqDesc:"Les réponses aux questions les plus fréquentes.",q1:"Que comprend l'accès Premium ? ＋",a1:"L'accès aux dossiers et contenus complets proposés dans le canal privé, selon les publications disponibles.",q2:"Comment obtenir l'accès après le paiement ? ＋",a2:"Effectue ton achat via Payhip, puis suis les instructions indiquées après le paiement. En cas de problème, contacte le support Telegram.",q3:"Le contenu est-il gratuit ? ＋",a3:"Les aperçus sont publics. Les dossiers et contenus complets sont réservés aux membres Premium.",q4:"Comment contacter le support ? ＋",a4:"Tu peux contacter le support sur Telegram : @Njr_edit_10.",footerLine:"LA CULTURE FOOTBALL, COLLECTIONNÉE."
  },
  en: {
    topline:"FOOTBALL CULTURE. ARCHIVED.",navArchive:"Archive",navLatest:"Latest drops",navIncluded:"What's inside",navPremium:"Premium",navFaq:"FAQ",join:"JOIN PREMIUM ↗",
    eyebrow:"THE FOOTBALL ARCHIVE",heroCopy:"An archive dedicated to football culture: carefully selected images, clips, edits and resources.",explore:"EXPLORE THE ARCHIVE",preview:"FREE PREVIEW ↗",heroMeta:"A NEW WAY TO COLLECT FOOTBALL",
    archiveEyebrow:"EXPLORE THE COLLECTION",archiveTitle:"THE ARCHIVE",archiveDesc:"A preview of available collections. Full files are reserved for Premium members.",all:"ALL",archiveFoot:"MORE COLLECTIONS ARE ADDED REGULARLY.",
    latestEyebrow:"FRESH FROM THE ARCHIVE",latestTitle:"LATEST<br><span>DROPS.</span>",latestDesc:"New releases, recent selections and upcoming additions. Stay connected and never miss a drop.",followTelegram:"FOLLOW THE TELEGRAM CHANNEL ↗",dropText:"NEW CONTENT. SAME PASSION.",updating:"REGULARLY UPDATED",
    includedEyebrow:"THE PREMIUM EXPERIENCE",includedTitle:"WHAT'S<br>INSIDE",includedDesc:"Everything you need to fuel your creativity and follow football culture.",
    feature1Title:"HIGH-QUALITY FOLDERS",feature1Desc:"Organized folders with high-quality images and resources.",feature2Title:"VIRAL CLIPS",feature2Desc:"Selected football clips for your edits and creative ideas.",feature3Title:"FAST COMP DROPS",feature3Desc:"New selections and compilations published regularly.",feature4Title:"REQUESTS & MORE",feature4Desc:"Suggest requests and discover even more content.",
    premiumEyebrow:"YOUR ACCESS STARTS HERE",premiumDesc:"Get access to the full EUROPEAN SATFEED PREMIUM content and join the community.",oneTime:"/ ACCESS",getAccess:"GET PREMIUM ACCESS",secureNote:"Payment via Payhip. After purchase, follow the instructions to receive your private access.",
    faqEyebrow:"GOOD TO KNOW",faqDesc:"Answers to the most frequently asked questions.",q1:"What does Premium access include? ＋",a1:"Access to the full folders and content shared in the private channel, according to available releases.",q2:"How do I get access after payment? ＋",a2:"Purchase through Payhip, then follow the instructions shown after payment. If you need help, contact Telegram support.",q3:"Is the content free? ＋",a3:"Previews are public. Full folders and content are reserved for Premium members.",q4:"How can I contact support? ＋",a4:"You can contact support on Telegram: @Njr_edit_10.",footerLine:"FOOTBALL CULTURE, COLLECTED."
  }
};
let language = "fr";
const grid = document.getElementById("archiveGrid");
function renderCards(filter="all"){
  const items = catalogue.filter(item => filter === "all" || item.category === filter);
  grid.innerHTML = items.map(item => `
    <article class="archive-card">
      <div class="cover">${item.image ? `<img src="${item.image}" alt="${item.title}" loading="lazy">` : `<span class="cover-placeholder">ES+</span>`}
        <span class="card-tag">${item.label || "ARCHIVE"}</span>
      </div>
      <div class="card-info"><div class="card-meta"><span>${item.type || "COLLECTION"}</span><span>${item.season || ""}</span></div>
        <h3>${item.title}</h3><p>${item.description || ""}</p>
      </div>
    </article>`).join("");
}
function setLanguage(lang){
  language = lang;
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.dataset.i18n;
    if(translations[lang][key]) el.innerHTML = translations[lang][key];
  });
  document.getElementById("langToggle").innerHTML = lang === "fr" ? "FR <span>/</span> EN" : "EN <span>/</span> FR";
}
document.getElementById("langToggle").addEventListener("click",()=>setLanguage(language==="fr"?"en":"fr"));
document.querySelectorAll(".filter").forEach(btn=>btn.addEventListener("click",()=>{
  document.querySelectorAll(".filter").forEach(b=>b.classList.remove("active"));
  btn.classList.add("active");renderCards(btn.dataset.filter);
}));
document.getElementById("menuToggle").addEventListener("click",()=>document.getElementById("nav").classList.toggle("open"));
document.querySelectorAll("#nav a").forEach(a=>a.addEventListener("click",()=>document.getElementById("nav").classList.remove("open")));
renderCards();
