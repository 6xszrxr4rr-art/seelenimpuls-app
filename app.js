document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  const TYPING_SPEED = 50; 
  const PAUSE_BETWEEN_BLOCKS = 2500;

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

  async function typeEffect(elementId, text) {
    const el = $(elementId);
    if (!el) return;
    el.textContent = "";
    for (const char of text) {
      el.textContent += char;
      const pause = [".", "!", "?", "—"].includes(char) ? 400 : 0;
      await sleep(TYPING_SPEED + pause);
    }
  }

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
      scrollToBottom();
      await sleep(800);
    }
  }

  async function runSituation(n) {
    const s = window.SITUATIONS && window.SITUATIONS[n];
    if (!s) return;

    showView("ui-run");
    $("situationTitle").textContent = s.title;
    
    // Alle Blöcke zurücksetzen
    ["b1", "b2", "b3", "b4", "b5"].forEach(id => {
      if($(id)) $(id).classList.add("hidden");
    });
    $("t3").innerHTML = "";
    $("t4").innerHTML = "";

    const bg = $("bgMusic");
    if(bg) { bg.volume = 0.1; bg.play().catch(() => {}); }

    // 1. ANKOMMEN
    $("b1").classList.remove("hidden");
    await typeEffect("t1", s.ankommenText);
    scrollToBottom();
    await sleep(PAUSE_BETWEEN_BLOCKS);

    // 2. ERKLÄRUNG
    if (s.erklaerungText) {
      $("b2").classList.remove("hidden");
      await typeEffect("t2", s.erklaerungText);
      scrollToBottom();
      await sleep(PAUSE_BETWEEN_BLOCKS);
    }

    // 3. AFFIRMATIONEN
    if (s.affirmations && s.affirmations.length > 0) {
      $("b3").classList.remove("hidden");
      await typeListEffect("t3", s.affirmations);
      await sleep(PAUSE_BETWEEN_BLOCKS);
    }

    // 4. MINI-RITUAL (Wichtig: Greift auf s.ritual zu)
    if (s.ritual && s.ritual.length > 0) {
      $("b4").classList.remove("hidden");
      await typeListEffect("t4", s.ritual);
      scrollToBottom();
      await sleep(PAUSE_BETWEEN_BLOCKS);
    }

    // 5. ABSCHLUSS / SONG-OUTRO
    if (s.songOutro) {
      $("b5").classList.remove("hidden");
      // Hier setzen wir den Text UND einen Button für den Song ein
      $("t5").innerHTML = `<p>${s.songOutro}</p>`;
      
      if(s.songFile) {
          const songBtn = document.createElement("button");
          songBtn.className = "btn btn-primary";
          songBtn.style.marginTop = "20px";
          songBtn.textContent = "🎵 Gesungene Affirmation hören";
          songBtn.onclick = () => {
              if(bg) bg.pause(); // Hintergrundmusik stoppen
              const audio = new Audio(s.songFile);
              audio.play();
              songBtn.disabled = true;
              songBtn.textContent = "Spiele...";
          };
          $("t5").appendChild(songBtn);
      }
      scrollToBottom();
    }
  }

  // Event Listener
  if($("btnImpuls")) {
    $("btnImpuls").onclick = () => {
      $("impuls").textContent = impulses[Math.floor(Math.random() * impulses.length)];
    };
  }

  if($("btnContinue")) $("btnContinue").onclick = () => showView("ui-chooser");
  if($("btnBackFromChooser")) $("btnBackFromChooser").onclick = () => showView("ui-home");
  if($("btnBackBottom")) $("btnBackBottom").onclick = () => {
    if($("bgMusic")) $("bgMusic").pause();
    showView("ui-chooser");
  };

  for (let i = 1; i <= 10; i++) {
    const btn = $("btnSituation" + i);
    if (btn) btn.onclick = () => runSituation(i);
  }
});
