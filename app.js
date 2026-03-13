document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  const TYPING_SPEED = 70; // Meditatives, sanftes Tempo
  const PAUSE_BETWEEN_BLOCKS = 3000;

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
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }

  // Sanfter Schreibeffekt: Scrollt bei JEDEM Wort mit
  async function typeEffect(elementId, text) {
    const el = $(elementId);
    if (!el) return;
    el.textContent = "";
    const words = text.split(" ");
    for (let i = 0; i < words.length; i++) {
      el.textContent += words[i] + " ";
      scrollToBottom(); // Wichtig: Schiebt den Text beim Einblick aktiv hoch
      
      let pause = TYPING_SPEED;
      if (words[i].includes(".") || words[i].includes("!")) pause += 400;
      await sleep(pause);
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
      for (let word of words) {
        li.textContent += word + " ";
        scrollToBottom();
        await sleep(TYPING_SPEED);
      }
      await sleep(1000);
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
    await sleep(PAUSE_BETWEEN_BLOCKS);

    // 2. EINBLICK
    if (s.erklaerungText) {
      $("b2").classList.remove("hidden");
      await typeEffect("t2", s.erklaerungText);
      await sleep(PAUSE_BETWEEN_BLOCKS);
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
        const btn = document.createElement("button");
        btn.className = "btn-primary";
        btn.style.marginTop = "20px";
        btn.innerHTML = "🎵 Affirmation hören";
        btn.onclick = () => { if(bg) bg.pause(); new Audio(s.songFile).play(); btn.disabled = true; };
        $("audioContainer").appendChild(btn);
        scrollToBottom();
      }
    }
  }

  // Events
  $("btnImpuls").onclick = () => {
    $("impuls").textContent = impulses[Math.floor(Math.random() * impulses.length)];
  };
  $("btnContinue").onclick = () => showView("ui-chooser");
  $("btnBackFromChooser").onclick = () => showView("ui-home");
  $("btnBackBottom").onclick = () => { if($("bgMusic")) $("bgMusic").pause(); showView("ui-chooser"); };

  for (let i = 1; i <= 10; i++) {
    const btn = $("btnSituation" + i);
    if (btn) btn.onclick = () => runSituation(i);
  }
});
