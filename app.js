document.addEventListener("DOMContentLoaded", () => {
  console.log("App initialisiert...");

  const $ = (id) => document.getElementById(id);
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  const impulses = [
    "Atme tief ein. Du darfst gehalten sein.",
    "Du darfst langsam sein.",
    "Dein Herz kennt den Weg.",
    "Alles darf leicht werden.",
    "Du darfst in Sicherheit ankommen."
  ];

  // --- Navigation ---
  function showView(viewId) {
    ["ui-home", "ui-chooser", "ui-run"].forEach(id => {
      $(id).classList.add("hidden");
    });
    $(viewId).classList.remove("hidden");
    window.scrollTo(0, 0);
  }

  // --- Impuls Button ---
  if ($("btnImpuls")) {
    $("btnImpuls").addEventListener("click", () => {
      console.log("Neuer Impuls geklickt");
      const randomImpuls = impulses[Math.floor(Math.random() * impulses.length)];
      $("impuls").textContent = randomImpuls;
    });
  }

  // --- Auswahl Buttons ---
  if ($("btnContinue")) {
    $("btnContinue").addEventListener("click", () => showView("ui-chooser"));
  }
  if ($("btnBackFromChooser")) {
    $("btnBackFromChooser").addEventListener("click", () => showView("ui-home"));
  }

  // --- Situationen starten ---
  async function runSituation(n) {
    console.log("Starte Situation:", n);
    
    const s = window.SITUATIONS && window.SITUATIONS[n];
    if (!s) {
      console.error("Situation " + n + " nicht in window.SITUATIONS gefunden!");
      alert("Fehler: Situation " + n + " konnte nicht geladen werden.");
      return;
    }

    showView("ui-run");
    $("situationTitle").textContent = s.title;
    
    // Blöcke zurücksetzen
    ["b1", "b2", "b3"].forEach(id => $(id).classList.add("hidden"));
    
    // Hintergrundmusik starten
    const bg = $("bgMusic");
    if(bg) { bg.volume = 0.1; bg.play().catch(e => console.log("Audio Autoplay blockiert")); }

    // Sequenz abspielen
    await sleep(500);
    showBlock("b1", "t1", s.ankommenText);
  }

  async function showBlock(blockId, textId, text) {
    $(blockId).classList.remove("hidden");
    const el = $(textId);
    el.textContent = "";
    for (const char of text) {
      el.textContent += char;
      await sleep(50); // Schreibgeschwindigkeit
    }
  }

  // Event-Listener für Situations-Buttons 1 bis 9
  for (let i = 1; i <= 9; i++) {
    const btn = $("btnSituation" + i);
    if (btn) {
      btn.addEventListener("click", () => runSituation(i));
    }
  }

  // Zurück-Button im Run
  if ($("btnBackBottom")) {
    $("btnBackBottom").addEventListener("click", () => {
      const bg = $("bgMusic");
      if(bg) bg.pause();
      showView("ui-chooser");
    });
  }
});
