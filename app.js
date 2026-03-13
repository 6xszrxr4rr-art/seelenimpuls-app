document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  const TYPING_SPEED = 75; // Sanftes Tempo für gute Lesbarkeit
  const PAUSE_BLOCKS = 3000;

  function scrollToBottom() {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }

  async function typeEffect(elementId, text) {
    const el = $(elementId);
    if (!el) return;
    el.textContent = "";
    const words = text.split(" ");
    for (let word of words) {
      el.textContent += word + " ";
      scrollToBottom(); // Scrollt aktiv bei jedem Wort mit
      let wait = TYPING_SPEED;
      if (word.includes(".") || word.includes("!")) wait += 500;
      await sleep(wait);
    }
  }

  async function typeListEffect(listId, items) {
    const listEl = $(listId);
    if (!listEl) return;
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

    // View wechseln
    $("ui-home").classList.add("hidden");
    $("ui-chooser").classList.add("hidden");
    $("ui-run").classList.remove("hidden");
    window.scrollTo(0,0);

    ["b1", "b2", "b3", "b4", "b5"].forEach(id => $(id).classList.add("hidden"));
    $("breathBox").classList.add("hidden");
    $("audioContainer").innerHTML = "";

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

    // ATEMPAUSE (z.B. für Situation 10)
    if (n == 10 || n == 1) {
      $("breathBox").classList.remove("hidden");
      scrollToBottom();
      await sleep(12000); 
    }

    // 3. KRAFTSÄTZE
    if (s.affirmations) {
      $("b3").classList.remove("hidden");
      await typeListEffect("t3", s.affirmations);
      await sleep(PAUSE_BLOCKS);
    }

    // 4. RITUAL
    if (s.ritual) {
      $("b4").classList.remove("hidden");
      await typeListEffect("t4", s.ritual);
      await sleep(PAUSE_BLOCKS);
    }

    // 5. ABSCHLUSS
    if (s.songOutro) {
      $("b5").classList.remove("hidden");
      await typeEffect("t5", s.songOutro);
      if(s.songFile) {
        const btn = document.createElement("button");
        btn.className = "btn-primary";
        btn.style.marginTop = "20px";
        btn.innerHTML = "🎵 Affirmation hören";
        btn.onclick = () => new Audio(s.songFile).play();
        $("audioContainer").appendChild(btn);
        scrollToBottom();
      }
    }
  }

  // Navigation
  $("btnContinue").onclick = () => { $("ui-home").classList.add("hidden"); $("ui-chooser").classList.remove("hidden"); };
  $("btnBackFromChooser").onclick = () => { $("ui-chooser").classList.add("hidden"); $("ui-home").classList.remove("hidden"); };
  $("btnBackBottom").onclick = () => location.reload(); // Sauberster Reset

  for (let i = 1; i <= 10; i++) {
    const b = $("btnSituation" + i);
    if (b) b.onclick = () => runSituation(i);
  }
});
