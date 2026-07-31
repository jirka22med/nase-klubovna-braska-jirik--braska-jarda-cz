// nicknames.js — LCARS Messenger (Klubovna) | Správa přezdívek
// Funguje jako Messenger — každý může nastavit:
//   1. SVOJI přezdívku   → jak ho vidí druhý
//   2. PŘEZDÍVKU DRUHÉHO → jak vidí on druhého
//
// Firestore struktura:
//   users/{uid}/myNickname          → moje přezdívka (vidí ji druhý)
//   users/{uid}/nicknames/{otherUID} → jak já vidím druhého

import { db } from './firebase-config.js';
import {
  doc,
  updateDoc,
  onSnapshot,
  getDoc,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ════════════════════════════════════════════════════════════════
//  ULOŽIT SVOJI PŘEZDÍVKU (jak mě vidí druhý)
// ════════════════════════════════════════════════════════════════
export async function ulozitMojuPrezdivku(myUserId, prezdivka) {
  const cisty = prezdivka.trim();
  if (cisty.length > 30) throw new Error("Přezdívka může mít nejvýše 30 znaků!");

  await updateDoc(doc(db, "users", myUserId), {
    myNickname: cisty || null
  });
}

// ════════════════════════════════════════════════════════════════
//  ULOŽIT PŘEZDÍVKU PRO DRUHÉHO (jak vidím já jeho)
// ════════════════════════════════════════════════════════════════
export async function ulozitPrezdivkuPraDruheho(myUserId, forUserId, prezdivka) {
  const cisty = prezdivka.trim();
  if (cisty.length > 30) throw new Error("Přezdívka může mít nejvýše 30 znaků!");

  await updateDoc(doc(db, "users", myUserId), {
    [`nicknames.${forUserId}`]: cisty || null
  });
}

// ════════════════════════════════════════════════════════════════
//  SLEDOVAT PŘEZDÍVKY REALTIME (vlastní dokument)
//  Vrací: { myNickname, nicknames: { uid: "přezdívka" } }
// ════════════════════════════════════════════════════════════════
export function sledovatPrezdivky(userId, callback) {
  return onSnapshot(doc(db, "users", userId), (snap) => {
    const data = snap.data() ?? {};
    callback({
      myNickname: data.myNickname ?? "",
      nicknames:  data.nicknames  ?? {}
    });
  }, (err) => {
    console.warn("sledovatPrezdivky chyba:", err.message);
  });
}

// ════════════════════════════════════════════════════════════════
//  SLEDOVAT DATA DRUHÉHO UZIVATELE (abychom viděli jeho myNickname)
// ════════════════════════════════════════════════════════════════
export function sledovatDruhehoUzivatele(otherUserId, callback) {
  return onSnapshot(doc(db, "users", otherUserId), (snap) => {
    const data = snap.data() ?? {};
    callback({
      uid:         otherUserId,
      displayName: data.displayName  ?? "Posádka",
      myNickname:  data.myNickname   ?? "",
      isOnline:    data.isOnline     ?? false,
      lastSeen:    data.lastSeen     ?? null
    });
  }, (err) => {
    console.warn("sledovatDruhehoUzivatele chyba:", err.message);
  });
}

// ════════════════════════════════════════════════════════════════
//  NAČÍST VŠECHNY UŽIVATELE (pro panel)
// ════════════════════════════════════════════════════════════════
export async function nacistVsechnyUzivatele() {
  try {
    const snapshot = await getDocs(collection(db, "users"));
    const users    = [];
    snapshot.forEach(d => users.push({ uid: d.id, ...d.data() }));
    return users;
  } catch (e) {
    console.warn("nacistVsechnyUzivatele chyba:", e.message);
    return [];
  }
}

// ════════════════════════════════════════════════════════════════
//  HELPER — jak zobrazit jméno odesílatele v chatu
//  Priorita: moje přezdívka pro něj > jeho myNickname > skutečné jméno
// ════════════════════════════════════════════════════════════════
export function ziskatZobrazeneJmeno(
  senderId,
  senderDisplayName,
  mojeNicknames,      // moje mapa přezdívek pro druhé
  druhyData           // data druhého uživatele (jeho myNickname)
) {
  // 1. Mám já nastavenou přezdívku pro tohoto uživatele?
  if (mojeNicknames?.[senderId]) return mojeNicknames[senderId];

  // 2. Nastavil si on sám přezdívku?
  if (druhyData?.uid === senderId && druhyData?.myNickname) {
    return druhyData.myNickname;
  }

  // 3. Skutečné jméno z Google
  return senderDisplayName || "Posádka";
}

// ════════════════════════════════════════════════════════════════
//  VYKRESLIT PANEL PŘEZDÍVEK
// ════════════════════════════════════════════════════════════════
export function vykresliNicknamePanel(
  container,
  users,
  aktualniUserId,
  mojeNicknames,
  mojuPrezdivku,
  druhyData
) {
  const ostatni  = users.filter(u => u.uid !== aktualniUserId);
  const jaData   = users.find(u => u.uid === aktualniUserId);
  const jaJmeno  = jaData?.displayName ?? "Já";

  container.innerHTML = `
    <div class="nick-panel">

      <!-- ═══ MOJE PŘEZDÍVKA ═══ -->
      <div class="nick-section-title">MOJE PŘEZDÍVKA V KONVERZACI</div>
      <p class="nick-hint">Takto tě bude vidět druhý — jako na Messengeru.</p>

      <div class="nick-item">
        <div class="nick-avatar">${jaJmeno.charAt(0).toUpperCase()}</div>
        <div class="nick-info">
          <div class="nick-realname">${escHtml(jaJmeno)}</div>
          <div class="nick-sub">tvoje skutečné Google jméno</div>
        </div>
        <div class="nick-input-group">
          <input type="text"
                 class="lcars-input nick-input"
                 id="nick-moje"
                 placeholder="Zadej svoji přezdívku..."
                 maxlength="30"
                 value="${escHtml(mojuPrezdivku ?? "")}">
          <button class="btn-nick-ulozit" onclick="window.__ulozitMoji()">ULOŽIT</button>
          ${mojuPrezdivku ? `<button class="btn-nick-smazat" onclick="window.__smazatMoji()" title="Smazat">✕</button>` : ""}
        </div>
        <div class="nick-preview" id="nick-preview-moje">
          Druhý tě vidí jako: <strong>${escHtml(mojuPrezdivku || jaJmeno)}</strong>
        </div>
      </div>

      <!-- ═══ PŘEZDÍVKY PRO DRUHÉ ═══ -->
      <div class="nick-section-title" style="margin-top:24px">PŘEZDÍVKY OSTATNÍCH</div>
      <p class="nick-hint">Takto budeš vidět ty ostatní — jen ty to vidíš.</p>

      ${ostatni.length === 0
        ? `<div class="nick-prazdno">Žádní další členové posádky.</div>`
        : ostatni.map(u => {
            const mojePrezdivkaProNeho = mojeNicknames?.[u.uid] ?? "";
            const jehoPrezdivka        = u.myNickname ?? "";
            const initial              = (u.displayName || "?").charAt(0).toUpperCase();
            return `
              <div class="nick-item">
                <div class="nick-avatar nick-avatar-other">${initial}</div>
                <div class="nick-info">
                  <div class="nick-realname">${escHtml(u.displayName)}</div>
                  <div class="nick-sub">
                    ${jehoPrezdivka
                      ? `jeho přezdívka: <em>${escHtml(jehoPrezdivka)}</em>`
                      : "jeho přezdívka: nenastavena"}
                  </div>
                </div>
                <div class="nick-input-group">
                  <input type="text"
                         class="lcars-input nick-input"
                         id="nick-other-${u.uid}"
                         placeholder="Zadej přezdívku..."
                         maxlength="30"
                         value="${escHtml(mojePrezdivkaProNeho)}">
                  <button class="btn-nick-ulozit"
                          onclick="window.__ulozitProDruheho('${u.uid}')">ULOŽIT</button>
                  ${mojePrezdivkaProNeho
                    ? `<button class="btn-nick-smazat"
                               onclick="window.__smazatProDruheho('${u.uid}')"
                               title="Smazat">✕</button>`
                    : ""}
                </div>
                <div class="nick-preview" id="nick-preview-${u.uid}">
                  Vidíš ho jako: <strong>${escHtml(mojePrezdivkaProNeho || u.displayName)}</strong>
                </div>
              </div>`;
          }).join("")}
    </div>
  `;

  // Live preview — moje přezdívka
  const mojeInput = document.getElementById("nick-moje");
  if (mojeInput) {
    mojeInput.addEventListener("input", () => {
      const preview = document.getElementById("nick-preview-moje");
      if (preview) {
        const val = mojeInput.value.trim();
        preview.innerHTML = `Druhý tě vidí jako: <strong>${escHtml(val || jaJmeno)}</strong>`;
      }
    });
    mojeInput.addEventListener("keydown", e => {
      if (e.key === "Enter") window.__ulozitMoji();
    });
  }

  // Live preview — přezdívky pro ostatní
  ostatni.forEach(u => {
    const input = document.getElementById(`nick-other-${u.uid}`);
    if (!input) return;
    input.addEventListener("input", () => {
      const preview = document.getElementById(`nick-preview-${u.uid}`);
      if (preview) {
        const val = input.value.trim();
        preview.innerHTML = `Vidíš ho jako: <strong>${escHtml(val || u.displayName)}</strong>`;
      }
    });
    input.addEventListener("keydown", e => {
      if (e.key === "Enter") window.__ulozitProDruheho(u.uid);
    });
  });
}

// Helper
function escHtml(text) {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
