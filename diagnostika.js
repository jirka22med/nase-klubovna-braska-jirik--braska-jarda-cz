// diagnostika.js — LCARS Messenger (Klubovna)
// Diagnostický panel — standalone modul
// Stačí připojit v index.html — nepotřebuje ostatní moduly!
// ════════════════════════════════════════════════════════════════
const __diagnostika_START = performance.now();

// ════════════════════════════════════════════════════════════════
//  OTEVŘÍT / ZAVŘÍT MODÁL
// ════════════════════════════════════════════════════════════════
export function otevritDiagnostiku() {
  const overlay = document.getElementById("diagnostikaOverlay");
  if (!overlay) return;
  overlay.classList.add("active");
  document.body.style.overflow = "hidden";
  spustitDiagnostiku();
}

export function zavritDiagnostiku() {
  const overlay = document.getElementById("diagnostikaOverlay");
  if (!overlay) return;
  overlay.classList.remove("active");
  document.body.style.overflow = "";
}

// ════════════════════════════════════════════════════════════════
//  HLAVNÍ DIAGNOSTIKA — spustí všechny testy
// ════════════════════════════════════════════════════════════════
async function spustitDiagnostiku() {
  const panel = document.getElementById("diagnostikaPanel");
  if (!panel) return;

  panel.innerHTML = `<div class="diag-loading">⏳ Spouštím diagnostiku...</div>`;

  const vysledky = [];

  // Test 1 — Prohlížeč
  vysledky.push(await testProhlizec());
  // Test 2 — Firebase app
  vysledky.push(await testFirebaseApp());
  // Test 3 — Firestore čtení
  vysledky.push(await testFirestoreCten());
  // Test 4 — Firestore zápis
  vysledky.push(await testFirestoreZapis());
  // Test 5 — Service Worker
  vysledky.push(await testServiceWorker());
  // Test 6 — Notifikace
  vysledky.push(await testNotifikace());
  // Test 7 — FCM token
  vysledky.push(await testFcmToken());
  // Test 8 — Přítomnost modulů
  vysledky.push(await testModuly());
  // Test 9 — Online status
  vysledky.push(await testOnline());
  // Test 10 — Performance
  vysledky.push(await testPerformance());

  vykresliVysledky(panel, vysledky);
}

// ════════════════════════════════════════════════════════════════
//  TESTY
// ════════════════════════════════════════════════════════════════

async function testProhlizec() {
  const ua      = navigator.userAgent;
  const brave   = navigator.brave ? "Brave" : null;
  const edge    = ua.includes("Edg/") ? "Edge" : null;
  const chrome  = ua.includes("Chrome") && !edge && !brave ? "Chrome" : null;
  const firefox = ua.includes("Firefox") ? "Firefox" : null;
  const nazev   = brave || edge || chrome || firefox || "Neznámý";
  const online  = navigator.onLine;

  return {
    nazev:    "🌐 Prohlížeč",
    status:   online ? "ok" : "chyba",
    zprava:   `${nazev} — internet: ${online ? "připojen" : "OFFLINE"}`,
    detail:   brave ? "⚠️ Brave blokuje push notifikace — viz nastavení" : null
  };
}

async function testFirebaseApp() {
  try {
    const { getApps } = await import(
      "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js"
    );
    const apps = getApps();
    if (apps.length === 0) throw new Error("Firebase app není inicializován");
    return {
      nazev:  "🔥 Firebase App",
      status: "ok",
      zprava: `Inicializován — projekt: ${apps[0].options.projectId}`
    };
  } catch (e) {
    return { nazev: "🔥 Firebase App", status: "chyba", zprava: e.message };
  }
}

async function testFirestoreCten() {
  try {
    const { getApps }     = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
    const { getFirestore, collection, getDocs, limit, query } = await import(
      "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js"
    );
    const db   = getFirestore(getApps()[0]);
    const zac  = performance.now();
    const q    = query(collection(db, "users"), limit(1));
    await getDocs(q);
    const ms   = (performance.now() - zac).toFixed(0);
    return {
      nazev:  "📖 Firestore čtení",
      status: "ok",
      zprava: `Úspěšné — odezva ${ms}ms`
    };
  } catch (e) {
    return { nazev: "📖 Firestore čtení", status: "chyba", zprava: e.message };
  }
}

async function testFirestoreZapis() {
  try {
    const { getApps }  = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
    const { getFirestore, doc, setDoc, deleteDoc, serverTimestamp } = await import(
      "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js"
    );
    const db      = getFirestore(getApps()[0]);
    const testRef = doc(db, "_diagnostika_test", "ping");
    const zac     = performance.now();
    await setDoc(testRef, { ping: serverTimestamp() });
    await deleteDoc(testRef);
    const ms = (performance.now() - zac).toFixed(0);
    return {
      nazev:  "✏️ Firestore zápis",
      status: "ok",
      zprava: `Úspěšný — odezva ${ms}ms`
    };
  } catch (e) {
    return {
      nazev:  "✏️ Firestore zápis",
      status: e.message.includes("permission") ? "varovani" : "chyba",
      zprava: e.message.includes("permission")
        ? "Zablokováno pravidly — zkontroluj Firestore rules"
        : e.message
    };
  }
}

async function testServiceWorker() {
  try {
    if (!("serviceWorker" in navigator)) {
      return { nazev: "⚙️ Service Worker", status: "varovani", zprava: "Prohlížeč nepodporuje SW" };
    }
    const regs = await navigator.serviceWorker.getRegistrations();
    if (regs.length === 0) {
      return { nazev: "⚙️ Service Worker", status: "varovani", zprava: "Žádný SW není zaregistrován" };
    }
    const aktivni = regs.find(r => r.active);
    return {
      nazev:  "⚙️ Service Worker",
      status: aktivni ? "ok" : "varovani",
      zprava: aktivni
        ? `Aktivní — scope: ${regs[0].scope}`
        : `Registrován ale nespuštěn — stav: ${regs[0].installing ? "instalace" : "čekání"}`
    };
  } catch (e) {
    return { nazev: "⚙️ Service Worker", status: "chyba", zprava: e.message };
  }
}

async function testNotifikace() {
  if (!("Notification" in window)) {
    return { nazev: "🔔 Notifikace", status: "chyba", zprava: "Prohlížeč nepodporuje notifikace" };
  }
  const stav = Notification.permission;
  return {
    nazev:  "🔔 Notifikace",
    status: stav === "granted" ? "ok" : stav === "denied" ? "chyba" : "varovani",
    zprava: stav === "granted"
      ? "Povoleny ✅"
      : stav === "denied"
        ? "Zamítnuty — povol v nastavení prohlížeče"
        : "Zatím nepožádáno — klikni pro povolení",
    akce: stav === "default" ? {
      label: "Povolit notifikace",
      fn:    () => Notification.requestPermission().then(() => spustitDiagnostiku())
    } : null
  };
}

async function testFcmToken() {
  try {
    const { getAuth }        = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js");
    const { getApps }        = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
    const { getFirestore, doc, getDoc } = await import(
      "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js"
    );

    const auth = getAuth(getApps()[0]);
    const user = auth.currentUser;
    if (!user) {
      return { nazev: "📱 FCM Token", status: "varovani", zprava: "Nepřihlášen — token nelze zkontrolovat" };
    }

    const db   = getFirestore(getApps()[0]);
    const snap = await getDoc(doc(db, "users", user.uid));
    const token = snap.data()?.fcmToken;

    return {
      nazev:  "📱 FCM Token",
      status: token ? "ok" : "varovani",
      zprava: token
        ? `Uložen v Firestore ✅ (${token.substring(0, 20)}...)`
        : "Token chybí — notifikace při zavřeném tabu nebudou fungovat"
    };
  } catch (e) {
    return { nazev: "📱 FCM Token", status: "chyba", zprava: e.message };
  }
}

async function testModuly() {
  const moduly = [
    { nazev: "auth",           fn: "prihlasitGooglem",          kde: "window.__auth"              },
    { nazev: "chat",           fn: "__otevritModal",             kde: "window.__otevritModal"      },
    { nazev: "gallery-slider", fn: "__otevritSlider",            kde: "window.__otevritSlider"     },
    { nazev: "presence",       fn: "__prepnoutReakci",           kde: "window.__prepnoutReakci"    },
    { nazev: "nicknames",      fn: "__ulozitNick",               kde: "window.__ulozitNick"        },
  ];

  const chybejici = moduly.filter(m => !window[m.fn] && typeof window[m.fn] === "undefined");
  // Kontrola přes globální funkce
  const ok        = [
    window.__otevritModal  ? "chat ✅"          : "chat ❌",
    window.__otevritSlider ? "gallery-slider ✅" : "gallery-slider ❌",
    window.__prepnoutReakci? "presence ✅"       : "presence ❌",
    window.__ulozitNick    ? "nicknames ✅"      : "nicknames ❌",
  ];

  const chybi = ok.filter(m => m.includes("❌")).length;

  return {
    nazev:  "📦 Moduly",
    status: chybi === 0 ? "ok" : chybi <= 2 ? "varovani" : "chyba",
    zprava: ok.join(" | ")
  };
}

async function testOnline() {
  try {
    const { getAuth }  = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js");
    const { getApps }  = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
    const { getFirestore, collection, getDocs, query, where } = await import(
      "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js"
    );

    const auth  = getAuth(getApps()[0]);
    const user  = auth.currentUser;
    if (!user) return { nazev: "👥 Online status", status: "varovani", zprava: "Nepřihlášen" };

    const db    = getFirestore(getApps()[0]);
    const q     = query(collection(db, "users"), where("isOnline", "==", true));
    const snap  = await getDocs(q);
    const onlineUsers = [];
    snap.forEach(d => onlineUsers.push(d.data().displayName || d.id));

    return {
      nazev:  "👥 Online status",
      status: "ok",
      zprava: `Online uživatelé (${onlineUsers.length}): ${onlineUsers.join(", ") || "nikdo"}`
    };
  } catch (e) {
    return { nazev: "👥 Online status", status: "chyba", zprava: e.message };
  }
}

async function testPerformance() {
  const navigace = performance.getEntriesByType("navigation")[0];
  const loadTime = navigace ? (navigace.loadEventEnd - navigace.startTime).toFixed(0) : "?";
  const pamet    = performance.memory
    ? `${(performance.memory.usedJSHeapSize / 1048576).toFixed(1)} MB`
    : "nedostupné";

  return {
    nazev:  "⚡ Performance",
    status: "ok",
    zprava: `Načtení stránky: ${loadTime}ms | JS heap: ${pamet}`
  };
}

// ════════════════════════════════════════════════════════════════
//  VYKRESLENÍ VÝSLEDKŮ
// ════════════════════════════════════════════════════════════════
function vykresliVysledky(panel, vysledky) {
  const ikony = { ok: "✅", varovani: "⚠️", chyba: "❌" };
  const celkem = vysledky.length;
  const ok     = vysledky.filter(v => v.status === "ok").length;
  const chyby  = vysledky.filter(v => v.status === "chyba").length;

  panel.innerHTML = `
    <div class="diag-summary diag-summary-${chyby === 0 ? "ok" : "problem"}">
      <span class="diag-summary-icon">${chyby === 0 ? "🟢" : "🔴"}</span>
      <span class="diag-summary-text">
        ${ok}/${celkem} testů prošlo
        ${chyby > 0 ? `— ${chyby} ${chyby === 1 ? "chyba" : "chyby"}` : "— vše zelené!"}
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
          ${v.akce ? `
            <button class="diag-akce-btn"
                    onclick="(${v.akce.fn.toString()})()">
              ${v.akce.label}
            </button>` : ""}
        </div>
      `).join("")}
    </div>

    <div class="diag-footer">
      Diagnostika spuštěna: ${new Date().toLocaleTimeString("cs-CZ")}
    </div>
  `;
}

// ════════════════════════════════════════════════════════════════
//  INICIALIZACE — zaregistrovat event listenery
// ════════════════════════════════════════════════════════════════
export function inicializovatDiagnostiku() {
  const overlay  = document.getElementById("diagnostikaOverlay");
  const btnClose = document.getElementById("diagnostikaClose");

  btnClose?.addEventListener("click", zavritDiagnostiku);
  overlay?.addEventListener("click", (e) => {
    if (e.target === overlay) zavritDiagnostiku();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" &&
        overlay?.classList.contains("active")) zavritDiagnostiku();
  });

  // Globální funkce pro refresh tlačítko
  window.__diagnostikaRefresh = () => spustitDiagnostiku();
  window.__otevritDiagnostiku = () => otevritDiagnostiku();
}

// ⏱️ LOG END
console.log(`%c🚀 [diagnostika] Načteno za ${(performance.now() - __diagnostika_START).toFixed(2)} ms`, 'background: #000; color: #00ff00; font-weight: bold; padding: 2px;');
