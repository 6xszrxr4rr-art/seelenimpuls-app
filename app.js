document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // --- Zurück zum perfekten Tempo vom Anfang ---
  const TYPING_SPEED = 50; // Zeit pro Buchstabe (ms)
  const PAUSE_BLOCKS = 3000;

  const impulses = [
    "Atme tief ein. Du darfst gehalten sein.",
    "Du darfst langsam sein.",
    "Dein Herz kennt den Weg.",
    "Alles darf leicht werden.",
    "Du darfst in Sicherheit ankommen."
  ];

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

  // --- Der bewährte Zeichen-für-Zeichen Effekt ---
  async function typeEffect(elementId, text) {
    const el = $(elementId);
    if (!el) return;
    el.textContent = "";
    
    for (let i = 0; i < text.length; i++) {
      el.textContent += text[i];
      
      // Nur alle paar Zeichen scrollen, um das "Rasen" zu verhindern
      if (i % 5 === 0) scrollToBottom();
      
      let wait = TYPING_SPEED;
      // Kurze Pause bei Satzzeichen für natürlichen Rhythmus
      if ([".", "!", "?", ","].includes(text[i])) {
        wait = 800;
        scrollToBottom(); 
      }
      await sleep(wait);
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
      
      for (let i = 0; i < item.length; i++) {
        li.textContent += item[i];
        if (i % 5 === 0) scrollToBottom();
        await sleep(TYPING_SPEED);
      }
      await sleep(1500); // Zeit zum Lesen nach jedem Punkt
    }
  }

  async function runSituation(n) {
    const s = window.SITUATIONS && window.SITUATIONS[n];
    if (!s) return;

    showView("ui-run");
    ["b1", "b2", "b3", "b4", "b5"].forEach(id => $(id).classList.add("hidden"));
    $("breathBox").classList.add("hidden");
    $("audioContainer").innerHTML = "";

    const bg = $("bgMusic");
    if(bg) { bg.volume = 0.1; bg.play().catch(() => {}); }

    // 1. ANKOMMEN
    $("b1").classList.remove("hidden");
    await typeEffect("t1", s.ankommenText);
    await sleep(PAUSE_BLOCKS);

    // 2. EINBLICK
    if (s.erklaerungText) {
      $("b2").classList.remove("hidden");
      await typeEffect("t2", s.erklaerungText);
      await sleep(PAUSE_BLOCKS);
    }

    // 3. ATEM-GUIDE (Optional bei Stress-Situationen)
    if (n == 1 || n == 2 || n == 10) {
      $("breathBox").classList.remove("hidden");
      scrollToBottom();
      await sleep(12000); 
    }

    // 4. KRAFTSÄTZE
    if (s.affirmations) {
      $("b3").classList.remove("hidden");
      await typeListEffect("t3", s.affirmations);
      await sleep(PAUSE_BLOCKS);
    }

    // 5. MINI-RITUAL
    if (s.ritual) {
      $("b4").classList.remove("hidden");
      await typeListEffect("t4", s.ritual);
      await sleep(PAUSE_BLOCKS);
    }

    // 6. ABSCHLUSS & GESUNGENE AFFIRMATION
    if (s.songOutro) {
      $("b5").classList.remove("hidden");
      await typeEffect("t5", s.songOutro);
      
      if(s.songFile) {
        const container = $("audioContainer");
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

  // --- Navigation & Buttons ---
  $("btnImpuls").onclick = () => {
    $("impuls").textContent = impulses[Math.floor(Math.random() * impulses.length)];
  };

  $("btnContinue").onclick = () => showView("ui-chooser");
  $("btnBackFromChooser").onclick = () => showView("ui-home");
  $("btnBackBottom").onclick = () => location.reload();

  for (let i = 1; i <= 10; i++) {
    const btn = $("btnSituation" + i);
    if (btn) btn.onclick = () => runSituation(i);
  }
});
