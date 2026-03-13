document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  const TYPING_SPEED = 60; 
  const PAUSE_BETWEEN_BLOCKS = 3000;

  function showView(viewId) {
    ["ui-home", "ui-chooser", "ui-run"].forEach(id => {
      if($(id)) $(id).classList.add("hidden");
    });
    $(viewId).classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Automatischer Scroll nach unten
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
      scrollToBottom(); // Scrollt nach jeder Zeile mit
      await sleep(1000);
    }
  }

  async function runSituation(n) {
    const s = window.SITUATIONS && window.SITUATIONS[n];
    if (!s) return;

    showView("ui-run");
    $("situationTitle").textContent = s.title;
    
    // Alle Blöcke leeren und verstecken
    ["b1", "b2", "b3", "b4", "b5"].forEach(id => {
      if($(id)) $(id).classList.add("hidden");
    });

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
    if (s.affirmations) {
      $("b3").classList.remove("hidden");
      await typeListEffect("t3", s.affirmations);
      await sleep(PAUSE_BETWEEN_BLOCKS);
    }

    // 4. RITUAL (Neu: Block b4)
    if (s.ritual) {
      $("b4").classList.remove("hidden");
      await typeListEffect("t4", s.ritual);
      await sleep(PAUSE_BETWEEN_BLOCKS);
    }

    // 5. AUDIO OUTRO (Neu: Block b5)
    if (s.songOutro) {
      $("b5").classList.remove("hidden");
      await typeEffect("t5", s.songOutro);
      scrollToBottom();
    }
  }

  // Event Listener (Schleife bis 10)
  for (let i = 1; i <= 10; i++) {
    const btn = $("btnSituation" + i);
    if (btn) btn.onclick = () => runSituation(i);
  }

  $("btnImpuls").onclick = () => { /* Impuls Logik */ };
  $("btnContinue").onclick = () => showView("ui-chooser");
  $("btnBackFromChooser").onclick = () => showView("ui-home");
  $("btnBackBottom").onclick = () => {
    if($("bgMusic")) $("bgMusic").pause();
    showView("ui-chooser");
  };
});
