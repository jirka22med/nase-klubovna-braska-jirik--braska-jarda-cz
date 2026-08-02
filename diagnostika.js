// diagnostika.js — LCARS Messenger (Klubovna)
// Diagnostický panel — 100% standalone modul
// Injektuje vlastní HTML + CSS + testovací tlačítka pro notifikace
// Stačí: import { inicializovatDiagnostiku } from './diagnostika.js'
// ════════════════════════════════════════════════════════════════
const __diagnostika_START = performance.now();

// ════════════════════════════════════════════════════════════════
//  CSS — injektuje se do <head> automaticky
// ════════════════════════════════════════════════════════════════
function injektovatCSS() {
  if (document.getElementById("diagnostika-style")) return;
  const s = document.createElement("style");
  s.id = "diagnostika-style";
  s.textContent = `
    #diagnostikaOverlay {
      position:fixed; inset:0; background:rgba(0,0,0,0.92);
      display:none; align-items:center; justify-content:center; z-index:2000;
    }
    #diagnostikaOverlay.active { display:flex; }
    .diagnostika-box {
      background:var(--lcars-panel); border:2px solid var(--lcars-secondary);
      border-radius:var(--radius-md); width:min(680px,96vw);
      max-height:88vh; display:flex; flex-direction:column; overflow:hidden;
    }
    .diagnostika-header {
      display:flex; align-items:center; justify-content:space-between;
      padding:10px 16px; background:var(--lcars-secondary); flex-shrink:0;
    }
    .diagnostika-title {
      font-family:'Orbitron',sans-serif; font-size:12px; font-weight:700;
      letter-spacing:4px; color:#000;
    }
    .diagnostika-close {
      background:none; border:none; color:#000; font-family:'Orbitron',sans-serif;
      font-size:11px; font-weight:700; cursor:pointer; padding:2px 8px;
    }
    .diagnostika-close:hover { opacity:0.6; }
    .diagnostika-panel {
      flex:1; overflow-y:auto; padding:16px;
      scrollbar-width:thin; scrollbar-color:var(--lcars-secondary) var(--lcars-dark);
    }
    .diag-loading {
      font-family:'Orbitron',sans-serif; font-size:12px; letter-spacing:3px;
      color:var(--lcars-secondary); text-align:center; padding:40px;
      animation:diag-blink 1s ease-in-out infinite;
    }
    @keyframes diag-blink { 0%,100%{opacity:0.4} 50%{opacity:1} }
    .diag-summary {
      display:flex; align-items:center; gap:12px; padding:12px 16px;
      border-radius:var(--radius-md); margin-bottom:14px; border:1px solid;
    }
    .diag-summary-ok      { background:rgba(0,204,102,0.1); border-color:var(--lcars-green); }
    .diag-summary-problem { background:rgba(204,0,0,0.1);   border-color:var(--lcars-red);   }
    .diag-summary-icon  { font-size:20px; }
    .diag-summary-text  {
      flex:1; font-family:'Orbitron',sans-serif; font-size:11px;
      letter-spacing:2px; color:rgba(255,255,255,0.85);
    }
    .diag-refresh-btn {
      background:var(--lcars-secondary); border:none; color:#000;
      font-family:'Orbitron',sans-serif; font-size:10px; font-weight:700;
      letter-spacing:1px; padding:6px 12px; border-radius:var(--radius-sm);
      cursor:pointer; white-space:nowrap; transition:background 0.15s;
    }
    .diag-refresh-btn:hover { background:#c0dfff; }
    .diag-testy { display:flex; flex-direction:column; gap:8px; }
    .diag-test {
      background:var(--lcars-dark); border:1px solid rgba(153,153,204,0.3);
      border-radius:var(--radius-sm); padding:12px 14px; border-left:4px solid;
    }
    .diag-test-ok       { border-left-color:var(--lcars-green); }
    .diag-test-varovani { border-left-color:var(--lcars-text);  }
    .diag-test-chyba    { border-left-color:var(--lcars-red);   }
    .diag-test-header { display:flex; align-items:center; gap:8px; margin-bottom:5px; }
    .diag-test-ikona  { font-size:14px; }
    .diag-test-nazev  {
      font-family:'Orbitron',sans-serif; font-size:11px; font-weight:700;
      letter-spacing:2px; color:var(--lcars-secondary);
    }
    .diag-test-zprava {
      font-size:12px; color:rgba(255,255,255,0.7);
      padding-left:22px; line-height:1.5; word-break:break-all;
    }
    .diag-test-detail {
      font-size:11px; color:var(--lcars-text);
      padding-left:22px; margin-top:4px; opacity:0.7;
    }
    .diag-akce-btn {
      margin-top:8px; margin-left:22px; background:var(--lcars-primary);
      border:none; color:#000; font-family:'Orbitron',sans-serif;
      font-size:10px; font-weight:700; letter-spacing:1px;
      padding:6px 14px; border-radius:var(--radius-sm); cursor:pointer;
    }
    .diag-footer {
      font-family:'Orbitron',sans-serif; font-size:9px; letter-spacing:3px;
      color:rgba(255,255,255,0.25); text-align:center; padding:12px;
      border-top:1px solid rgba(153,204,255,0.15); margin-top:14px;
    }
    /* TEST NOTIFIKACÍ */
    .diag-notif-sekce {
      margin-top:16px; padding:14px 16px;
      background:rgba(153,204,255,0.05);
      border:1px solid rgba(153,204,255,0.25);
      border-radius:var(--radius-md);
    }
    .diag-notif-title {
      font-family:'Orbitron',sans-serif; font-size:11px; font-weight:700;
      letter-spacing:3px; color:var(--lcars-secondary); margin-bottom:6px;
    }
    .diag-notif-hint {
      font-size:11px; color:rgba(255,255,255,0.4);
      margin-bottom:12px; line-height:1.5;
    }
    .diag-notif-btns { display:flex; gap:10px; flex-wrap:wrap; margin-bottom:12px; }
    .diag-notif-btn {
      flex:1; min-width:160px; background:var(--lcars-dark);
      border:2px solid var(--lcars-primary); color:var(--lcars-primary);
      font-family:'Orbitron',sans-serif; font-size:12px; font-weight:700;
      letter-spacing:2px; cursor:pointer; padding:12px 14px;
      border-radius:var(--radius-sm); display:flex; flex-direction:column;
      align-items:center; gap:4px; transition:background 0.15s, color 0.15s;
    }
    .diag-notif-btn:hover { background:var(--lcars-primary); color:#000; }
    .diag-notif-btn-jarde { border-color:var(--lcars-secondary); color:var(--lcars-secondary); }
    .diag-notif-btn-jarde:hover { background:var(--lcars-secondary); color:#000; }
    .diag-notif-btn-sub { font-size:9px; font-weight:400; letter-spacing:1px; opacity:0.7; }
    .diag-notif-log {
      font-family:'Orbitron',sans-serif; font-size:10px; letter-spacing:2px;
      color:rgba(255,255,255,0.4); padding:8px 10px;
      background:var(--lcars-dark); border-radius:var(--radius-sm);
      min-height:34px; transition:color 0.3s;
    }
    .diag-notif-log.ok    { color:var(--lcars-green); }
    .diag-notif-log.chyba { color:var(--lcars-red);   }
    @media (max-width:650px) {
      .diagnostika-box   { max-height:94vh; }
      .diagnostika-title { font-size:9px; letter-spacing:2px; }
      .diag-test-zprava  { font-size:11px; }
      .diag-summary-text { font-size:9px; }
      .diag-notif-btn    { min-width:120px; font-size:10px; }
    }
  `;
  document.head.appendChild(s);
}

// ════════════════════════════════════════════════════════════════
//  HTML — injektuje se do <body> automaticky
// ════════════════════════════════════════════════════════════════
function injektovatHTML() {
  if (document.getElementById("diagnostikaOverlay")) return;
  const div = document.createElement("div");
  div.innerHTML = `
    <div id="diagnostikaOverlay">
      <div class="diagnostika-box">
        <div class="diagnostika-header">
          <span class="diagnostika-title">⚙️ SYSTÉMOVÁ DIAGNOSTIKA — KLUBOVNA</span>
          <button class="diagnostika-close" id="diagnostikaClose">✕ ZAVŘÍT</button>
        </div>
        <div class="diagnostika-panel" id="diagnostikaPanel"></div>
      </div>
    </div>
  `;
  document.body.appendChild(div.firstElementChild);
}

// ════════════════════════════════════════════════════════════════
//  OTEVŘÍT / ZAVŘÍT
// ════════════════════════════════════════════════════════════════
export function otevritDiagnostiku() {
  document.getElementById("diagnostikaOverlay")?.classList.add("active");
  document.body.style.overflow = "hidden";
  spustitDiagnostiku();
}

export function zavritDiagnostiku() {
  document.getElementById("diagnostikaOverlay")?.classList.remove("active");
  document.body.style.overflow = "";
}

// ════════════════════════════════════════════════════════════════
//  SPUSTIT VŠECHNY TESTY
// ════════════════════════════════════════════════════════════════
async function spustitDiagnostiku() {
  const panel = document.getElementById("diagnostikaPanel");
  if (!panel) return;
  panel.innerHTML = `<div class="diag-loading">⏳ Spouštím diagnostiku...</div>`;

  const vysledky = await Promise.all([
    testProhlizec(),
    testFirebaseApp(),
    testFirestoreCten(),
    testFirestoreZapis(),
    testServiceWorker(),
    testNotifikace(),
    testFcmToken(),
    testModuly(),
    testOnline(),
    testPerformance()
  ]);

  vykresliVysledky(panel, vysledky);
}

// ════════════════════════════════════════════════════════════════
//  JEDNOTLIVÉ TESTY
// ════════════════════════════════════════════════════════════════
async function testProhlizec() {
  const ua    = navigator.userAgent;
  const nazev = navigator.brave ? "Brave"
    : ua.includes("Edg/")   ? "Edge"
    : ua.includes("Chrome") ? "Chrome"
    : ua.includes("Firefox")? "Firefox" : "Neznámý";
  return {
    nazev:  "🌐 Prohlížeč",
    status: navigator.onLine ? "ok" : "chyba",
    zprava: `${nazev} — internet: ${navigator.onLine ? "připojen" : "OFFLINE"}`,
    detail: navigator.brave ? "⚠️ Brave blokuje FCM push — viz brave://settings/privacy" : null
  };
}

async function testFirebaseApp() {
  try {
    const { getApps } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
    const apps = getApps();
    if (!apps.length) throw new Error("Firebase app není inicializován");
    return { nazev:"🔥 Firebase App", status:"ok", zprava:`Projekt: ${apps[0].options.projectId}` };
  } catch (e) {
    return { nazev:"🔥 Firebase App", status:"chyba", zprava:e.message };
  }
}

async function testFirestoreCten() {
  try {
    const { getApps } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
    const { getFirestore, collection, getDocs, query, limit } = await import(
      "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
    const zac = performance.now();
    await getDocs(query(collection(getFirestore(getApps()[0]), "users"), limit(1)));
    return { nazev:"📖 Firestore čtení", status:"ok", zprava:`Odezva: ${(performance.now()-zac).toFixed(0)}ms` };
  } catch (e) {
    return { nazev:"📖 Firestore čtení", status:"chyba", zprava:e.message };
  }
}

async function testFirestoreZapis() {
  try {
    const { getApps } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
    const { getFirestore, doc, setDoc, deleteDoc, serverTimestamp } = await import(
      "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
    const db  = getFirestore(getApps()[0]);
    const ref = doc(db, "_diagnostika_test", "ping");
    const zac = performance.now();
    await setDoc(ref, { ping: serverTimestamp() });
    await deleteDoc(ref);
    return { nazev:"✏️ Firestore zápis", status:"ok", zprava:`Odezva: ${(performance.now()-zac).toFixed(0)}ms` };
  } catch (e) {
    return {
      nazev:"✏️ Firestore zápis",
      status: e.message.includes("permission") ? "varovani" : "chyba",
      zprava: e.message.includes("permission") ? "Zablokováno Firestore rules" : e.message
    };
  }
}

async function testServiceWorker() {
  if (!("serviceWorker" in navigator))
    return { nazev:"⚙️ Service Worker", status:"varovani", zprava:"Nepodporováno" };
  const regs = await navigator.serviceWorker.getRegistrations();
  if (!regs.length)
    return { nazev:"⚙️ Service Worker", status:"varovani", zprava:"Žádný SW není zaregistrován" };
  return {
    nazev:"⚙️ Service Worker",
    status: regs[0].active ? "ok" : "varovani",
    zprava: regs[0].active ? `Aktivní — scope: ${regs[0].scope}` : "Registrován ale nespuštěn"
  };
}

async function testNotifikace() {
  if (!("Notification" in window))
    return { nazev:"🔔 Notifikace", status:"chyba", zprava:"Prohlížeč nepodporuje" };
  const s = Notification.permission;
  return {
    nazev:"🔔 Notifikace",
    status: s==="granted" ? "ok" : s==="denied" ? "chyba" : "varovani",
    zprava: s==="granted" ? "Povoleny ✅"
          : s==="denied"  ? "Zamítnuty — povol v nastavení prohlížeče"
          : "Zatím nepožádáno",
    akce: s==="default" ? {
      label:"Povolit notifikace",
      fn: () => Notification.requestPermission().then(() => spustitDiagnostiku())
    } : null
  };
}

async function testFcmToken() {
  try {
    const { getApps } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
    const { getAuth } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js");
    const { getFirestore, doc, getDoc } = await import(
      "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
    const app  = getApps()[0];
    const user = getAuth(app).currentUser;
    if (!user) return { nazev:"📱 FCM Token", status:"varovani", zprava:"Nepřihlášen" };
    const snap  = await getDoc(doc(getFirestore(app), "users", user.uid));
    const token = snap.data()?.fcmToken;
    return {
      nazev:"📱 FCM Token",
      status: token ? "ok" : "varovani",
      zprava: token ? `Uložen ✅ — ${token.substring(0,24)}...` : "Token chybí v Firestore"
    };
  } catch (e) {
    return { nazev:"📱 FCM Token", status:"chyba", zprava:e.message };
  }
}

async function testModuly() {
  const ok = [
    window.__otevritModal   ? "chat ✅"           : "chat ❌",
    window.__otevritSlider  ? "gallery-slider ✅" : "gallery-slider ❌",
    window.__prepnoutReakci ? "presence ✅"       : "presence ❌",
    window.__ulozitNick     ? "nicknames ✅"      : "nicknames ❌",
  ];
  const chybi = ok.filter(m => m.includes("❌")).length;
  return {
    nazev:"📦 Moduly",
    status: chybi===0 ? "ok" : chybi<=2 ? "varovani" : "chyba",
    zprava: ok.join("  |  ")
  };
}

async function testOnline() {
  try {
    const { getApps } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
    const { getFirestore, collection, getDocs, query, where } = await import(
      "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
    const snap = await getDocs(
      query(collection(getFirestore(getApps()[0]), "users"), where("isOnline","==",true))
    );
    const jmena = [];
    snap.forEach(d => jmena.push(d.data().displayName || d.id));
    return { nazev:"👥 Online status", status:"ok", zprava:`Online (${jmena.length}): ${jmena.join(", ")||"nikdo"}` };
  } catch (e) {
    return { nazev:"👥 Online status", status:"chyba", zprava:e.message };
  }
}

async function testPerformance() {
  const nav  = performance.getEntriesByType("navigation")[0];
  const load = nav ? `${(nav.loadEventEnd-nav.startTime).toFixed(0)}ms` : "?";
  const heap = performance.memory
    ? `${(performance.memory.usedJSHeapSize/1048576).toFixed(1)} MB` : "N/A";
  return { nazev:"⚡ Performance", status:"ok", zprava:`Načtení: ${load} | JS heap: ${heap}` };
}

// ════════════════════════════════════════════════════════════════
//  VYKRESLENÍ VÝSLEDKŮ
// ════════════════════════════════════════════════════════════════
function vykresliVysledky(panel, vysledky) {
  const ikony = { ok:"✅", varovani:"⚠️", chyba:"❌" };
  const ok    = vysledky.filter(v => v.status==="ok").length;
  const chyby = vysledky.filter(v => v.status==="chyba").length;

  panel.innerHTML = `
    <div class="diag-summary diag-summary-${chyby===0?"ok":"problem"}">
      <span class="diag-summary-icon">${chyby===0?"🟢":"🔴"}</span>
      <span class="diag-summary-text">
        ${ok}/${vysledky.length} testů OK
        ${chyby>0 ? `— ${chyby} ${chyby===1?"chyba":"chyby"}` : "— vše zelené!"}
      </span>
      <button class="diag-refresh-btn" onclick="window.__diagnostikaRefresh()">🔄 OPAKOVAT</button>
    </div>

    <div class="diag-testy">
      ${vysledky.map(v => `
        <div class="diag-test diag-test-${v.status}">
          <div class="diag-test-header">
            <span class="diag-test-ikona">${ikony[v.status]}</span>
            <span class="diag-test-nazev">${v.nazev}</span>
          </div>
          <div class="diag-test-zprava">${v.zprava}</div>
          ${v.detail ? `<div class="diag-test-detail">${v.detail}</div>` : ""}
          ${v.akce   ? `<button class="diag-akce-btn"
            onclick="(${v.akce.fn.toString()})()">${v.akce.label}</button>` : ""}
        </div>`).join("")}
    </div>

    <div class="diag-footer">Diagnostika: ${new Date().toLocaleTimeString("cs-CZ")}</div>

    <div class="diag-notif-sekce">
      <div class="diag-notif-title">🔔 TEST NOTIFIKACÍ — OBOUSMĚRNÝ</div>
      <p class="diag-notif-hint">
        Oba musíte mít Klubovnu otevřenou. Tlačítko "→ MNĚ" funguje vždy.
        Tlačítko "→ DRUHÉMU" zapíše do Firestore — druhý dostane notifikaci přes onSnapshot.
      </p>
      <div class="diag-notif-btns">
        <button class="diag-notif-btn"
                onclick="window.__testNotifikaceMne()">
          📨 TEST → MNĚ
          <span class="diag-notif-btn-sub">Okamžitá notifikace v tomto prohlížeči</span>
        </button>
        <button class="diag-notif-btn diag-notif-btn-jarde"
                onclick="window.__testNotifikaceJarde()">
          📨 TEST → DRUHÉMU
          <span class="diag-notif-btn-sub">Zapíše do Firestore — druhý uvidí notifikaci</span>
        </button>
      </div>
      <div class="diag-notif-log" id="diagNotifLog">— výsledek testu se zobrazí zde —</div>
    </div>
  `;
}

// ════════════════════════════════════════════════════════════════
//  HELPER — log do panelu
// ════════════════════════════════════════════════════════════════
function logNotif(text, typ = "") {
  const el = document.getElementById("diagNotifLog");
  if (!el) return;
  el.textContent = text;
  el.className   = `diag-notif-log ${typ}`;
}

// ════════════════════════════════════════════════════════════════
//  TEST → MNĚ (přímá Notification API)
// ════════════════════════════════════════════════════════════════
async function testNotifikaceMne() {
  if (Notification.permission !== "granted") {
    logNotif("❌ Notifikace nejsou povoleny — povol je nejdřív!", "chyba");
    return;
  }
  try {
    new Notification("🖖 Klubovna — test notifikace", {
      body: "Systémová notifikace funguje správně! USS Admirál Jiřík hlásí zeleno.",
      icon: "./icon-192.png",
      tag:  "diagnostika-test"
    });
    logNotif("✅ Notifikace odeslána — měla by vyskočit!", "ok");
  } catch (e) {
    logNotif(`❌ Chyba: ${e.message}`, "chyba");
  }
}

// ════════════════════════════════════════════════════════════════
//  TEST → DRUHÉMU (přes Firestore — onSnapshot u druhého spustí notifikaci)
// ════════════════════════════════════════════════════════════════
async function testNotifikaceJarde() {
  logNotif("⏳ Odesílám testovací signál do Firestore...", "");
  try {
    const { getApps } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
    const { getAuth } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js");
    const { getFirestore, doc, setDoc, deleteDoc, serverTimestamp } = await import(
      "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");

    const app  = getApps()[0];
    const user = getAuth(app).currentUser;
    if (!user) { logNotif("❌ Nepřihlášen!", "chyba"); return; }

    const db  = getFirestore(app);
    const ref = doc(db, "_notif_test", "ping");

    // Zapsat testovací dokument — druhý ho zachytí přes listener
    await setDoc(ref, {
      od:        user.displayName,
      odUid:     user.uid,
      zprava:    `🔔 Test notifikace od ${user.displayName}`,
      timestamp: serverTimestamp()
    });

    logNotif(`✅ Signál odeslán od ${user.displayName} — druhý by měl dostat notifikaci!`, "ok");

    // Smazat po 10 sekundách — čistota databáze
    setTimeout(() => deleteDoc(ref).catch(() => {}), 10000);

  } catch (e) {
    logNotif(`❌ Chyba: ${e.message}`, "chyba");
  }
}

// ════════════════════════════════════════════════════════════════
//  LISTENER — zachytit testovací signál od druhého
//  (registruje se při inicializaci, funguje na pozadí)
// ════════════════════════════════════════════════════════════════
async function spustitNotifTestListener(aktualniUid) {
  try {
    const { getApps } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
    const { getFirestore, doc, onSnapshot } = await import(
      "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");

    const db  = getFirestore(getApps()[0]);
    const ref = doc(db, "_notif_test", "ping");

    onSnapshot(ref, (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      // Ignorovat vlastní signály
      if (!data || data.odUid === aktualniUid) return;

      // Zobrazit notifikaci
      if (Notification.permission === "granted") {
        new Notification("🔔 Klubovna — test od " + (data.od || "bráchy"), {
          body: data.zprava || "Testovací notifikace dorazila!",
          icon: "./icon-192.png",
          tag:  "diagnostika-test-prijem"
        });
      }
      console.log("🔔 [diagnostika] Testovací notifikace přijata od:", data.od);
    });
  } catch (e) {
    console.warn("[diagnostika] notif listener chyba:", e.message);
  }
}

// ════════════════════════════════════════════════════════════════
//  INICIALIZACE — vstupní bod modulu
// ════════════════════════════════════════════════════════════════
export function inicializovatDiagnostiku() {
  injektovatCSS();
  injektovatHTML();

  document.getElementById("diagnostikaClose")
    ?.addEventListener("click", zavritDiagnostiku);

  document.getElementById("diagnostikaOverlay")
    ?.addEventListener("click", (e) => {
      if (e.target.id === "diagnostikaOverlay") zavritDiagnostiku();
    });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" &&
        document.getElementById("diagnostikaOverlay")?.classList.contains("active"))
      zavritDiagnostiku();
  });

  // Globální funkce
  window.__diagnostikaRefresh   = () => spustitDiagnostiku();
  window.__otevritDiagnostiku   = () => otevritDiagnostiku();
  window.__testNotifikaceMne    = () => testNotifikaceMne();
  window.__testNotifikaceJarde  = () => testNotifikaceJarde();

  // Spustit listener pro příchozí testovací signály
  // (počkáme chvíli než se Firebase inicializuje)
  setTimeout(async () => {
    try {
      const { getApps } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
      const { getAuth } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js");
      const apps = getApps();
      if (!apps.length) return;
      const user = getAuth(apps[0]).currentUser;
      if (user) spustitNotifTestListener(user.uid);
    } catch (e) {}
  }, 3000);
}

// ⏱️ LOG END
console.log(`%c🚀 [diagnostika] Načteno za ${(performance.now() - __diagnostika_START).toFixed(2)} ms`, 'background: #000; color: #00ff00; font-weight: bold; padding: 2px;');
