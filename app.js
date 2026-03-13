document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // --- Sanftes Schreibtempo wie am Anfang ---
  const SPEED = 65; 

  async function typeEffect(elementId, text) {
    const el = $(elementId);
    if (!el) return;
    el.textContent = "";
    for (let char of text) {
      el.textContent += char;
      // Scrollt bei jedem Zeichen sanft nach unten
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      await sleep(SPEED);
      if ([".", "!", "?"].includes(char)) await sleep(800);
    }
  }

  async function typeListEffect(listId, items) {
    const listEl = $(listId);
    if (!listEl) return;
    listEl.innerHTML = "";
    for (let item of items) {
      const li = document.createElement("li");
      listEl.appendChild(li);
      for (let char of item) {
        li.textContent += char;
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        await sleep(SPEED);
      }
      await sleep(1000);
    }
  }

  async function runSituation(n) {
    const s = window.SITUATIONS && window.SITUATIONS[n];
    if (!s) return;

    $("ui-home").classList.add("hidden");
    $("ui-chooser").classList.add("hidden");
    $("ui-run").classList.remove("hidden");
    
    ["b1", "b2", "b3", "b4", "b5"].forEach(id => $(id).classList.add("hidden"));
    $("breathBox").classList.add("hidden");
    $("audioContainer").innerHTML = "";

    // 1. ANKOMMEN
    $("b1").classList.remove("hidden");
    await typeEffect("t1", s.ankommenText);
    await sleep(2000);

    // 2. EINBLICK
    if (s.erklaerungText) {
      $("b2").classList.remove("hidden");
      await typeEffect("t2", s.erklaerungText);
      await sleep(2000);
    }

    // 3. KRAFTSÄTZE
    if (s.affirmations) {
      $("b3").classList.remove("hidden");
      await typeListEffect("t3", s.affirmations);
      await sleep(2000);
    }

    // 4. RITUAL
    if (s.ritual) {
      $("b4").classList.remove("hidden");
      await typeListEffect("t4", s.ritual);
      await sleep(2000);
    }

    // 5. ABSCHLUSS
    if (s.songOutro) {
      $("b5").classList.remove("hidden");
      await typeEffect("t5", s.songOutro);
      
      if (s.songFile) {
        const btn = document.createElement("button");
        btn.className = "btn-primary";
        btn.innerHTML = "🎵 Affirmation hören";
        btn.onclick = () => { new Audio(s.songFile).play(); btn.disabled = true; };
        $("audioContainer").appendChild(btn);
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }
    }
  }

  // Menü-Logik
  $("btnImpuls").onclick = () => {
    const list = ["Atme tief ein.", "Du darfst langsam sein.", "Alles wird gut."];
    $("impuls").textContent = list[Math.floor(Math.random()*list.length)];
  };
  $("btnContinue").onclick = () => $("ui-chooser").classList.remove("hidden") + $("ui-home").classList.add("hidden");
  $("btnBackFromChooser").onclick = () => $("ui-home").classList.remove("hidden") + $("ui-chooser").classList.add("hidden");
  $("btnBackBottom").onclick = () => location.reload();

  for (let i = 1; i <= 10; i++) {
    const b = $("btnSituation" + i);
    if (b) b.onclick = () => runSituation(i);
  }
});
