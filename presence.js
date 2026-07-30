// presence.js — LCARS Messenger | Online status + Read receipts + Emoji reakce
// Jeden modul pro tři funkce — žádné závislosti mimo Firebase

import { db } from './firebase-config.js';
import {
  doc,
  updateDoc,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ════════════════════════════════════════════════════════════════
//  ONLINE / OFFLINE STATUS
// ════════════════════════════════════════════════════════════════

// Nastavit aktuálního uživatele jako ONLINE
export async function nastavitOnline(userId) {
  try {
    await updateDoc(doc(db, "users", userId), {
      isOnline:  true,
      lastSeen:  serverTimestamp()
    });
  } catch (e) {
    console.warn("nastavitOnline chyba:", e.message);
  }
}

// Nastavit aktuálního uživatele jako OFFLINE
export async function nastavitOffline(userId) {
  try {
    await updateDoc(doc(db, "users", userId), {
      isOnline:  false,
      lastSeen:  serverTimestamp()
    });
  } catch (e) {
    console.warn("nastavitOffline chyba:", e.message);
  }
}

// Sledovat online status DRUHÉHO uživatele (ne sebe)
// callback dostane: { isOnline: bool, lastSeen: timestamp | null, displayName: string }
export function sledovatOnlineStatus(aktualniUserId, callback) {
  // Posloucháme celou kolekci users — najdeme toho druhého
  const q = query(collection(db, "users"));

  return onSnapshot(q, (snapshot) => {
    snapshot.forEach((docSnap) => {
      // Přeskočit sebe
      if (docSnap.id === aktualniUserId) return;

      const data = docSnap.data();
      callback({
        isOnline:    data.isOnline   ?? false,
        lastSeen:    data.lastSeen   ?? null,
        displayName: data.displayName ?? "Posádka"
      });
    });
  }, (err) => {
    console.warn("sledovatOnlineStatus chyba:", err.message);
  });
}

// Registrovat zavření okna / přechod do pozadí → offline
export function registrovatOfflineHandlery(userId) {
  // Zavření okna / tabu
  window.addEventListener("beforeunload", () => {
    nastavitOffline(userId);
  });

  // Přepnutí tabu nebo minimalizace
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      nastavitOffline(userId);
    } else {
      nastavitOnline(userId);
    }
  });

  // Ztráta připojení k internetu
  window.addEventListener("offline", () => nastavitOffline(userId));
  window.addEventListener("online",  () => nastavitOnline(userId));
}

// ════════════════════════════════════════════════════════════════
//  READ RECEIPTS — přečtené zprávy
// ════════════════════════════════════════════════════════════════

// Označit všechny zprávy kde userId NENÍ v readBy jako přečtené
// Voláme kdykoli uživatel vidí chat (při každém renderu zpráv)
export async function oznacitZpravyJakoPrectene(userId) {
  try {
    const q = query(
      collection(db, "messages"),
      orderBy("timestamp", "desc"),
      limit(50)
    );

    const snapshot = await getDocs(q);
    const batch    = writeBatch(db);
    let   pocet    = 0;

    snapshot.forEach((docSnap) => {
      const data   = docSnap.data();
      const readBy = data.readBy ?? [];

      // Označit jen cizí zprávy které ještě nebyly přečteny
      if (data.senderId !== userId && !readBy.includes(userId)) {
        batch.update(docSnap.ref, {
          readBy: arrayUnion(userId)
        });
        pocet++;
      }
    });

    if (pocet > 0) await batch.commit();
  } catch (e) {
    console.warn("oznacitZpravyJakoPrectene chyba:", e.message);
  }
}

// Zjistit jestli zpráva byla přečtena druhým uživatelem
// Vrací: "✓✓" (přečteno) nebo "✓" (doručeno)
export function getReadStatus(zprava, aktualniUserId, druhyUserId) {
  // Zobrazujeme jen u vlastních zpráv
  if (zprava.senderId !== aktualniUserId) return "";

  const readBy = zprava.readBy ?? [];
  if (readBy.includes(druhyUserId)) return "✓✓";
  return "✓";
}

// ════════════════════════════════════════════════════════════════
//  EMOJI REAKCE
// ════════════════════════════════════════════════════════════════

// Přepnout reakci — přidat pokud tam není, odebrat pokud tam je
export async function prepnoutReakci(messageId, userId, emoji) {
  try {
    const msgRef = doc(db, "messages", messageId);
    const pole   = `reactions.${emoji}`;

    // Nejdřív zkontrolovat jestli tam userId je
    // Používáme getDocs pro jednorázové čtení
    const { getDoc } = await import(
      "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js"
    );
    const snap       = await getDoc(msgRef);
    const reactions  = snap.data()?.reactions ?? {};
    const uzivatele  = reactions[emoji] ?? [];

    if (uzivatele.includes(userId)) {
      // Odebrat reakci
      await updateDoc(msgRef, { [pole]: arrayRemove(userId) });
    } else {
      // Přidat reakci
      await updateDoc(msgRef, { [pole]: arrayUnion(userId) });
    }
  } catch (e) {
    console.warn("prepnoutReakci chyba:", e.message);
  }
}

// Vykreslit reakce pod zprávou do daného elementu
export function vykresitReakce(messageId, reactions, aktualniUserId) {
  const el = document.getElementById(`reactions-${messageId}`);
  if (!el) return;

  if (!reactions || Object.keys(reactions).length === 0) {
    el.innerHTML = "";
    return;
  }

  const html = Object.entries(reactions)
    .filter(([, uids]) => uids && uids.length > 0)
    .map(([emoji, uids]) => {
      const moje = uids.includes(aktualniUserId);
      return `
        <span class="reakce-chip ${moje ? "moje" : ""}"
              onclick="window.__prepnoutReakci('${messageId}', '${emoji}')"
              title="${moje ? "Klikni pro odebrání" : "Klikni pro přidání"}">
          ${emoji} <span class="reakce-pocet">${uids.length}</span>
        </span>`;
    })
    .join("");

  el.innerHTML = html;
}

// Zobrazit / skrýt emoji picker nad daným tlačítkem
export function toggleEmojiPicker(messageId, triggerEl) {
  // Zavřít existující picker pokud je otevřený
  const existujici = document.getElementById("emoji-picker-popup");
  if (existujici) {
    // Pokud je to picker pro stejnou zprávu → zavřít
    if (existujici.dataset.messageId === messageId) {
      existujici.remove();
      return;
    }
    existujici.remove();
  }

  const EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥", "🖖", "✅"];

  const picker  = document.createElement("div");
  picker.id     = "emoji-picker-popup";
  picker.dataset.messageId = messageId;
  picker.className         = "emoji-picker-menu";

  picker.innerHTML = EMOJIS.map(e =>
    `<button class="emoji-pick-btn" data-emoji="${e}">${e}</button>`
  ).join("");

  // Pozice nad tlačítkem
  const rect  = triggerEl.getBoundingClientRect();
  picker.style.position = "fixed";
  picker.style.bottom   = `${window.innerHeight - rect.top + 6}px`;
  picker.style.left     = `${rect.left}px`;
  picker.style.zIndex   = "500";

  document.body.appendChild(picker);

  // Klik na emoji
  picker.querySelectorAll(".emoji-pick-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      window.__prepnoutReakci(messageId, btn.dataset.emoji);
      picker.remove();
    });
  });

  // Klik mimo → zavřít
  setTimeout(() => {
    document.addEventListener("click", () => picker.remove(), { once: true });
  }, 50);
}
