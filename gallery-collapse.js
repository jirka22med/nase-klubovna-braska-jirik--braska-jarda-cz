const __gallery_collapse_START = performance.now();

// gallery-collapse.js — LCARS Messenger | Galerie: SBALOVACÍ PANELY
// Samostatný modul — přidá rozbalovací/sbalovací tlačítko na lištu
// pro přidání obrázku i lištu pro přidání videa. Šetří místo na mobilu.
// Nic nemění v žádném HTML souboru, jen obaluje existující
// .gallery-add-bar a .gallery-video-add-bar (z gallery-video.js)
// vlastním wrapperem.
//
// Připojit v index.html (doporučeně AŽ ZA gallery-video.js):
//   <link rel="stylesheet" href="gallery-collapse.css">
//   <script type="module" src="gallery-collapse.js"></script>
// (modul se inicializuje sám, nic dalšího volat netřeba)

function inicializovatSbalovaciPanely() {
  const sekceGalerie = document.getElementById("sekce-galerie");
  if (!sekceGalerie) return; // GALERIE sekce v HTML neexistuje — modul se neaktivuje

  // ── Obrázková lišta — je v HTML hned od startu ──
  const obrazkovaBar = document.querySelector(".gallery-add-bar");
  if (obrazkovaBar) obalitSbalovacimPanelem(obrazkovaBar, "🖼️ PŘIDAT OBRÁZEK");

  // ── Video lišta — injektuje ji gallery-video.js, může přijít později ──
  const videoBarHned = document.getElementById("galleryVideoAddBar");
  if (videoBarHned) {
    obalitSbalovacimPanelem(videoBarHned, "🎬 PŘIDAT VIDEO");
  } else {
    const pozorovatel = new MutationObserver(() => {
      const bar = document.getElementById("galleryVideoAddBar");
      if (bar) {
        obalitSbalovacimPanelem(bar, "🎬 PŘIDAT VIDEO");
        pozorovatel.disconnect();
      }
    });
    pozorovatel.observe(sekceGalerie, { childList: true });
  }
}

document.addEventListener("DOMContentLoaded", inicializovatSbalovaciPanely);

// ════════════════════════════════════════════════════════════════
//  OBALIT LIŠTU SBALOVACÍM PANELEM S HLAVIČKOU
// ════════════════════════════════════════════════════════════════
function obalitSbalovacimPanelem(bar, popisek) {
  if (bar.closest(".gallery-collapse-wrap")) return; // už obalené — nedělat dvakrát

  const wrap = document.createElement("div");
  wrap.className = "gallery-collapse-wrap";

  const hlavicka = document.createElement("button");
  hlavicka.type = "button";
  hlavicka.className = "gallery-collapse-header";
  hlavicka.innerHTML = `<span>${popisek}</span><span class="gallery-collapse-sipka">▾</span>`;

  bar.parentNode.insertBefore(wrap, bar);
  wrap.appendChild(hlavicka);
  wrap.appendChild(bar);
  bar.classList.add("gallery-collapse-body");

  hlavicka.addEventListener("click", () => {
    wrap.classList.toggle("gallery-collapse-open");
  });
}


// ⏱️ LOG END
console.log(`%c🚀 [gallery-collapse] Načteno za ${(performance.now() - __gallery_collapse_START).toFixed(2)} ms`, 'background: #000; color: #00ff00; font-weight: bold; padding: 2px;');
