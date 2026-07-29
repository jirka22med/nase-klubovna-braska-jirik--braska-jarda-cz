// auth2.js — LCARS Messenger | Druhá vrstva přístupu
// SHA-256 ověření hesla — jednosměrná funkce, klíč není uložen nikde!
// Nikdo z kódu heslo nezjistí — v kódu je pouze otisk (hash), ne heslo samotné.

// ╔══════════════════════════════════════════════════════════════╗  
// ║  HASH HESLA — SHA-256 otisk                                 ║
// ║  Samotné heslo zde NENÍ — pouze jeho otisk!                 ║
// ╚══════════════════════════════════════════════════════════════╝
const HASH_HESLA = "98e33a569ea41213abbafb7c86f04af63f3e243ecf440dc0e2a027bf2581cb63";

// Kolik pokusů než se uživatel zablokuje
const MAX_POKUSU = 5;
const BLOKACE_MS = 5 * 60 * 1000; // 5 minut

// Počítadlo pokusů v paměti (resetuje se při reload)
let pocetPokusu = 0;
let zablokovanDo = null;

// ════════════════════════════════════════════════════════════════
//  HLAVNÍ FUNKCE — ověřit zadané heslo
// ════════════════════════════════════════════════════════════════
export async function overitHeslo(heslo) {

  // Blokace po MAX_POKUSU neúspěšných pokusech
  if (zablokovanDo && Date.now() < zablokovanDo) {
    const zbyva = Math.ceil((zablokovanDo - Date.now()) / 1000);
    throw new Error(`PŘÍSTUP BLOKOVÁN — zkus to za ${zbyva}s`);
  }

  if (!heslo || heslo.trim() === "") {
    throw new Error("Heslo nesmí být prázdné!");
  }

  // Zahashovat vstup přes nativní Web Crypto API (SHA-256)
  const hash = await sha256hex(heslo.trim());

  if (hash === HASH_HESLA) {
    // Správné heslo — reset počítadla
    pocetPokusu = 0;
    zablokovanDo = null;
    return true;
  }

  // Špatné heslo — increment + možná blokace
  pocetPokusu++;
  if (pocetPokusu >= MAX_POKUSU) {
    zablokovanDo = Date.now() + BLOKACE_MS;
    pocetPokusu = 0;
    throw new Error(`Příliš mnoho pokusů — přístup blokován na 5 minut!`);
  }

  const zbyva = MAX_POKUSU - pocetPokusu;
  throw new Error(`Nesprávné heslo — zbývá ${zbyva} pokus${zbyva === 1 ? "" : "ů"}`);
}

// ════════════════════════════════════════════════════════════════
//  SHA-256 → hex string (nativní Web Crypto, žádná knihovna)
// ════════════════════════════════════════════════════════════════
async function sha256hex(text) {
  const encoder  = new TextEncoder();
  const data     = encoder.encode(text);
  const hashBuf  = await crypto.subtle.digest("SHA-256", data);
  const hashArr  = Array.from(new Uint8Array(hashBuf));
  return hashArr.map(b => b.toString(16).padStart(2, "0")).join("");
}

// Export stavu blokace pro UI (aby mohlo zobrazit odpočet)
export function getBlokaceInfo() {
  if (!zablokovanDo || Date.now() >= zablokovanDo) return null;
  return Math.ceil((zablokovanDo - Date.now()) / 1000);
}
