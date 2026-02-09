// app.js (Controller)

document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // ---------------- UI helpers ----------------
  function show(id){ const el = $(id); if (el) el.classList.remove("hidden"); }
  function hide(id){ const el = $(id); if (el) el.classList.add("hidden"); }

  function clearBlocks(){
    ["b1","b2","b3","b4","b5","backBottomWrap"].forEach(hide);
    if ($("t1")) $("t1").textContent = "";
    if ($("t2")) $("t2").textContent = "";
    if ($("t3")) $("t3").innerHTML = "";
    if ($("t4")) $("t4").innerHTML = "";
    // Outro aus b5 entfernen (falls vorhanden)
    const b5 = $("b5");
    if (b5){
      const old = b5.querySelector(".songOutro");
      if (old) old.remove();
    }
  }

  function hideChooser(){
    hide("chooseHintCard");
    hide("chooseCard");
  }

  function showChooser(){
    show("chooseHintCard");
    show("chooseCard");
  }

  function enterRunUI(s){
  document.body.classList.add("running");

  const topSpacer = document.getElementById("topSpacer");
  if (topSpacer) topSpacer.classList.add("hidden");   // ✅ statt remove

  hide("topCard");
  hide("continueCard");
  hideChooser();

  show("backTopWrap");
  show("situationTitleCard");
  if ($("situationTitle")) $("situationTitle").textContent = s.title;

  hide("backBottomWrap");

  window.scrollTo({ top: 0, behavior: "auto" });
}

  function exitRunUI(){
  const topSpacer = document.getElementById("topSpacer");
  if (topSpacer) topSpacer.classList.remove("hidden"); // ✅ richtig

  document.body.classList.remove("running");
  show("topCard");
  show("continueCard");
  hide("situationTitleCard");
  hide("backTopWrap");
  hide("backBottomWrap");
}

  // ---------------- Smooth scroll ----------------
  function glideToElement(elOrId, duration = 900, offset = 0){
    const el = typeof elOrId === "string" ? document.getElementById(elOrId) : elOrId;
    if (!el) return Promise.resolve();

    const startY = window.scrollY;
    const targetY = startY + el.getBoundingClientRect().top - offset;

    const start = performance.now();
    return new Promise(resolve => {
      function step(now){
        const t = Math.min(1, (now - start) / duration);
        const ease = 1 - Math.pow(1 - t, 3);
        window.scrollTo(0, startY + (targetY - startY) * ease);
        if (t < 1) requestAnimationFrame(step);
        else resolve();
      }
      requestAnimationFrame(step);
    });
  }

  // ---------------- Typing ----------------
  const CHAR_DELAY_MS = 140;
  const BETWEEN_BLOCKS_MS = 3000;
  const AFTER_RITUAL_MS = 5000;

  let runId = 0;

  async function typeText(el, text, myRun){
    if (!el) return;
    el.textContent = "";
    const str = String(text || "");
    for (let i = 0; i < str.length; i++){
      if (myRun !== runId) return;
      el.textContent += str[i];
      await sleep(CHAR_DELAY_MS);
    }
  }

  async function typeList(ul, items, myRun){
    if (!ul) return;
    ul.innerHTML = "";
    const arr = Array.isArray(items) ? items : [];
    for (const item of arr){
      if (myRun !== runId) return;
      const li = document.createElement("li");
      ul.appendChild(li);
      const str = String(item || "");
      for (let i = 0; i < str.length; i++){
        if (myRun !== runId) return;
        li.textContent += str[i];
        await sleep(CHAR_DELAY_MS);
      }
      await sleep(450);
    }
  }

  // ---------------- Audio ----------------
  const BG_MAX_PLAY_MS = 180000;
  let bgStopTimer = null;

  function stopBgMusic(){
    const bg = $("bgMusic");
    if (!bg) return;
    if (bgStopTimer) clearTimeout(bgStopTimer);
    bgStopTimer = null;
    try { bg.pause(); } catch(_) {}
  }

  async function startBgMusic(){
    const bg = $("bgMusic");
    if (!bg) return;
    stopBgMusic();
    bg.currentTime = 0;
    bg.volume = 0.08; // leise, aber hörbar
    try{
      await bg.play();
      bgStopTimer = setTimeout(() => stopBgMusic(), BG_MAX_PLAY_MS);
    } catch(_){}
  }

  function stopSong(){
    const song = $("songPlayer");
    if (!song) return;
    try { song.pause(); } catch(_) {}
    song.currentTime = 0;
  }

  // ---------------- Run Situation ----------------
  async function runSituation(n){
    runId++;
    const myRun = runId;

    const topSpacer = document.getElementById("topSpacer");
if (topSpacer) topSpacer.classList.add("hidden");
    
    clearBlocks();
    stopSong();
    stopBgMusic();

    const s = window.SITUATIONS && window.SITUATIONS[n];
    if (!s){
      alert("Situation " + n + " nicht gefunden.");
      return;
    }

    enterRunUI(s);

    // Song-Datei aus Situation setzen (wenn vorhanden)
    const song = $("songPlayer");
    if (song && s.songFile){
      const src = song.querySelector("source");
      if (src){
        src.src = s.songFile;
        song.load();
      }
    }

    await startBgMusic();

    // Block 1 – ganz nach oben
    show("b1");
    await glideToElement("b1", 650, 0);
    await typeText($("t1"), s.ankommenText, myRun);
    await sleep(BETWEEN_BLOCKS_MS);

    // Block 2 – normal weitermachen (kein Top-Zwang)
    show("b2");
    await typeText($("t2"), s.erklaerungText, myRun);
    await sleep(BETWEEN_BLOCKS_MS);

    // Block 3 – Affirmationen: MUSS ganz oben starten (Zurück-Button scrollt raus)
    show("b3");
    await glideToElement("b3", 650, 0);
    await typeList($("t3"), s.affirmations, myRun);
    await sleep(BETWEEN_BLOCKS_MS);

    // Block 4 – Ritual normal
    show("b4");
    await typeList($("t4"), s.ritual, myRun);
    await sleep(AFTER_RITUAL_MS);

    // Block 5 – Gesungene Affirmation:
    // WICHTIG: NICHT nach oben scrollen! (Ritual bleibt lesbar, Button bleibt drunter)
    show("b5");

    // Outro darunter (dominanter)
    if (s.songOutro){
      const p = document.createElement("p");
      p.className = "songOutro";
      p.textContent = s.songOutro;
      $("b5").appendChild(p);
    }

    // Zurück unten erst am Ende einblenden
    show("backBottomWrap");
  }

  // ---------------- Kopf / Impuls ----------------
  const impulses = [
    "Atme tief ein. Du darfst gehalten sein.",
    "Du darfst langsam sein.",
    "Dein Herz kennt den Weg.",
    "Alles darf leicht werden.",
    "Du darfst in Sicherheit ankommen."
  ];

  const btnImpuls = $("btnImpuls");
  const impulsEl = $("impuls");
  if (btnImpuls && impulsEl){
    btnImpuls.addEventListener("click", () => {
      impulsEl.textContent = impulses[Math.floor(Math.random()*impulses.length)];
    });
  }

  // "Situation wählen" früher einblenden (2,5 Sekunden)
  const btnContinue = $("btnContinue");
  if (btnContinue){
    btnContinue.classList.add("hidden");
    setTimeout(() => btnContinue.classList.remove("hidden"), 2500);
    btnContinue.addEventListener("click", () => showChooser());
  }

  // Zurück-Buttons
  function goBack(){
    runId++;
    clearBlocks();
    exitRunUI();
    showChooser();
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  const btnBackTop = $("btnBackTop");
  const btnBackBottom = $("btnBackBottom");
  if (btnBackTop) btnBackTop.addEventListener("click", goBack);
  if (btnBackBottom) btnBackBottom.addEventListener("click", goBack);

  // Situation 1–9 Buttons
  for (let i = 1; i <= 9; i++){
    const btn = $(`btnSituation${i}`);
    if (btn){
      btn.addEventListener("click", () => runSituation(i));
    }
  }

  // Song Button
  const btnSong = $("btnSong");
  if (btnSong){
    btnSong.addEventListener("click", async () => {
      stopBgMusic();
      const song = $("songPlayer");
      if (!song) return;
      try{
        song.currentTime = 0;
        song.volume = 1.0;
        await song.play();
      } catch(_){}
    });
  }
});
