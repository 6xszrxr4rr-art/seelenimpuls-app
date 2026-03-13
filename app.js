document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // --- Konfiguration ---
  const TYPING_SPEED = 75; // Sanftes, ruhiges Tempo
  const PAUSE_BLOCKS = 3000; // Zeit zum Nachspüren zwischen Abschnitten

  const impulses = [
    "Atme tief ein. Du darfst gehalten sein.",
    "Du darfst langsam sein.",
    "Dein Herz kennt den Weg.",
    "Alles darf leicht werden.",
    "Du darfst in Sicherheit ankommen."
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

  // --- Verbesserter Schreibeffekt (Verhindert das Wort-Springen) ---
  async function typeEffect(elementId, text) {
    const el = $(elementId);
    if (!el) return;
    
    el.textContent = "";
    const words = text.split(" ");
    
    for (let i = 0; i < words.length; i++) {
      const wordSpan = document.createElement("span");
      wordSpan.textContent = words[i] + " ";
      el.appendChild(wordSpan);
      
      // Sofort nach dem Hinzufügen des Wortes scrollen
      scrollToBottom();
      
      // Rhythmus-Pause
      let wait = TYPING_SPEED;
      if (words[i].includes(".") || words[i].includes("!") || words[i].includes("?")) {
        wait += 500;
      }
      await sleep(wait);
    }
  }

  async function typeListEffect(listId, items) {
    const listEl = $(listId);
    if (!listEl || !items) return;
    listEl.innerHTML = "";
    
    for (const item of items) {
      const li = document.createElement("li");
      listEl.appendChild(li);
      
      const words = item.split(" ");
      for (let word of words) {
        li.textContent += word + " ";
        scrollToBottom();
        await sleep(TYPING_SPEED);
      }
      await sleep(1000); // Pause nach jedem Listenpunkt
    }
  }

  // --- Kern-Logik: Die Übung ---
  async function runSituation(n) {
    const s = window.SITUATIONS && window.SITUATIONS[n];
    if (!s) return;

    showView("ui-run");
    
    // Reset der Ansicht
    ["b1", "b2", "b3", "b4", "b5"].forEach(id => $(id).classList.add("hidden"));
    $("breathBox").classList.add("hidden");
    $("audioContainer").innerHTML = "";

    const bg = $("bgMusic");
    if(bg) { bg.volume = 0.1; bg.play().catch(() => {}); }

    // 1. ANKOMMEN
    $("b1").classList.remove("hidden");
    await typeEffect("t1", s.ankommenText);
    await sleep(PAUSE_BLOCKS);

    // 2. EINBLICK / ERKLÄRUNG
    if (s.erklaerungText) {
      $("b2").classList.remove("hidden");
      await typeEffect("t2", s.erklaerungText);
      await sleep(PAUSE_BLOCKS);
    }

    // --- ATEM-GUIDE ---
    if (n == 1 || n == 2 || n == 10) {
      $("breathBox").classList.remove("hidden");
      scrollToBottom();
      await sleep(12000); 
    }

    // 3. KRAFTSÄTZE (AFFIRMATIONEN)
    if (s.affirmations) {
      $("b3").classList.remove("hidden");
      await typeListEffect("t3", s.affirmations);
      await sleep(PAUSE_BLOCKS);
    }

    // 4. MINI-RITUAL
    if (s.ritual) {
      $("b4").classList.remove("hidden");
      await typeListEffect("t4", s.ritual);
      await sleep(PAUSE_BLOCKS);
    }

    // 5. ABSCHLUSS & GESUNGENE AFFIRMATION
    if (s.songOutro) {
      $("b5").classList.remove("hidden");
      await typeEffect("t5", s.songOutro);
      
      if(s.songFile) {
        const container = $("audioContainer");
        
        // Button mit der neuen Beschriftung
        const songBtn = document.createElement("button");
        songBtn.className = "btn-primary";
        songBtn.style.marginTop = "20px";
        songBtn.innerHTML = "<span>🎵 Gesungene Affirmation hören</span>";
        
        songBtn.onclick = () => {
          if(bg) bg.pause();
          const audio = new Audio(s.songFile);
          audio.play();
          songBtn.disabled = true;
          songBtn.innerHTML = "<span>Wird abgespielt...</span>";
        };
        
        container.appendChild(songBtn);
        scrollToBottom();
      }
    }
  }

  // --- Event Listener ---

  $("btnImpuls").onclick = () => {
    $("impuls").textContent = impulses[Math.floor(Math.random() * impulses.length)];
  };

  $("btnContinue").onclick = () => showView("ui-chooser");
  $("btnBackFromChooser").onclick = () => showView("ui-home");
  
  // Übung beenden lädt die Seite neu für einen sauberen Reset
  $("btnBackBottom").onclick = () => location.reload();

  // Die 10 Buttons aktivieren
  for (let i = 1; i <= 10; i++) {
    const btn = $("btnSituation" + i);
    if (btn) {
      btn.onclick = () => runSituation(i);
    }
  }
});
