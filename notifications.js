// notifications.js — LCARS Messenger | Web Push notifikace
import { db } from './firebase-config.js';
import { doc, setDoc, getDoc } from
  "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Firebase Messaging — compat verze přes CDN
// VAPID klíč — viz návod níže jak ho získat!
const VAPID_KEY = "BEI90J-t1BYOOoRNJwutG9Ti4YpAFIWiOr6qpEASe5NR70A44KOQn_bBj7bPOFOPXlmTRnL1OTfOsm7jdNA1wqs";

let messaging = null;

// ════════════════════════════════════
//  INICIALIZACE
// ════════════════════════════════════
export async function inicializovatNotifikace(userId) {
  try {
    // Zaregistrovat Service Worker
    const reg = await navigator.serviceWorker.register(
      "./firebase-messaging-sw.js"
    );
    console.log("SW zaregistrován:", reg.scope);

    // Inicializovat Firebase Messaging
    const { initializeApp, getApps } = await import(
      "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js"
    );
    const { getMessaging, getToken, onMessage } = await import(
      "https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging.js"
    );

    // Použít existující Firebase app
    const app = getApps()[0];
    messaging = getMessaging(app);

    // Požádat o povolení
    const povoleni = await Notification.requestPermission();
    if (povoleni !== "granted") {
      console.log("Notifikace odmítnuty uživatelem");
      return false;
    }

    // Získat FCM token
    const token = await getToken(messaging, {
      vapidKey:        VAPID_KEY,
      serviceWorkerRegistration: reg
    });

    if (token) {
      // Uložit token do Firestore — druhý uživatel ho použije pro cílení
      await setDoc(doc(db, "users", userId), {
        fcmToken: token
      }, { merge: true });
      console.log("FCM token uložen");
    }

    // Notifikace když je tab AKTIVNÍ (foreground)
    onMessage(messaging, (payload) => {
      zobrazitForegroundNotifikaci(payload);
    });

    return true;

  } catch (err) {
    console.warn("Notifikace - chyba inicializace:", err.message);
    return false;
  }
}

// ════════════════════════════════════
//  FOREGROUND NOTIFIKACE (tab otevřený)
// ════════════════════════════════════
function zobrazitForegroundNotifikaci(payload) {
  // Když je tab aktivní — zobrazíme vlastní LCARS notifikaci v UI
  // místo systémové (ta by se zobrazila divně)
  const el = document.getElementById("lcarsToast");
  if (!el) return;

  el.textContent = `📨 ${payload.notification?.title}: ${payload.notification?.body}`;
  el.classList.add("active");

  setTimeout(() => el.classList.remove("active"), 4000);
}

// ════════════════════════════════════
//  ZJISTIT STAV POVOLENÍ
// ════════════════════════════════════
export function getNotifikaceStatus() {
  if (!("Notification" in window)) return "nepodporováno";
  return Notification.permission; // "granted" | "denied" | "default"
}
