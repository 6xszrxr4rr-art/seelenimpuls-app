document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // --- Meditative Konfiguration ---
  const WORD_SPEED = 280; // Zeit pro Wort (langsamer für sanftes Lesen)
  const PAUSE_SENTENCE = 1200; // Lange Pause nach einem Punkt
  const PAUSE_COMMA = 600; // Kurze Pause zum Luftholen
  const PAUSE_BETWEEN_BLOCKS = 3500; // Viel Zeit zwischen den Abschnitten

  async function typeEffect(elementId, text) {
    const el = $(elementId);
    if (!el) return;
    el.textContent = "";
    el.style.opacity = "1";
    
    const words = text.split(" ");
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      el.textContent += word + " ";
      
      // Sanftes Mit-Scrollen bei jedem Wort
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });

      // Rhythmus-Check: Wie endet das Wort?
      let delay = WORD_SPEED;
      if (word.includes(".")) delay = PAUSE_SENTENCE;
      else if (word.includes("!") || word.includes("?")) delay = PAUSE_SENTENCE;
      else if (word.includes(",")) delay = PAUSE_COMMA;

      await sleep(delay);
    }
    // Kurzes Verweilen am Ende des Textes
    await sleep(1000);
  }

  async function typeListEffect(listId, items) {
    const listEl = $(listId);
    if (!listEl || !items) return;
    listEl.innerHTML = "";
    
    for (const item of items) {
      const li = document.createElement("li");
      li.style.opacity = "0"; // Startet unsichtbar
      listEl.appendChild(li);
      
      // Sanftes Einblenden des Listenpunkts
      li.style.transition = "opacity 1.5s ease";
      setTimeout(() => li.style.opacity = "1", 50);

      const words = item.split(" ");
      for (const word of words) {
        li.textContent += word + " ";
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        
        let delay = WORD_SPEED;
        if (word.includes(".")) delay = PAUSE_SENTENCE;
        await sleep(delay);
      }
      await sleep(1500); // Pause nach jedem Punkt
    }
  }

  async function runSituation(n) {
    const s = window.SITUATIONS && window.SITUATIONS[n];
    if (!s) return;

    // View wechseln & Titel setzen
    ["ui-home", "ui-chooser"].forEach(id => $(id).classList.add("hidden"));
    $("ui-run").classList.remove("hidden");
    $("situationTitle").textContent = s.title;
    
    // Reset
    ["b1", "b2", "b3", "b4", "b5"].forEach(id => $(id).classList.add("hidden"));
    $("breathBox").classList.add("hidden");
    $("audioContainer").innerHTML = "";
    window.scrollTo(0,0);

    const bg = $("bgMusic");
    if(bg) { bg.volume = 0.15; bg.play().catch(() => {}); }

    // Ablauf mit viel Raum zum Wirken
    
    // 1. ANKOMMEN
    $("b1").classList.remove("hidden");
    await typeEffect("t1", s.ankommenText);
    await sleep(PAUSE_BETWEEN_BLOCKS);

    // 2. EINBLICK (ERKLÄRUNG)
    if (s.erklaerungText) {
      $("b2").classList.remove("hidden");
      await typeEffect("t2", s.erklaerungText);
      await sleep(PAUSE_BETWEEN_BLOCKS);
    }

    // --- ATEM-GUIDE ---
    if (n == 1 || n == 2 || n == 10) {
      $("breathBox").classList.remove("hidden");
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      await sleep(12000); // Zeit zum Atmen
    }

    // 3. KRAFTSÄTZE
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
        songBtn.innerHTML = "<span>🎵 Gesungene Affirmation hören</span>";
        songBtn.onclick = () => {
          if(bg) bg.pause();
          const audio = new Audio(s.songFile);
          audio.play();
          songBtn.disabled = true;
          songBtn.innerHTML = "<span>Spielt...</span>";
        };
        $("audioContainer").appendChild(songBtn);
        setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 300);
      }
    }
  }

  // Navigation & Impuls
  $("btnImpuls").onclick = () => {
    $("impuls").textContent = impulses[Math.floor(Math.random() * impulses.length)];
  };
  $("btnContinue").onclick = () => {
    $("ui-home").classList.add("hidden");
    $("ui-chooser").classList.remove("hidden");
  };
  $("btnBackFromChooser").onclick = () => {
    $("ui-chooser").classList.add("hidden");
    $("ui-home").classList.remove("hidden");
  };
  $("btnBackBottom").onclick = () => location.reload();

  for (let i = 1; i <= 10; i++) {
    const btn = $("btnSituation" + i);
    if (btn) btn.onclick = () => runSituation(i);
  }
});
