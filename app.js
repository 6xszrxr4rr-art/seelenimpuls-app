document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // --- Konfiguration ---
  const TYPING_SPEED = 60; // Sanftes Tempo
  const PAUSE_BETWEEN_BLOCKS = 3000; // Zeit zum Atmen

  const impulses = [
    "Atme tief ein. Du darfst gehalten sein.",
    "Du darfst langsam sein.",
    "Dein Herz kennt den Weg.",
    "Alles darf leicht werden.",
    "Du darfst in Sicherheit ankommen.",
    "Dein Atem ist dein Anker."
  ];

  // --- Hilfsfunktionen ---
  function showView(viewId) {
    ["ui-home", "ui-chooser", "ui-run"].forEach(id => {
      if($(id)) $(id).classList.add("hidden");
    });
    $(viewId).classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function scrollToBottom() {
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: 'smooth'
    });
  }

  // Verbessertes Tippen: Scrollt während des Schreibens mit
  async function typeEffect(elementId, text) {
    const el = $(elementId);
    if (!el) return;
    el.textContent = "";
    
    const words = text.split(" ");
    for (let i = 0; i < words.length; i++) {
      el.textContent += words[i] + " ";
      
      // Alle 4 Wörter sanft nachscrollen, damit der Text im Blick bleibt
      if (i % 4 === 0) scrollToBottom();
      
      // Pause bei Satzzeichen für natürlichen Rhythmus
      const char = words[i].slice(-1);
      const extraWait = [".", "!", "?", "—"].includes(char) ? 450 : 0;
      await sleep(TYPING_SPEED + extraWait);
    }
    scrollToBottom();
  }

  async function typeListEffect(listId, items) {
    const listEl = $(listId);
    if (!listEl || !items) return;
    listEl.innerHTML = "";
    
    for (const item of items) {
      const li = document.createElement("li");
      listEl.appendChild(li);
      
      const words = item.split(" ");
      for (const word of words) {
        li.textContent += word + " ";
        await sleep(TYPING_SPEED);
      }
      scrollToBottom();
      await sleep(1000); // Pause nach jedem Punkt
    }
  }

  // --- Kern-Logik: Die Übung ---
  async function runSituation(n) {
    const s = window.SITUATIONS && window.SITUATIONS[n];
    if (!s) {
      alert("Inhalt für Situation " + n + " wurde nicht gefunden.");
      return;
    }

    showView("ui-run");
    $("situationTitle").textContent = s.title;
    
    // Alles auf Anfang setzen
    ["b1", "b2", "b3", "b4", "b5"].forEach(id => $(id).classList.add("hidden"));
    $("breathBox").classList.add("hidden");
    $("audioContainer").innerHTML = "";

    const bg = $("bgMusic");
    if(bg) { bg.volume = 0.15; bg.play().catch(() => {}); }

    // 1. ANKOMMEN
    $("b1").classList.remove("hidden");
    await typeEffect("t1", s.ankommenText);
    await sleep(PAUSE_BETWEEN_BLOCKS);

    // 2. ERKLÄRUNG
    if (s.erklaerungText) {
      $("b2").classList.remove("hidden");
      await typeEffect("t2", s.erklaerungText);
      await sleep(PAUSE_BETWEEN_BLOCKS);
    }

    // --- NEU: ATEM-GUIDE (z.B. bei Situation 10 oder 1) ---
    // Wir aktivieren ihn automatisch, wenn es eine stressige Situation ist
    if (n == 1 || n == 2 || n == 10) {
      $("breathBox").classList.remove("hidden");
      scrollToBottom();
      await sleep(10000); // 10 Sekunden atmen lassen
      // Optional: Nach dem Atmen wieder ausblenden oder lassen
    }

    // 3. AFFIRMATIONEN
    if (s.affirmations) {
      $("b3").classList.remove("hidden");
      await typeListEffect("t3", s.affirmations);
      await sleep(PAUSE_BETWEEN_BLOCKS);
    }

    // 4. MINI-RITUAL
    if (s.ritual) {
      $("b4").classList.remove("hidden");
      await typeListEffect("t4", s.ritual);
      await sleep(PAUSE_BETWEEN_BLOCKS);
    }

    // 5. ABSCHLUSS & SONG
    if (s.songOutro) {
      $("b5").classList.remove("hidden");
      await typeEffect("t5", s.songOutro);
      
      if(s.songFile) {
        const songBtn = document.createElement("button");
        songBtn.className = "btn btn-primary";
        songBtn.style.marginTop = "20px";
        songBtn.innerHTML = "🎵 Gesungene Affirmation hören";
        songBtn.onclick = () => {
          if(bg) bg.pause();
          const audio = new Audio(s.songFile);
          audio.play();
          songBtn.disabled = true;
          songBtn.textContent = "Wird abgespielt...";
        };
        $("audioContainer").appendChild(songBtn);
        scrollToBottom();
      }
    }
  }

  // --- Event Listener ---

  // Neuer Impuls Button
  $("btnImpuls").onclick = () => {
    const text = impulses[Math.floor(Math.random() * impulses.length)];
    $("impuls").textContent = text;
  };

  // Navigation
  $("btnContinue").onclick = () => showView("ui-chooser");
  $("btnBackFromChooser").onclick = () => showView("ui-home");
  $("btnBackBottom").onclick = () => {
    const bg = $("bgMusic");
    if(bg) bg.pause();
    showView("ui-chooser");
  };

  // Die 10 Buttons aktivieren
  for (let i = 1; i <= 10; i++) {
    const btn = $("btnSituation" + i);
    if (btn) {
      btn.onclick = () => runSituation(i);
    }
  }
});
