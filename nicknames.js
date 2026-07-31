// nicknames.js — LCARS Messenger (Klubovna) | Sdílené přezdívky v2
// Messenger-style — když Jiřík nastaví Jardovi přezdívku,
// Jarda ji vidí u sebe v chatu taky. Obousměrné, sdílené pro oba!
//
// Firestore: nicknames/{targetUserId} = { nickname, setBy, setByName, timestamp }

import { db } from './firebase-config.js';
import {
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  collection,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ════════════════════════════════════════════════════════════════
//  ULOŽIT / PŘEPSAT PŘEZDÍVKU
//  Uloží přezdívku pro cílového uživatele — vidí ji OBA
// ════════════════════════════════════════════════════════════════
export async function ulozitPrezdivku(forUserId, prezdivka, setByUser) {
  const cisty = prezdivka.trim();

  if (!cisty) throw new Error("Přezdívka nesmí být prázdná!");
  if (cisty.length > 30) throw new Error("Přezdívka může mít nejvýše 30 znaků!");

  await setDoc(doc(db, "nicknames", forUserId), {
    nickname:   cisty,
    setBy:      setByUser.uid,
    setByName:  setByUser.displayName,
    timestamp:  serverTimestamp()
  });
}

// ════════════════════════════════════════════════════════════════
//  SMAZAT PŘEZDÍVKU — obnoví původní Google jméno pro oba
// ════════════════════════════════════════════════════════════════
export async function smazatPrezdivku(forUserId) {
  await deleteDoc(doc(db, "nicknames", forUserId));
}

// ════════════════════════════════════════════════════════════════
//  REALTIME LISTENER — sleduje všechny přezdívky najednou
//  callback dostane mapu: { uid: "přezdívka", uid2: "přezdívka2" }
// ════════════════════════════════════════════════════════════════
export function sledovatPrezdivky(callback) {
  return onSnapshot(collection(db, "nicknames"), (snapshot) => {
    const mapa = {};
    snapshot.forEach(docSnap => {
      mapa[docSnap.id] = docSnap.data();
    });
    callback(mapa);
  }, (err) => {
    console.warn("sledovatPrezdivky chyba:", err.message);
  });
}

// ════════════════════════════════════════════════════════════════
//  HELPER — vrátí přezdívku nebo fallback na skutečné jméno
//  nicknamesMapa = výstup z callbacku výše
// ════════════════════════════════════════════════════════════════
export function ziskatJmeno(nicknamesMapa, userId, skutecneJmeno) {
  return nicknamesMapa?.[userId]?.nickname || skutecneJmeno || "Posádka";
}

// ════════════════════════════════════════════════════════════════
//  VYKRESLIT PANEL PŘEZDÍVEK
//  users = [{ uid, displayName }] — všichni uživatelé
//  nicknamesMapa = aktuální stav přezdívek
//  aktualniUser = přihlášený uživatel (kdo edituje)
// ════════════════════════════════════════════════════════════════
export function vykresliNicknamePanel(container, users, nicknamesMapa, aktualniUser) {
  // Zobrazit VŠECHNY uživatele včetně sebe — stejně jako Messenger
  // Jiřík vidí: [svoje pole] + [Jardovo pole]
  const vsichni = users;

  if (!vsichni.length) {
    container.innerHTML = `
      <div class="nickname-prazdno">
        Žádní další členové posádky zatím nejsou registrováni.
      </div>`;
    return;
  }

  container.innerHTML = `
    <div class="nickname-section-title">PŘEZDÍVKY POSÁDKY</div>
    <p class="nickname-hint">
      Přezdívky vidí <strong>oba</strong> — stejně jako na Messengeru.
      Nastaví-li ji jeden, druhý ji vidí okamžitě.
    </p>
    ${vsichni.map(u => {
      const zaznam          = nicknamesMapa?.[u.uid];
      const aktualniHodnota = zaznam?.nickname ?? "";
      const ktoNastavil     = zaznam?.setByName ?? "";
      const jeSam           = u.uid === aktualniUser.uid;
      const initial         = (u.displayName || "?").charAt(0).toUpperCase();

      return `
        <div class="nickname-item ${jeSam ? "nickname-item-self" : ""}">
          <div class="nickname-avatar">${initial}</div>
          <div class="nickname-info">
            <div class="nickname-realname">
              ${escHtml(u.displayName)}
              ${jeSam ? '<span class="nickname-self-tag">— to jsi ty</span>' : ""}
            </div>
            <div class="nickname-sub">
              ${aktualniHodnota
                ? `přezdívka nastavena: ${escHtml(ktoNastavil)}`
                : jeSam
                  ? "nastav svojí přezdívku — Jarda ji uvidí v chatu"
                  : "žádná přezdívka — zobrazuje se původní jméno"}
            </div>
          </div>
          <div class="nickname-input-group">
            <input type="text"
                   class="lcars-input nickname-input"
                   id="nick-input-${u.uid}"
                   placeholder="${jeSam ? "Tvoje přezdívka..." : "Zadej přezdívku..."}"
                   maxlength="30"
                   value="${escHtml(aktualniHodnota)}">
            <button class="btn-nick-ulozit"
                    onclick="window.__ulozitNick('${u.uid}')">
              ULOŽIT
            </button>
            ${aktualniHodnota ? `
              <button class="btn-nick-smazat"
                      onclick="window.__smazatNick('${u.uid}')"
                      title="Obnovit původní jméno">✕</button>
            ` : ""}
          </div>
          <div class="nickname-preview" id="nick-preview-${u.uid}">
            ${aktualniHodnota
              ? `Oba vidí: <strong>${escHtml(aktualniHodnota)}</strong>`
              : `<span style="opacity:0.3">— zatím nenastaveno —</span>`}
          </div>
        </div>`;
    }).join("")}
  `;

  // Live preview při psaní
  vsichni.forEach(u => {
    const input = document.getElementById(`nick-input-${u.uid}`);
    if (!input) return;

    input.addEventListener("input", () => {
      const preview = document.getElementById(`nick-preview-${u.uid}`);
      if (!preview) return;
      const val = input.value.trim();
      preview.innerHTML = val
        ? `Oba vidí: <strong>${escHtml(val)}</strong>`
        : `<span style="opacity:0.3">— zatím nenastaveno —</span>`;
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") window.__ulozitNick(u.uid);
    });
  });
}

// ════════════════════════════════════════════════════════════════
//  NAČÍST VŠECHNY UŽIVATELE (pro panel)
// ════════════════════════════════════════════════════════════════
export async function nacistVsechnyUzivatele() {
  try {
    const { collection: col, getDocs } = await import(
      "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js"
    );
    const snap  = await getDocs(col(db, "users"));
    const users = [];
    snap.forEach(d => users.push({ uid: d.id, ...d.data() }));
    return users;
  } catch (e) {
    console.warn("nacistVsechnyUzivatele chyba:", e.message);
    return [];
  }
}

// ════════════════════════════════════════════════════════════════
//  HELPER interní
// ════════════════════════════════════════════════════════════════
function escHtml(text) {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
