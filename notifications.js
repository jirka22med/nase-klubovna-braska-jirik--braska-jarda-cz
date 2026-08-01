// notifications.js — LCARS Messenger | Web Push notifikace
const __notifications_START = performance.now();
import { db } from './firebase-config.js';
import { doc, setDoc } from
  "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const VAPID_KEY = "BEI90J-t1BYOOoRNJwutG9Ti4YpAFIWiOr6qpEASe5NR70A44KOQn_bBj7bPOFOPXlmTRnL1OTfOsm7jdNA1wqs";

// Max počet pokusů a prodleva mezi nimi
const MAX_POKUSU = 4;
const RETRY_MS   = [1500, 3000, 6000, 10000]; // 1.5s → 3s → 6s → 10s

let messaging = null;

// ════════════════════════════════════
//  POMOCNÁ — počkat N milisekund
// ════════════════════════════════════
const pockej = (ms) => new Promise(res => setTimeout(res, ms));

// ════════════════════════════════════
//  POMOCNÁ — počkat až Firebase app bude ready
//  notifications.js se načte za 0ms, firebase-config za 3.7ms
//  → getApps()[0] může být undefined → retry každých 200ms
// ════════════════════════════════════
async function cekejNaFirebase(maxMs = 8000) {
  const { getApps } = await import(
    "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js"
  );
  const zacatek = Date.now();
  while (Date.now() - zacatek < maxMs) {
    const apps = getApps();
    if (apps.length > 0) return apps[0];
    await pockej(200);
  }
  throw new Error("Firebase app se neinicializoval včas (timeout 8s)");
}

// ════════════════════════════════════
//  INICIALIZACE — s retry logikou
// ════════════════════════════════════
export async function inicializovatNotifikace(userId) {
  try {
    // Zaregistrovat Service Worker
    const reg = await navigator.serviceWorker.register(
      "./firebase-messaging-sw.js"
    );
    console.log("🔔 [notifications] SW zaregistrován:", reg.scope);

    // Počkat na Firebase app — řeší timing problem!
    const app = await cekejNaFirebase();

    const { getMessaging, getToken, onMessage } = await import(
      "https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging.js"
    );

    messaging = getMessaging(app);

    // Požádat o povolení notifikací
    const povoleni = await Notification.requestPermission();
    if (povoleni !== "granted") {
      console.log("🔕 [notifications] Uživatel odmítl notifikace");
      return false;
    }

    // ════════════════════════════════
    //  RETRY SMYČKA pro getToken
    //  Push service může být pomalý nebo
    //  Firebase ještě nedokončil handshake
    // ════════════════════════════════
    let token = null;
    let pokus = 0;

    while (pokus < MAX_POKUSU) {
      try {
        console.log(`🔄 [notifications] getToken — pokus ${pokus + 1}/${MAX_POKUSU}`);

        token = await getToken(messaging, {
          vapidKey:                  VAPID_KEY,
          serviceWorkerRegistration: reg
        });

        if (token) {
          console.log("✅ [notifications] FCM token získán na pokus", pokus + 1);
          break;
        }

      } catch (tokenErr) {
        console.warn(`⚠️ [notifications] Pokus ${pokus + 1} selhal:`, tokenErr.message);

        if (pokus < MAX_POKUSU - 1) {
          const cekani = RETRY_MS[pokus];
          console.log(`⏳ [notifications] Čekám ${cekani}ms...`);
          await pockej(cekani);
        }
      }
      pokus++;
    }

    // Uložit token do Firestore
    if (token) {
      await setDoc(doc(db, "users", userId), {
        fcmToken: token
      }, { merge: true });
      console.log("💾 [notifications] FCM token uložen do Firestore");
    } else {
      console.warn("⚠️ [notifications] Token se nepodařilo získat ani po", MAX_POKUSU, "pokusech");
      return false;
    }

    // Foreground notifikace (tab otevřený)
    onMessage(messaging, (payload) => {
      zobrazitForegroundNotifikaci(payload);
    });

    return true;

  } catch (err) {
    console.warn("❌ [notifications] Chyba inicializace:", err.message);
    return false;
  }
}

// ════════════════════════════════════
//  FOREGROUND NOTIFIKACE (tab otevřený)
// ════════════════════════════════════
function zobrazitForegroundNotifikaci(payload) {
  const el = document.getElementById("lcarsToast");
  if (!el) return;
  el.textContent = `📨 ${payload.notification?.title}: ${payload.notification?.body}`;
  el.classList.add("active");
  setTimeout(() => el.classList.remove("active"), 4000);
}

// ════════════════════════════════════
//  STAV POVOLENÍ
// ════════════════════════════════════
export function getNotifikaceStatus() {
  if (!("Notification" in window)) return "nepodporováno";
  return Notification.permission;
}

// ⏱️ LOG END
console.log(`%c🚀 [notifications] Načteno za ${(performance.now() - __notifications_START).toFixed(2)} ms`, 'background: #000; color: #00ff00; font-weight: bold; padding: 2px;');
