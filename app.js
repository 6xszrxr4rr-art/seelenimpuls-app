document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // --- Konfiguration ---
  const TYPING_SPEED = 70;           // Schön entspanntes Tempo
  const PAUSE_BETWEEN_BLOCKS = 3500; // Zeit zum Atmen zwischen den Abschnitten

  const impulses = [
    "Atme tief ein. Du darfst gehalten sein.",
    "Du darfst langsam sein.",
    "Dein Herz kennt den Weg.",
    "Alles darf leicht werden.",
    "Du darfst in Sicherheit ankommen."
  ];

  // --- Ansichten umschalten ---
  function showView(viewId) {
    ["ui-home", "ui-chooser", "ui-run"].forEach(id => {
      const el = $(id);
      if (el) el.classList.add("hidden");
    });
    $(viewId).classList.remove("hidden");
    window.scrollTo(0, 0);
  }

  // --- Der Schreib-Effekt ---
  async function typeEffect(elementId, text) {
    const el = $(elementId);
    if (!el) return;
    el.textContent = "";
    for (const char of text) {
      el.textContent += char;
      // Pause bei Satzzeichen für echtes "Atmen" im Text
      const punctuationPause = [".", "!", "?", "—"].includes(char) ? 450 : 0;
      await sleep(TYPING_SPEED + punctuationPause);
    }
  }

  // --- Listen-Effekt (für Affirmationen & Ritual) ---
  async function typeListEffect(listId, items) {
    const listEl = $(listId);
    if (!listEl || !items) return;
    listEl.innerHTML = "";
    
    for (const item of items) {
      const li = document.createElement("li");
      listEl.appendChild(li);
      for (const char of item) {
        li.textContent += char;
        await sleep(TYPING_SPEED);
      }
      await sleep(1200); // Kurze Pause nach jedem Listenpunkt
    }
  }

  // --- DIE HAUPT-SEQUENZ (Hier lag der Fehler) ---
  async function runSituation(n) {
    const s = window.SITUATIONS && window.SITUATIONS[n];
    if (!s) {
      alert("Inhalt für Situation " + n + " fehlt noch.");
      return;
    }

    showView("ui-run");
    $("situationTitle").textContent = s.title;
    
    // Alles auf Anfang setzen
    ["b1", "b2", "b3"].forEach(id => $(id).classList.add("hidden"));
    $("t3").innerHTML = "";

    // Hintergrundmusik starten
    const bg = $("bgMusic");
    if(bg) { bg.volume = 0.1; bg.play().catch(() => {}); }

    // SCHRITT 1: Ankommen
    $("b1").classList.remove("hidden");
    await typeEffect("t1", s.ankommenText);
    await sleep(PAUSE_BETWEEN_BLOCKS);

    // SCHRITT 2: Erklärung (nur wenn in Datei vorhanden)
    if (s.erklaerungText) {
      $("b2").classList.remove("hidden");
      await typeEffect("t2", s.erklaerungText);
      await sleep(PAUSE_BETWEEN_BLOCKS);
    }

    // SCHRITT 3: Affirmationen ODER Ritual
    // Wir prüfen, was in der .js Datei steht und zeigen es in b3 an
    if (s.affirmations || s.ritual) {
      $("b3").classList.remove("hidden");
      const contentToShow = s.affirmations ? s.affirmations : s.ritual;
      await typeListEffect("t3", contentToShow);
    }
    
    console.log("Situation " + n + " vollständig angezeigt.");
  }

  // --- Event Listener ---

  // Impuls-Button
  if($("btnImpuls")) {
    $("btnImpuls").onclick = () => {
      $("impuls").textContent = impulses[Math.floor(Math.random() * impulses.length)];
    };
  }

  // Navigation
  if($("btnContinue")) $("btnContinue").onclick = () => showView("ui-chooser");
  if($("btnBackFromChooser")) $("btnBackFromChooser").onclick = () => showView("ui-home");
  if($("btnBackBottom")) $("btnBackBottom").onclick = () => {
    const bg = $("bgMusic");
    if(bg) bg.pause();
    showView("ui-chooser");
  };

  // Klicks für alle 10 Situations-Buttons aktivieren
  for (let i = 1; i <= 10; i++) {
    const btn = $("btnSituation" + i);
    if (btn) {
      btn.onclick = () => runSituation(i);
    }
  }
});
