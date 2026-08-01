// fleet-registry.js - VELITELSKÝ MOST (Jediný soubor, který upravuješ)
const __FLEET_REGISTER_START = performance.now();
//====stímto se bude pracovat 1===========
// 🤖 AUTO-VERZOVAČ – verze roste při každém načtení stránky, žádné sekání!
const _buildDate = new Date();

const _buildCounter = (() => {
    try {
        const key = 'uss_prometheus_build';
        // Načteme poslední uloženou hodnotu, fallback na 54 (navazujeme na tvoji historii)
        const last = parseInt(localStorage.getItem(key) || '0', 10);
        const next = isNaN(last) ? 1 : last + 1;
        localStorage.setItem(key, next);
        return next;
    } catch (e) {
        // Pokud localStorage selže (např. soukromý režim), vrátíme timestamp – žádné sekání!
        return Date.now();
    }
})();

const FLEET_CONFIG = {
    version: `${_buildDate.getFullYear()}.${_buildDate.getMonth() + 1}.${_buildDate.getDate()}.${_buildCounter}`,
    // Výsledek např: "2025.2.24.55" – čitelné, automatické, nesekne se! ✅
    buildDate: _buildDate.toISOString().split('T')[0],
    buildNumber: _buildCounter,

    //=============toto se měnit nebude============
    codename: "Klubovna",

    //=============toto se měnit nebude============

  // SEZNAM VŠECH MODULŮ PRO FLEET REGISTER
    modules: [
        // --- HLAVNÍ KOSTRA ---
        './index.html',

        // --- CSS MODULY ---
        './style.css',
        './CSS-PROMENNE-prepisovany-z-Firestore.css',
        './APP-BODY.css',
        './APP-CONTAINER.css',
        './MAIN-CONTENT-AREA.css',
        './LCARS-HEADER.css',
        './LCARS-NAVIGACE.css',
        './LCARS-VSTUPY-A-TLACITKA.css',
        './LOGIN-SCREEN.css',
        './LOADING-SPLASH-SCREEN.css',
        './LOADING-SCREEN-zobrazuje-se-nez-Firebase-overi-prihlaseni.css',
        './DRUHA-VRSTVA-PRISTUPU-auth2Screen.css',
        './ZPRAVY.css',
        './CHAT-INPUT.css',
        './galerie.css',
        './gallery-slider.css',
        './moldarni-okna.css',
        './nastaveni.css',
        './SCROLLBARY-GLOBALNE.css',
        './zavinac-media-qstion.css',

        // --- NULTÉ POŘADÍ V POŘADÍ ---
        './fleet-register.js',

        // --- Musí se načíst PŘED všemi Firebase moduly ---
        './firebase-config.js',
        './firebase-messaging-sw.js',

        // --- JAVASCRIPT MODULY ---
        './script.js',
        './auth.js',
        './auth2.js',
        './chat.js',
        './nicknames.js',
        './notifications.js',
        './presence.js',
        './settings.js',
        './gallery.js',
        './gallery-slider.js'
    ]
};

//stímto se bude pracovat 2===========
// ═══════════════════════════════════════════════════════════════════════════
// 🖖 EXPORT PRO SERVICE WORKER A MANIFEST
// ═══════════════════════════════════════════════════════════════════════════
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FLEET_CONFIG;
}

if (typeof window !== 'undefined') {
    window.FLEET_CONFIG = FLEET_CONFIG;
}

// ═══════════════════════════════════════════════════════════════════════════
// 📡 FLEET STATUS LOGGER
// ═══════════════════════════════════════════════════════════════════════════
console.log(
    `%c🖖 USS PROMETHEUS - Fleet Registry v${FLEET_CONFIG.version}`,
    'color: #00FF00; font-size: 16px; font-weight: bold; background: #000; padding: 10px; border: 2px solid #00FF00;'
);
console.log(
    `%c   Kódové jméno: ${FLEET_CONFIG.codename}`,
    'color: #00CCFF; font-size: 12px;'
);
console.log(
    `%c   Datum buildu: ${FLEET_CONFIG.buildDate}`,
    'color: #00CCFF; font-size: 12px;'
);
console.log(
    `%c   Registrované moduly: ${FLEET_CONFIG.modules.length}`,
    'color: #FFCC00; font-size: 12px;'
);
console.log(
    `%c   Status: Všechny systémy zelené! ✅`,
    'color: #00FF00; font-size: 12px; font-weight: bold;'
);
console.log(
    `%c   🛠️ NOUZOVÝ RESET ČÍTAČE – zadej do konzole prohlížeče kdykoli potřebuješ: localStorage.setItem('uss_prometheus_build', '0');  `,
    'color: #00FF00; font-size: 12px; font-weight: bold;'
);

console.log(
    `%c   Projekt běží na: https://jirka22med.github.io/star-trek-hudebni-prehravac-vylepsen-4-mobilni/ ✅`,
    'color: #00FF00; font-size: 12px; font-weight: bold;'
);


console.log(
    `%c🚀 [fleet-register] Načteno za ${(performance.now() - __FLEET_REGISTER_START).toFixed(2)} ms`,
    'background: #000; color: #00ff00; font-weight: bold; padding: 2px;'
);

// ═══════════════════════════════════════════════════════════════════════════
// 🛠️ NOUZOVÝ RESET ČÍTAČE – zadej do konzole prohlížeče kdykoli potřebuješ:
// localStorage.setItem('uss_prometheus_build', '0');
// ═══════════════════════════════════════════════════════════════════════════
