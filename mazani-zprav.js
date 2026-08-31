// mazani-zprav.js — LCARS Messenger (Klubovna)
// Rychlé smazání VŠECH zpráv — standalone modul
// Tlačítko 🗑️ nalevo od 📅 v headeru
// Dvě potvrzení před smazáním — nevratná akce!
// Maže jen kolekci: messages
// ════════════════════════════════════════════════════════════════
const __mz_START = performance.now();

// ════════════════════════════════════════════════════════════════
//  CSS — injektuje se do <head>
// ════════════════════════════════════════════════════════════════
function injektovatCSS() {
  if (document.getElementById("mz-style")) return;
  const s = document.createElement("style");
  s.id = "mz-style";
  s.textContent = `
    /* ── TLAČÍTKO KOŠE V HEADERU ── */
    #mzBtn {
      background: rgba(0,0,0,0.35);
      border: 1px solid rgba(204,0,0,0.5);
      color: var(--lcars-red, #CC0000);
      font-size: 14px;
      width: 28px; height: 28px;
      border-radius: 4px; cursor: pointer;
      transition: background 0.15s;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 0; flex-shrink: 0;
      margin-top: 26px;
    }
    #mzBtn.visible { display: flex; }
    #mzBtn:hover   { background: rgba(204,0,0,0.2); }

    /* ── POTVRZOVACÍ MODÁL ── */
    #mzOverlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.88);
      display: none; align-items: center;
      justify-content: center; z-index: 3000;
    }
    #mzOverlay.active { display: flex; }

    .mz-box {
      background: var(--lcars-panel, #181818);
      border: 2px solid var(--lcars-red, #CC0000);
      border-radius: 10px;
      width: min(400px, 92vw);
      overflow: hidden;
    }

    .mz-header {
      background: var(--lcars-red, #CC0000);
      padding: 9px 16px;
      display: flex; align-items: center;
      justify-content: space-between;
    }
    .mz-title {
      font-family: 'Orbitron', sans-serif;
      font-size: 11px; font-weight: 700;
      letter-spacing: 3px; color: #fff;
    }

    .mz-body {
      padding: 22px 20px;
      display: flex; flex-direction: column;
      gap: 16px;
    }
    .mz-ikona {
      font-size: 40px; text-align: center;
    }
    .mz-zprava {
      font-family: 'Orbitron', sans-serif;
      font-size: 11px; letter-spacing: 2px;
      color: rgba(255,255,255,0.85);
      text-align: center; line-height: 1.7;
    }
    .mz-sub {
      font-size: 11px; color: rgba(255,255,255,0.4);
      text-align: center; line-height: 1.5;
    }
    .mz-pocet {
      font-family: 'Orbitron', sans-serif;
      font-size: 18px; font-weight: 700;
      color: var(--lcars-red, #CC0000);
      text-align: center;
    }

    .mz-btns {
      display: flex; gap: 10px;
    }
    .mz-btn-zrusit {
      flex: 1; background: transparent;
      border: 1px solid rgba(153,153,204,0.5);
      color: rgba(255,255,255,0.6);
      font-family: 'Orbitron', sans-serif;
      font-size: 10px; font-weight: 700;
      letter-spacing: 2px; padding: 11px;
      border-radius: 4px; cursor: pointer;
      transition: background 0.15s;
    }
    .mz-btn-zrusit:hover { background: rgba(255,255,255,0.05); }

    .mz-btn-smazat {
      flex: 1; background: var(--lcars-red, #CC0000);
      border: none; color: #fff;
      font-family: 'Orbitron', sans-serif;
      font-size: 10px; font-weight: 700;
      letter-spacing: 2px; padding: 11px;
      border-radius: 4px; cursor: pointer;
      transition: background 0.15s;
    }
    .mz-btn-smazat:hover { background: #ff1111; }
    .mz-btn-smazat:disabled {
      opacity: 0.5; cursor: not-allowed;
    }

    /* Progress bar při mazání */
    .mz-progress {
      display: none;
      flex-direction: column; gap: 8px;
    }
    .mz-progress.active { display: flex; }
    .mz-progress-bar-wrap {
      background: rgba(204,0,0,0.2);
      border-radius: 4px; height: 8px; overflow: hidden;
    }
    .mz-progress-bar {
      background: var(--lcars-red, #CC0000);
      height: 100%; width: 0%;
      transition: width 0.3s ease;
      border-radius: 4px;
    }
    .mz-progress-text {
      font-family: 'Orbitron', sans-serif;
      font-size: 10px; letter-spacing: 2px;
      color: rgba(255,255,255,0.5);
      text-align: center;
    }
  `;
  document.head.appendChild(s);
}

// ════════════════════════════════════════════════════════════════
//  HTML — tlačítko + modál
// ════════════════════════════════════════════════════════════════
function injektovatHTML() {
  // Modál
  if (!document.getElementById("mzOverlay")) {
    const d = document.createElement("div");
    d.innerHTML = `
      <div id="mzOverlay">
        <div class="mz-box">
          <div class="mz-header">
            <span class="mz-title" id="mzTitle">⚠️ SMAZAT ZPRÁVY</span>
          </div>
          <div class="mz-body">
            <div class="mz-ikona" id="mzIkona">🗑️</div>
            <div class="mz-zprava" id="mzZprava"></div>
            <div class="mz-pocet" id="mzPocet"></div>
            <div class="mz-sub" id="mzSub"></div>
            <div class="mz-progress" id="mzProgress">
              <div class="mz-progress-bar-wrap">
                <div class="mz-progress-bar" id="mzProgressBar"></div>
              </div>
              <div class="mz-progress-text" id="mzProgressText">Mažu zprávy...</div>
            </div>
            <div class="mz-btns" id="mzBtns">
              <button class="mz-btn-zrusit" id="mzBtnZrusit">ZRUŠIT</button>
              <button class="mz-btn-smazat" id="mzBtnSmazat">SMAZAT</button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(d.firstElementChild);
  }
}

// ════════════════════════════════════════════════════════════════
//  PŘIDAT TLAČÍTKO DO HEADERU — nalevo od 📅
// ════════════════════════════════════════════════════════════════
function pridatTlacitko() {
  if (document.getElementById("mzBtn")) return;

  const btn = document.createElement("button");
  btn.id        = "mzBtn";
  btn.title     = "Smazat všechny zprávy";
  btn.textContent = "🗑️";
  btn.addEventListener("click", spustitMazani);

  // Pokud existuje headerKpBtns (kalendář/poznámky) → vložit před něj
  const kpBtns = document.getElementById("headerKpBtns");
  if (kpBtns) {
    kpBtns.parentElement.insertBefore(btn, kpBtns);
  } else {
    // Záloha — vložit před headerUserInfo
    const headerUser = document.getElementById("headerUserInfo");
    if (headerUser) {
      headerUser.parentElement.insertBefore(btn, headerUser);
    }
  }
}

// ════════════════════════════════════════════════════════════════
//  STAV MODÁLU
// ════════════════════════════════════════════════════════════════
let krok = 0; // 0 = zavřeno, 1 = první potvrzení, 2 = druhé potvrzení
let pocetZprav = 0;

function otevritModal() {
  document.getElementById("mzOverlay")?.classList.add("active");
}

function zavritModal() {
  document.getElementById("mzOverlay")?.classList.remove("active");
  krok = 0;
}

// ════════════════════════════════════════════════════════════════
//  FLOW — dvě potvrzení
// ════════════════════════════════════════════════════════════════
async function spustitMazani() {
  // Načíst počet zpráv
  pocetZprav = await zjistiPocetZprav();
  krok = 1;
  zobrazitKrok1();
  otevritModal();
}

function zobrazitKrok1() {
  document.getElementById("mzTitle").textContent   = "⚠️ SMAZAT VŠECHNY ZPRÁVY";
  document.getElementById("mzIkona").textContent   = "🗑️";
  document.getElementById("mzZprava").textContent  = "OPRAVDU SMAZAT VŠECHNY ZPRÁVY?";
  document.getElementById("mzPocet").textContent   = pocetZprav > 0 ? `${pocetZprav} zpráv` : "";
  document.getElementById("mzSub").textContent     = "Tato akce smaže celou historii chatu Klubovny.";
  document.getElementById("mzBtnZrusit").textContent = "ZRUŠIT";
  document.getElementById("mzBtnSmazat").textContent = "ANO, SMAZAT";
  document.getElementById("mzBtnSmazat").disabled  = false;
  document.getElementById("mzProgress").classList.remove("active");
  document.getElementById("mzBtns").style.display  = "flex";
}

function zobrazitKrok2() {
  document.getElementById("mzTitle").textContent   = "🚨 POSLEDNÍ VAROVÁNÍ";
  document.getElementById("mzIkona").textContent   = "⚠️";
  document.getElementById("mzZprava").textContent  = "TATO AKCE JE NEVRATNÁ!\nVŠECHNY ZPRÁVY BUDOU NAVŽDY SMAZÁNY.";
  document.getElementById("mzPocet").textContent   = "";
  document.getElementById("mzSub").textContent     = "Galerie, poznámky a kalendář zůstanou nedotčeny.";
  document.getElementById("mzBtnZrusit").textContent = "NE, PONECHAT";
  document.getElementById("mzBtnSmazat").textContent = "SMAZAT NAVŽDY";
}

// ════════════════════════════════════════════════════════════════
//  EVENT LISTENERY
// ════════════════════════════════════════════════════════════════
function registrovatListenery() {
  document.getElementById("mzBtnZrusit")?.addEventListener("click", zavritModal);

  document.getElementById("mzBtnSmazat")?.addEventListener("click", async () => {
    if (krok === 1) {
      krok = 2;
      zobrazitKrok2();
    } else if (krok === 2) {
      await provestMazani();
    }
  });

  document.getElementById("mzOverlay")?.addEventListener("click", (e) => {
    if (e.target.id === "mzOverlay" && krok < 3) zavritModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && krok < 3) zavritModal();
  });
}

// ════════════════════════════════════════════════════════════════
//  ZJISTIT POČET ZPRÁV
// ════════════════════════════════════════════════════════════════
async function zjistiPocetZprav() {
  try {
    const { getApps } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
    const { getFirestore, collection, getDocs } = await import(
      "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
    const snap = await getDocs(collection(getFirestore(getApps()[0]), "messages"));
    return snap.size;
  } catch (e) {
    return 0;
  }
}

// ════════════════════════════════════════════════════════════════
//  SMAZAT VŠECHNY ZPRÁVY — v dávkách po 500 (Firestore limit)
// ════════════════════════════════════════════════════════════════
async function provestMazani() {
  krok = 3;

  // Schovat tlačítka, zobrazit progress
  document.getElementById("mzBtns").style.display = "none";
  document.getElementById("mzProgress").classList.add("active");
  document.getElementById("mzTitle").textContent  = "🗑️ MAŽU ZPRÁVY...";
  document.getElementById("mzIkona").textContent  = "⏳";
  document.getElementById("mzZprava").textContent = "PROBÍHÁ MAZÁNÍ";
  document.getElementById("mzSub").textContent    = "Prosím čekej...";

  try {
    const { getApps }    = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
    const { getFirestore, collection, getDocs, writeBatch } = await import(
      "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");

    const db   = getFirestore(getApps()[0]);
    const col  = collection(db, "messages");
    let smazano = 0;

    // Mazat v dávkách dokud nezůstane nic
    while (true) {
      const snap = await getDocs(col);
      if (snap.empty) break;

      const davka = writeBatch(db);
      snap.docs.slice(0, 500).forEach(d => davka.delete(d.ref));
      await davka.commit();

      smazano += Math.min(500, snap.size);

      // Progress bar
      const procent = pocetZprav > 0
        ? Math.min(100, Math.round(smazano / pocetZprav * 100))
        : 100;
      document.getElementById("mzProgressBar").style.width = `${procent}%`;
      document.getElementById("mzProgressText").textContent =
        `Smazáno ${smazano}${pocetZprav > 0 ? ` / ${pocetZprav}` : ""} zpráv...`;
    }

    // Hotovo!
    document.getElementById("mzTitle").textContent   = "✅ HOTOVO";
    document.getElementById("mzIkona").textContent   = "✅";
    document.getElementById("mzZprava").textContent  = "VŠECHNY ZPRÁVY SMAZÁNY";
    document.getElementById("mzSub").textContent     = "Chat Klubovny je čistý.";
    document.getElementById("mzProgressBar").style.width = "100%";
    document.getElementById("mzProgressText").textContent = `Smazáno ${smazano} zpráv`;

    // Zavřít po 2 sekundách
    setTimeout(() => zavritModal(), 2000);

  } catch (e) {
    document.getElementById("mzTitle").textContent  = "❌ CHYBA";
    document.getElementById("mzIkona").textContent  = "❌";
    document.getElementById("mzZprava").textContent = e.message;
    document.getElementById("mzBtns").style.display = "flex";
    document.getElementById("mzBtnZrusit").textContent = "ZAVŘÍT";
    document.getElementById("mzBtnSmazat").style.display = "none";
    krok = 0;
  }
}

// ════════════════════════════════════════════════════════════════
//  SLEDOVAT FIREBASE AUTH — zobrazit tlačítko po přihlášení
// ════════════════════════════════════════════════════════════════
async function sledovatAuth() {
  const cekej = ms => new Promise(r => setTimeout(r, ms));

  for (let i = 0; i < 25; i++) {
    try {
      const { getApps } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
      if (getApps().length > 0) break;
    } catch {}
    await cekej(300);
  }

  const { getAuth, onAuthStateChanged } = await import(
    "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js");
  const { getApps } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");

  onAuthStateChanged(getAuth(getApps()[0]), user => {
    const btn = document.getElementById("mzBtn");
    if (user) {
      pridatTlacitko();
      document.getElementById("mzBtn")?.classList.add("visible");
    } else {
      if (btn) btn.classList.remove("visible");
    }
  });
}

// ════════════════════════════════════════════════════════════════
//  AUTO-START
// ════════════════════════════════════════════════════════════════
function autoStart() {
  injektovatCSS();
  injektovatHTML();
  registrovatListenery();
  sledovatAuth();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", autoStart);
} else {
  autoStart();
}

// ⏱️ LOG END
console.log(`%c🚀 [mazani-zprav] Načteno za ${(performance.now() - __mz_START).toFixed(2)} ms`, 'background: #000; color: #00ff00; font-weight: bold; padding: 2px;');
