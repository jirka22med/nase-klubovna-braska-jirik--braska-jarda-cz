// kalendar-poznamky.js — LCARS Messenger (Klubovna)
// Sdílený kalendář + poznámky — 100% standalone 3-v-1 modul
// Injektuje vlastní CSS + HTML, sleduje Firebase auth sám
// Obousměrné: oba uživatelé vidí a editují vše v reálném čase!
// ════════════════════════════════════════════════════════════════
const __kp_START = performance.now();

// ════════════════════════════════════════════════════════════════
//  STAV MODULU
// ════════════════════════════════════════════════════════════════
let aktUser        = null;
let aktRok         = new Date().getFullYear();
let aktMesic       = new Date().getMonth(); // 0-11
let unsubKal       = null;
let unsubPoz       = null;
let vsechnyUdalosti = [];
let vsechnyPoznamky = [];

// ════════════════════════════════════════════════════════════════
//  CSS — injektuje se do <head>
// ════════════════════════════════════════════════════════════════
function injektovatCSS() {
  if (document.getElementById("kp-style")) return;
  const s = document.createElement("style");
  s.id = "kp-style";
  s.textContent = `

    /* ── TLAČÍTKA V HEADERU ── */
    .header-quick-btns {
      display: flex; gap: 5px; margin-top: 3px;
    }
    .hdr-quick-btn {
      background: rgba(0,0,0,0.35);
      border: 1px solid rgba(255,153,0,0.5);
      color: var(--lcars-primary, #FF9900);
      font-size: 14px; padding: 3px 8px;
      border-radius: 4px; cursor: pointer;
      transition: background 0.15s;
      line-height: 1;
    }
    .hdr-quick-btn:hover { background: rgba(255,153,0,0.2); }

    /* ── SDÍLENÉ MODÁL STYLY ── */
    .kp-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.88);
      display: none; align-items: center; justify-content: center; z-index: 1500;
    }
    .kp-overlay.active { display: flex; }

    .kp-box {
      background: var(--lcars-panel, #181818);
      border: 2px solid var(--lcars-primary, #FF9900);
      border-radius: 10px;
      width: min(600px, 96vw);
      max-height: 90vh;
      display: flex; flex-direction: column; overflow: hidden;
    }

    .kp-header {
      background: var(--lcars-primary, #FF9900);
      padding: 9px 16px;
      display: flex; align-items: center; justify-content: space-between;
      flex-shrink: 0;
    }
    .kp-title {
      font-family: 'Orbitron', sans-serif; font-size: 12px;
      font-weight: 700; letter-spacing: 3px; color: #000;
    }
    .kp-close {
      background: none; border: none; color: #000;
      font-size: 15px; font-weight: 700; cursor: pointer; padding: 0 4px;
    }
    .kp-close:hover { opacity: 0.6; }

    .kp-body {
      flex: 1; overflow-y: auto; padding: 16px;
      scrollbar-width: thin;
      scrollbar-color: var(--lcars-primary, #FF9900) transparent;
    }

    /* ── KALENDÁŘ ── */
    .kal-nav {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 14px;
    }
    .kal-nav-btn {
      background: var(--lcars-dark, #0a0a0a);
      border: 1px solid var(--lcars-primary, #FF9900);
      color: var(--lcars-primary, #FF9900);
      font-family: 'Orbitron', sans-serif; font-size: 16px;
      width: 36px; height: 36px; border-radius: 50%;
      cursor: pointer; transition: background 0.15s;
    }
    .kal-nav-btn:hover { background: rgba(255,153,0,0.15); }
    .kal-mesic-rok {
      font-family: 'Orbitron', sans-serif; font-size: 13px;
      font-weight: 700; letter-spacing: 3px;
      color: var(--lcars-text, #FFCC00);
    }

    /* Mřížka kalendáře */
    .kal-grid {
      display: grid; grid-template-columns: repeat(7, 1fr);
      gap: 2px; margin-bottom: 14px;
    }
    .kal-den-nazev {
      font-family: 'Orbitron', sans-serif; font-size: 8px;
      letter-spacing: 1px; color: var(--lcars-secondary, #99CCFF);
      text-align: center; padding: 4px 0; font-weight: 700;
    }
    .kal-den {
      min-height: 46px; background: var(--lcars-dark, #0a0a0a);
      border: 1px solid rgba(153,153,204,0.2);
      border-radius: 4px; padding: 3px; cursor: pointer;
      transition: border-color 0.15s;
      display: flex; flex-direction: column; gap: 1px;
    }
    .kal-den:hover { border-color: var(--lcars-primary, #FF9900); }
    .kal-den.prazdny { opacity: 0; pointer-events: none; }
    .kal-den.dnes { border-color: var(--lcars-secondary, #99CCFF) !important; }
    .kal-den.ma-udalosti { border-color: rgba(255,153,0,0.5); }

    .kal-den-cislo {
      font-family: 'Orbitron', sans-serif; font-size: 10px;
      color: rgba(255,255,255,0.6); text-align: right; line-height: 1;
    }
    .kal-den.dnes .kal-den-cislo { color: var(--lcars-secondary, #99CCFF); }

    .kal-udalost-dot {
      height: 4px; border-radius: 2px;
      background: var(--lcars-primary, #FF9900);
    }
    .kal-udalost-dot.jiny { background: var(--lcars-secondary, #99CCFF); }

    /* Přidat událost formulář */
    .kal-pridat {
      background: var(--lcars-dark, #0a0a0a);
      border: 1px solid rgba(153,153,204,0.3);
      border-radius: 8px; padding: 14px;
      margin-bottom: 14px;
    }
    .kal-pridat-title {
      font-family: 'Orbitron', sans-serif; font-size: 10px;
      letter-spacing: 3px; color: var(--lcars-secondary, #99CCFF);
      margin-bottom: 10px;
    }
    .kal-form-row {
      display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 8px;
    }
    .kal-input {
      flex: 1; min-width: 120px;
      background: var(--lcars-panel, #181818);
      border: 1px solid rgba(255,153,0,0.4);
      color: var(--lcars-text, #FFCC00);
      padding: 7px 10px; font-size: 13px;
      border-radius: 4px; outline: none;
      font-family: 'Exo 2', sans-serif;
    }
    .kal-input:focus { border-color: var(--lcars-secondary, #99CCFF); }
    .kal-input::placeholder { color: rgba(255,153,0,0.3); }
    .kal-input[type="date"] { color: var(--lcars-text, #FFCC00); }

    .kal-btn-pridat {
      background: var(--lcars-primary, #FF9900); border: none; color: #000;
      font-family: 'Orbitron', sans-serif; font-size: 10px; font-weight: 700;
      letter-spacing: 2px; padding: 8px 16px; border-radius: 4px; cursor: pointer;
      width: 100%; transition: background 0.15s;
    }
    .kal-btn-pridat:hover { background: var(--lcars-text, #FFCC00); }

    /* Seznam událostí */
    .kal-udalosti-list { display: flex; flex-direction: column; gap: 8px; }
    .kal-udalost-item {
      background: var(--lcars-dark, #0a0a0a);
      border: 1px solid rgba(153,153,204,0.3);
      border-left: 4px solid var(--lcars-primary, #FF9900);
      border-radius: 4px; padding: 10px 12px;
      display: flex; align-items: flex-start; justify-content: space-between; gap: 10px;
    }
    .kal-udalost-item.cizi { border-left-color: var(--lcars-secondary, #99CCFF); }

    .kal-ud-datum {
      font-family: 'Orbitron', sans-serif; font-size: 9px;
      letter-spacing: 2px; color: var(--lcars-primary, #FF9900);
      margin-bottom: 3px;
    }
    .kal-ud-nazev { font-size: 13px; color: rgba(255,255,255,0.9); font-weight: 600; }
    .kal-ud-popis { font-size: 11px; color: rgba(255,255,255,0.45); margin-top: 2px; }
    .kal-ud-autor {
      font-family: 'Orbitron', sans-serif; font-size: 8px;
      letter-spacing: 1px; color: rgba(255,255,255,0.3); margin-top: 4px;
    }
    .kal-ud-smazat {
      background: none; border: none;
      color: var(--lcars-red, #CC0000); font-size: 13px;
      cursor: pointer; padding: 2px 5px; flex-shrink: 0;
      opacity: 0.6; transition: opacity 0.15s;
    }
    .kal-ud-smazat:hover { opacity: 1; }
    .kal-prazdno {
      font-family: 'Orbitron', sans-serif; font-size: 10px;
      letter-spacing: 3px; color: rgba(153,153,204,0.4);
      text-align: center; padding: 20px;
    }

    /* ── POZNÁMKY ── */
    .poz-pridat {
      display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap;
    }
    .poz-input {
      flex: 1; min-width: 180px;
      background: var(--lcars-dark, #0a0a0a);
      border: 1px solid rgba(255,153,0,0.4);
      color: var(--lcars-text, #FFCC00);
      padding: 9px 12px; font-size: 13px;
      border-radius: 4px; outline: none;
      font-family: 'Exo 2', sans-serif;
    }
    .poz-input:focus { border-color: var(--lcars-secondary, #99CCFF); }
    .poz-input::placeholder { color: rgba(255,153,0,0.3); }
    .poz-btn-pridat {
      background: var(--lcars-primary, #FF9900); border: none; color: #000;
      font-family: 'Orbitron', sans-serif; font-size: 10px; font-weight: 700;
      letter-spacing: 2px; padding: 9px 16px; border-radius: 4px; cursor: pointer;
      transition: background 0.15s; white-space: nowrap;
    }
    .poz-btn-pridat:hover { background: var(--lcars-text, #FFCC00); }

    .poz-list { display: flex; flex-direction: column; gap: 8px; }
    .poz-item {
      background: var(--lcars-dark, #0a0a0a);
      border: 1px solid rgba(153,153,204,0.3);
      border-left: 4px solid var(--lcars-primary, #FF9900);
      border-radius: 4px; padding: 10px 12px;
    }
    .poz-item.cizi { border-left-color: var(--lcars-secondary, #99CCFF); }

    .poz-item-header {
      display: flex; align-items: flex-start;
      justify-content: space-between; gap: 8px; margin-bottom: 5px;
    }
    .poz-autor {
      font-family: 'Orbitron', sans-serif; font-size: 9px;
      letter-spacing: 1px;
      color: var(--lcars-primary, #FF9900);
    }
    .poz-item.cizi .poz-autor { color: var(--lcars-secondary, #99CCFF); }
    .poz-cas {
      font-family: 'Orbitron', sans-serif; font-size: 8px;
      color: rgba(255,255,255,0.3); white-space: nowrap;
    }
    .poz-text {
      font-size: 13px; color: rgba(255,255,255,0.85);
      line-height: 1.55; word-break: break-word; white-space: pre-wrap;
    }
    .poz-text-edit {
      width: 100%; background: var(--lcars-panel, #181818);
      border: 1px solid var(--lcars-secondary, #99CCFF);
      color: var(--lcars-text, #FFCC00); padding: 6px 9px;
      font-size: 13px; border-radius: 4px; outline: none;
      font-family: 'Exo 2', sans-serif; resize: vertical;
      min-height: 60px; margin-bottom: 6px; display: none;
    }
    .poz-akce {
      display: flex; gap: 5px; margin-top: 7px; flex-wrap: wrap;
    }
    .poz-btn {
      background: none; border: 1px solid;
      font-family: 'Orbitron', sans-serif; font-size: 8px;
      letter-spacing: 1px; padding: 4px 9px; border-radius: 3px;
      cursor: pointer; transition: background 0.15s, color 0.15s;
    }
    .poz-btn-edit  { border-color: rgba(153,204,255,0.5); color: var(--lcars-secondary, #99CCFF); }
    .poz-btn-edit:hover  { background: var(--lcars-secondary, #99CCFF); color: #000; }
    .poz-btn-uloz  { border-color: var(--lcars-primary, #FF9900); color: var(--lcars-primary, #FF9900); display: none; }
    .poz-btn-uloz:hover  { background: var(--lcars-primary, #FF9900); color: #000; }
    .poz-btn-smazat { border-color: rgba(204,0,0,0.5); color: var(--lcars-red, #CC0000); }
    .poz-btn-smazat:hover { background: var(--lcars-red, #CC0000); color: #fff; }
    .poz-prazdno {
      font-family: 'Orbitron', sans-serif; font-size: 10px;
      letter-spacing: 3px; color: rgba(153,153,204,0.4);
      text-align: center; padding: 30px;
    }

    /* ── RESPONSIVE ── */
    @media (max-width: 650px) {
      .kp-box { max-height: 95vh; }
      .kp-title { font-size: 9px; letter-spacing: 2px; }
      .kal-den { min-height: 36px; }
      .kal-den-cislo { font-size: 9px; }
      .hdr-quick-btn { font-size: 12px; padding: 2px 6px; }
    }
  `;
  document.head.appendChild(s);
}

// ════════════════════════════════════════════════════════════════
//  HTML — injektuje oba modály
// ════════════════════════════════════════════════════════════════
function injektovatHTML() {
  // Modál kalendáře
  if (!document.getElementById("kalendarOverlay")) {
    const d = document.createElement("div");
    d.innerHTML = `
      <div id="kalendarOverlay" class="kp-overlay">
        <div class="kp-box">
          <div class="kp-header">
            <span class="kp-title">📅 SDÍLENÝ KALENDÁŘ</span>
            <button class="kp-close" id="kalClose">✕</button>
          </div>
          <div class="kp-body">
            <div class="kal-nav">
              <button class="kal-nav-btn" id="kalPrev">‹</button>
              <span class="kal-mesic-rok" id="kalMesicRok"></span>
              <button class="kal-nav-btn" id="kalNext">›</button>
            </div>
            <div class="kal-grid" id="kalGrid"></div>
            <div class="kal-pridat">
              <div class="kal-pridat-title">➕ PŘIDAT UDÁLOST</div>
              <div class="kal-form-row">
                <input type="date" class="kal-input" id="kalDatum">
                <input type="text" class="kal-input" id="kalNazev"
                       placeholder="Název události...">
              </div>
              <div class="kal-form-row">
                <input type="text" class="kal-input" id="kalPopis"
                       placeholder="Popis (volitelný)...">
              </div>
              <button class="kal-btn-pridat" id="kalBtnPridat">
                ULOŽIT UDÁLOST DO SDÍLENÉHO KALENDÁŘE
              </button>
            </div>
            <div class="kal-udalosti-list" id="kalUdalosList"></div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(d.firstElementChild);
  }

  // Modál poznámek
  if (!document.getElementById("poznamkyOverlay")) {
    const d = document.createElement("div");
    d.innerHTML = `
      <div id="poznamkyOverlay" class="kp-overlay">
        <div class="kp-box">
          <div class="kp-header">
            <span class="kp-title">📝 SDÍLENÉ POZNÁMKY</span>
            <button class="kp-close" id="pozClose">✕</button>
          </div>
          <div class="kp-body">
            <div class="poz-pridat">
              <input type="text" class="poz-input" id="pozInput"
                     placeholder="Napsat novou poznámku...">
              <button class="poz-btn-pridat" id="pozBtnPridat">PŘIDAT</button>
            </div>
            <div class="poz-list" id="pozList"></div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(d.firstElementChild);
  }
}

// ════════════════════════════════════════════════════════════════
//  TLAČÍTKA DO HEADERU
// ════════════════════════════════════════════════════════════════
function pridatHeaderButtony() {
  if (document.getElementById("headerKpBtns")) return;
  const headerSub = document.querySelector(".header-sub");
  if (!headerSub) return;

  const wrap = document.createElement("div");
  wrap.id = "headerKpBtns";
  wrap.className = "header-quick-btns";
  wrap.innerHTML = `
    <button class="hdr-quick-btn" title="Sdílený kalendář"
            onclick="window.__otevritKalendar()">📅</button>
    <button class="hdr-quick-btn" title="Sdílené poznámky"
            onclick="window.__otevritPoznamky()">📝</button>
  `;
  headerSub.insertAdjacentElement("afterend", wrap);
}

// ════════════════════════════════════════════════════════════════
//  OTEVŘÍT / ZAVŘÍT
// ════════════════════════════════════════════════════════════════
function otevritKalendar() {
  document.getElementById("kalendarOverlay")?.classList.add("active");
  document.body.style.overflow = "hidden";
  // Okamžitě vykreslit co máme — onSnapshot doplní aktualizace
  vykresliKalendar();
  vykresliUdalosti();
}

function zavritKalendar() {
  document.getElementById("kalendarOverlay")?.classList.remove("active");
  document.body.style.overflow = "";
}

function otevritPoznamky() {
  document.getElementById("poznamkyOverlay")?.classList.add("active");
  document.body.style.overflow = "hidden";
  // Okamžitě vykreslit co máme — onSnapshot doplní aktualizace
  vykresliPoznamky();
}

function zavritPoznamky() {
  document.getElementById("poznamkyOverlay")?.classList.remove("active");
  document.body.style.overflow = "";
}

// ════════════════════════════════════════════════════════════════
//  FIRESTORE — KALENDÁŘ
// ════════════════════════════════════════════════════════════════
async function pridatUdalost() {
  if (!aktUser) return;
  const datum = document.getElementById("kalDatum")?.value;
  const nazev = document.getElementById("kalNazev")?.value.trim();
  const popis = document.getElementById("kalPopis")?.value.trim();
  if (!datum || !nazev) { alert("Zadej datum a název!"); return; }

  try {
    const { getApps }    = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
    const { getFirestore, collection, addDoc, serverTimestamp } = await import(
      "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
    await addDoc(collection(getFirestore(getApps()[0]), "kalendar"), {
      datum, nazev, popis: popis || "",
      pridalId: aktUser.uid, pridalJmeno: aktUser.displayName,
      timestamp: serverTimestamp()
    });
    document.getElementById("kalNazev").value = "";
    document.getElementById("kalPopis").value = "";
    document.getElementById("kalDatum").value = "";
  } catch (e) { alert("Chyba: " + e.message); }
}

async function smazatUdalost(id) {
  try {
    const { getApps }    = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
    const { getFirestore, doc, deleteDoc } = await import(
      "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
    await deleteDoc(doc(getFirestore(getApps()[0]), "kalendar", id));
  } catch (e) { console.warn("Smazání události chyba:", e.message); }
}

function sledovatKalendar() {
  return (async () => {
    const { getApps }    = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
    const { getFirestore, collection, onSnapshot } = await import(
      "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
    // BEZ orderBy — žádný index Firestore nepotřebuje, řadíme client-side
    unsubKal = onSnapshot(
      collection(getFirestore(getApps()[0]), "kalendar"),
      snap => {
        vsechnyUdalosti = [];
        snap.forEach(d => vsechnyUdalosti.push({ id: d.id, ...d.data() }));
        // Seřadit dle data client-side
        vsechnyUdalosti.sort((a,b) => (a.datum||"").localeCompare(b.datum||""));
        if (document.getElementById("kalendarOverlay")?.classList.contains("active")) {
          vykresliKalendar();
          vykresliUdalosti();
        }
      },
      err => console.warn("📅 [kalendar] onSnapshot chyba:", err.message)
    );
  })();
}

// ════════════════════════════════════════════════════════════════
//  FIRESTORE — POZNÁMKY
// ════════════════════════════════════════════════════════════════
async function pridatPoznamku() {
  if (!aktUser) return;
  const text = document.getElementById("pozInput")?.value.trim();
  if (!text) return;
  try {
    const { getApps }    = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
    const { getFirestore, collection, addDoc, serverTimestamp } = await import(
      "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
    await addDoc(collection(getFirestore(getApps()[0]), "poznamky"), {
      text, pridalId: aktUser.uid, pridalJmeno: aktUser.displayName,
      timestamp: serverTimestamp(), upraveno: null
    });
    document.getElementById("pozInput").value = "";
  } catch (e) { alert("Chyba: " + e.message); }
}

async function smazatPoznamku(id) {
  try {
    const { getApps }    = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
    const { getFirestore, doc, deleteDoc } = await import(
      "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
    await deleteDoc(doc(getFirestore(getApps()[0]), "poznamky", id));
  } catch (e) { console.warn("Smazání poznámky chyba:", e.message); }
}

async function editovatPoznamku(id, novyText) {
  try {
    const { getApps }    = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
    const { getFirestore, doc, updateDoc, serverTimestamp } = await import(
      "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
    await updateDoc(doc(getFirestore(getApps()[0]), "poznamky", id), {
      text: novyText, upraveno: serverTimestamp()
    });
  } catch (e) { console.warn("Editace poznámky chyba:", e.message); }
}

function sledovatPoznamky() {
  return (async () => {
    const { getApps }    = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
    const { getFirestore, collection, onSnapshot } = await import(
      "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
    // BEZ orderBy — žádný index Firestore nepotřebuje, řadíme client-side
    unsubPoz = onSnapshot(
      collection(getFirestore(getApps()[0]), "poznamky"),
      snap => {
        vsechnyPoznamky = [];
        snap.forEach(d => vsechnyPoznamky.push({ id: d.id, ...d.data() }));
        // Seřadit dle timestamp client-side (nejnovější nahoře)
        vsechnyPoznamky.sort((a,b) => {
          const ta = a.timestamp?.toMillis?.() ?? 0;
          const tb = b.timestamp?.toMillis?.() ?? 0;
          return tb - ta;
        });
        if (document.getElementById("poznamkyOverlay")?.classList.contains("active")) {
          vykresliPoznamky();
        }
      },
      err => console.warn("📝 [poznamky] onSnapshot chyba:", err.message)
    );
  })();
}

// ════════════════════════════════════════════════════════════════
//  VYKRESLENÍ KALENDÁŘE
// ════════════════════════════════════════════════════════════════
const MESICE = ["Leden","Únor","Březen","Duben","Máj","Červen",
                "Červenec","Srpen","Září","Říjen","Listopad","Prosinec"];
const DNY    = ["Po","Út","St","Čt","Pá","So","Ne"];

function vykresliKalendar() {
  const grid = document.getElementById("kalGrid");
  const label = document.getElementById("kalMesicRok");
  if (!grid || !label) return;

  label.textContent = `${MESICE[aktMesic]} ${aktRok}`;

  const dnes    = new Date();
  const prvniDen = new Date(aktRok, aktMesic, 1);
  const posledniDen = new Date(aktRok, aktMesic + 1, 0);
  // Pondělí = 0
  let zacatek = prvniDen.getDay() - 1;
  if (zacatek < 0) zacatek = 6;

  // Udalosti v tomto měsíci
  const prefixDatumu = `${aktRok}-${String(aktMesic+1).padStart(2,"0")}`;
  const udalostitento = vsechnyUdalosti.filter(u => u.datum?.startsWith(prefixDatumu));

  let html = DNY.map(d =>
    `<div class="kal-den-nazev">${d}</div>`
  ).join("");

  // Prázdné buňky před prvním dnem
  for (let i = 0; i < zacatek; i++) {
    html += `<div class="kal-den prazdny"></div>`;
  }

  for (let den = 1; den <= posledniDen.getDate(); den++) {
    const datumStr  = `${aktRok}-${String(aktMesic+1).padStart(2,"0")}-${String(den).padStart(2,"0")}`;
    const jeToday   = den === dnes.getDate() && aktMesic === dnes.getMonth() && aktRok === dnes.getFullYear();
    const udalosti  = udalostitento.filter(u => u.datum === datumStr);
    const maDots    = udalosti.length > 0;

    html += `
      <div class="kal-den ${jeToday ? "dnes" : ""} ${maDots ? "ma-udalosti" : ""}"
           onclick="window.__kalVybratDen('${datumStr}')">
        <div class="kal-den-cislo">${den}</div>
        ${udalosti.slice(0,3).map(u =>
          `<div class="kal-udalost-dot ${u.pridalId !== aktUser?.uid ? "jiny" : ""}"></div>`
        ).join("")}
      </div>`;
  }

  grid.innerHTML = html;

  // Předvyplnit dnešní datum
  const datumInput = document.getElementById("kalDatum");
  if (datumInput && !datumInput.value) {
    datumInput.value = dnes.toISOString().split("T")[0];
  }
}

function vykresliUdalosti() {
  const list = document.getElementById("kalUdalosList");
  if (!list) return;

  // Zobrazit události v tomto měsíci, seřazené dle data
  const prefixDatumu = `${aktRok}-${String(aktMesic+1).padStart(2,"0")}`;
  const udalosti = vsechnyUdalosti
    .filter(u => u.datum?.startsWith(prefixDatumu))
    .sort((a, b) => a.datum?.localeCompare(b.datum));

  if (!udalosti.length) {
    list.innerHTML = `<div class="kal-prazdno">ŽÁDNÉ UDÁLOSTI V TOMTO MĚSÍCI</div>`;
    return;
  }

  list.innerHTML = udalosti.map(u => {
    const jeMoje = u.pridalId === aktUser?.uid;
    const datum  = u.datum ? new Date(u.datum + "T00:00:00").toLocaleDateString("cs-CZ",
      { weekday:"short", day:"numeric", month:"long" }) : "";
    return `
      <div class="kal-udalost-item ${jeMoje ? "" : "cizi"}">
        <div style="flex:1">
          <div class="kal-ud-datum">${datum}</div>
          <div class="kal-ud-nazev">${escHtml(u.nazev)}</div>
          ${u.popis ? `<div class="kal-ud-popis">${escHtml(u.popis)}</div>` : ""}
          <div class="kal-ud-autor">— ${escHtml(u.pridalJmeno)}</div>
        </div>
        ${jeMoje ? `
          <button class="kal-ud-smazat" onclick="window.__smazatUdalost('${u.id}')"
                  title="Smazat">✕</button>` : ""}
      </div>`;
  }).join("");
}

// ════════════════════════════════════════════════════════════════
//  VYKRESLENÍ POZNÁMEK
// ════════════════════════════════════════════════════════════════
function vykresliPoznamky() {
  const list = document.getElementById("pozList");
  if (!list) return;

  if (!vsechnyPoznamky.length) {
    list.innerHTML = `<div class="poz-prazdno">ŽÁDNÉ SDÍLENÉ POZNÁMKY</div>`;
    return;
  }

  list.innerHTML = vsechnyPoznamky.map(p => {
    const jeMoje = p.pridalId === aktUser?.uid;
    const cas    = p.timestamp?.toDate
      ? p.timestamp.toDate().toLocaleTimeString("cs-CZ", { hour:"2-digit", minute:"2-digit" })
      : "";
    const datum  = p.timestamp?.toDate
      ? p.timestamp.toDate().toLocaleDateString("cs-CZ", { day:"numeric", month:"numeric" })
      : "";
    return `
      <div class="poz-item ${jeMoje ? "" : "cizi"}" id="poz-${p.id}">
        <div class="poz-item-header">
          <span class="poz-autor">${escHtml(p.pridalJmeno)}</span>
          <span class="poz-cas">${datum} ${cas}${p.upraveno ? " ✏️" : ""}</span>
        </div>
        <div class="poz-text" id="poz-text-${p.id}">${escHtml(p.text)}</div>
        <textarea class="poz-text-edit" id="poz-edit-${p.id}">${escHtml(p.text)}</textarea>
        <div class="poz-akce">
          ${jeMoje ? `
            <button class="poz-btn poz-btn-edit" onclick="window.__toggleEditPoz('${p.id}')">✏️ UPRAVIT</button>
            <button class="poz-btn poz-btn-uloz" id="poz-uloz-${p.id}"
                    onclick="window.__ulozEditPoz('${p.id}')">💾 ULOŽIT</button>
            <button class="poz-btn poz-btn-smazat" onclick="window.__smazatPoz('${p.id}')">🗑 SMAZAT</button>
          ` : ""}
        </div>
      </div>`;
  }).join("");
}

// ════════════════════════════════════════════════════════════════
//  EVENT LISTENERY
// ════════════════════════════════════════════════════════════════
function registrovatListenery() {
  // Zavřít
  document.getElementById("kalClose")?.addEventListener("click", zavritKalendar);
  document.getElementById("pozClose")?.addEventListener("click", zavritPoznamky);
  document.getElementById("kalendarOverlay")?.addEventListener("click", e => {
    if (e.target.id === "kalendarOverlay") zavritKalendar();
  });
  document.getElementById("poznamkyOverlay")?.addEventListener("click", e => {
    if (e.target.id === "poznamkyOverlay") zavritPoznamky();
  });

  // Escape
  document.addEventListener("keydown", e => {
    if (e.key !== "Escape") return;
    if (document.getElementById("kalendarOverlay")?.classList.contains("active")) zavritKalendar();
    if (document.getElementById("poznamkyOverlay")?.classList.contains("active")) zavritPoznamky();
  });

  // Navigace měsíců
  document.getElementById("kalPrev")?.addEventListener("click", () => {
    aktMesic--;
    if (aktMesic < 0) { aktMesic = 11; aktRok--; }
    vykresliKalendar(); vykresliUdalosti();
  });
  document.getElementById("kalNext")?.addEventListener("click", () => {
    aktMesic++;
    if (aktMesic > 11) { aktMesic = 0; aktRok++; }
    vykresliKalendar(); vykresliUdalosti();
  });

  // Přidat událost
  document.getElementById("kalBtnPridat")?.addEventListener("click", pridatUdalost);

  // Přidat poznámku
  document.getElementById("pozBtnPridat")?.addEventListener("click", pridatPoznamku);
  document.getElementById("pozInput")?.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); pridatPoznamku(); }
  });
}

// ════════════════════════════════════════════════════════════════
//  GLOBÁLNÍ FUNKCE
// ════════════════════════════════════════════════════════════════
function registrovatGlobalniFunkce() {
  window.__otevritKalendar   = otevritKalendar;
  window.__otevritPoznamky   = otevritPoznamky;
  window.__kalVybratDen      = (datum) => {
    const input = document.getElementById("kalDatum");
    if (input) { input.value = datum; input.scrollIntoView({ behavior:"smooth" }); }
  };
  window.__smazatUdalost     = (id) => {
    if (confirm("Smazat tuto událost?")) smazatUdalost(id);
  };
  window.__smazatPoz         = (id) => {
    if (confirm("Smazat tuto poznámku?")) smazatPoznamku(id);
  };
  window.__toggleEditPoz     = (id) => {
    const textEl  = document.getElementById(`poz-text-${id}`);
    const editEl  = document.getElementById(`poz-edit-${id}`);
    const ulozBtn = document.getElementById(`poz-uloz-${id}`);
    if (!textEl || !editEl) return;
    const editMode = editEl.style.display !== "block";
    textEl.style.display  = editMode ? "none"  : "block";
    editEl.style.display  = editMode ? "block" : "none";
    if (ulozBtn) ulozBtn.style.display = editMode ? "inline-block" : "none";
    if (editMode) editEl.focus();
  };
  window.__ulozEditPoz = async (id) => {
    const editEl = document.getElementById(`poz-edit-${id}`);
    if (!editEl) return;
    const novyText = editEl.value.trim();
    if (!novyText) return;
    await editovatPoznamku(id, novyText);
    window.__toggleEditPoz(id);
  };
}

// ════════════════════════════════════════════════════════════════
//  SLEDOVAT FIREBASE AUTH — auto-init
// ════════════════════════════════════════════════════════════════
async function sledovatAuth() {
  const cekej = ms => new Promise(r => setTimeout(r, ms));

  // Počkat na Firebase
  let moduly;
  for (let i = 0; i < 25; i++) {
    try {
      const { getApps } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
      if (getApps().length > 0) { moduly = { getApps }; break; }
    } catch {}
    await cekej(300);
  }
  if (!moduly) return console.warn("[kp] Firebase nenačten");

  const { getAuth, onAuthStateChanged } = await import(
    "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js");
  const { getApps } = moduly;

  onAuthStateChanged(getAuth(getApps()[0]), async user => {
    if (user) {
      aktUser = user;
      pridatHeaderButtony();
      await sledovatKalendar();
      await sledovatPoznamky();
    } else {
      aktUser = null;
      if (unsubKal) { unsubKal(); unsubKal = null; }
      if (unsubPoz) { unsubPoz(); unsubPoz = null; }
    }
  });
}

// ════════════════════════════════════════════════════════════════
//  HELPER
// ════════════════════════════════════════════════════════════════
function escHtml(t) {
  if (!t) return "";
  const d = document.createElement("div");
  d.textContent = t;
  return d.innerHTML;
}

// ════════════════════════════════════════════════════════════════
//  AUTO-START
// ════════════════════════════════════════════════════════════════
function autoStart() {
  injektovatCSS();
  injektovatHTML();
  registrovatListenery();
  registrovatGlobalniFunkce();
  sledovatAuth();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", autoStart);
} else {
  autoStart();
}

// ⏱️ LOG END
console.log(`%c🚀 [kalendar-poznamky] Načteno za ${(performance.now() - __kp_START).toFixed(2)} ms`, 'background: #000; color: #00ff00; font-weight: bold; padding: 2px;');
