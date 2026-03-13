document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // --- Konfiguration ---
  const TYPING_SPEED = 80;      // Langsamer (vorher 50)
  const PAUSE_BETWEEN_BLOCKS = 3000; // 3 Sekunden Pause zum Atmen

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
      if($(id)) $(id).classList.add("hidden");
    });
    $(viewId).classList.remove("hidden");
    window.scrollTo(0, 0);
  }

  // --- Buttons im Chooser generieren (Damit alle 9 da sind) ---
  const list = $("situationsList");
  if (list) {
    list.innerHTML = ""; // Leeren
    for (let i = 1; i <= 9; i++) {
      const btn = document.createElement("button");
      btn.className = "situationBtn";
      btn.id = `btnSituation${i}`;
      btn.innerHTML = `
        <span class="headline">${i}) Situation ${i}</span>
        <span class="hint">Tippe hier, um die Übung zu starten.</span>
      `;
      btn.onclick = () => runSituation(i);
      list.appendChild(btn);
    }
  }

  // --- Schreibeffekt mit Rhythmus ---
  async function typeEffect(elementId, text) {
    const el = $(elementId);
    if (!el) return;
    el.textContent = "";
    for (const char of text) {
      el.textContent += char;
      // Bei Satzzeichen etwas länger warten für besseren Lesefluss
      const extraWait = [".", "!", "?"].includes(char) ? 400 : 0;
      await sleep(TYPING_SPEED + extraWait);
    }
  }

  // --- Die Haupt-Sequenz ---
  async function runSituation(n) {
    const s = window.SITUATIONS && window.SITUATIONS[n];
    if (!s) {
      alert("Inhalt für Situation " + n + " wird noch geladen oder fehlt.");
      return;
    }

    showView("ui-run");
    $("situationTitle").textContent = s.title;
    
    // Alles verstecken
    ["b1", "b2", "b3"].forEach(id => $(id).classList.add("hidden"));
    
    // 1. Block: Ankommen
    $( "b1").classList.remove("hidden");
    await typeEffect("t1", s.ankommenText);
    await sleep(PAUSE_BETWEEN_BLOCKS);

    // 2. Block: Erklärung (Falls vorhanden)
    if (s.erklaerungText) {
      $("b2").classList.remove("hidden");
      await typeEffect("t2", s.erklaerungText);
      await sleep(PAUSE_BETWEEN_BLOCKS);
    }

    // 3. Block: Affirmationen / Ritual
    if (s.affirmations || s.ritual) {
      $("b3").classList.remove("hidden");
      const listEl = $("t3");
      listEl.innerHTML = "";
      
      const items = s.affirmations || s.ritual;
      for (const item of items) {
        const li = document.createElement("li");
        li.style.marginBottom = "10px";
        listEl.appendChild(li);
        // Jede Affirmation einzeln tippen
        for (const char of item) {
          li.textContent += char;
          await sleep(TYPING_SPEED);
        }
        await sleep(1000);
      }
    }
    
    console.log("Sequenz beendet.");
  }

  // --- Home Events ---
  $("btnImpuls").onclick = () => {
    $("impuls").textContent = impulses[Math.floor(Math.random() * impulses.length)];
  };
  $("btnContinue").onclick = () => showView("ui-chooser");
  $("btnBackFromChooser").onclick = () => showView("ui-home");
  $("btnBackBottom").onclick = () => showView("ui-chooser");
});
