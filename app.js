// app.js (Controller) – stabil, sanft, Block für Block

document.addEventListener("DOMContentLoaded", () => {

  // ---------- Helper ----------
  const $ = (id) => document.getElementById(id);
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // ---------- Timing (sanfter) ----------
  const BETWEEN_BLOCKS_MS = 2200;
  const SMALL_PAUSE_MS = 900;
  const LINE_FADE_STAGGER_MS = 520;     // Textzeilen nacheinander
  const LIST_ITEM_STAGGER_MS = 700;     // Affirmationen/Ritual einzeln
  const SCROLL_MS = 1700;               // langsames Gleiten

  // ---------- Audio ----------
  const BG_TARGET_GAIN = 0.0085;
  const BG_FADE_MS = 2500;
  const BG_MAX_PLAY_MS = 180000;
  const SONG_TARGET_GAIN = 0.035;

  let runId = 0;
  let bgStopTimer = null;

  let audioCtx = null;
  let bgGain = null;
  let bgSource = null;
  let songGain = null;
  let songSource = null;

  function ensureAudioGraph(){
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    const bg = $("bgMusic");
    if (bg){
      bgSource = audioCtx.createMediaElementSource(bg);
      bgGain = audioCtx.createGain();
      bgGain.gain.value = 0;
      bgSource.connect(bgGain);
      bgGain.connect(audioCtx.destination);
    }

    const song = $("songPlayer");
    if (song){
      songSource = audioCtx.createMediaElementSource(song);
      songGain = audioCtx.createGain();
      songGain.gain.value = 0;
      songSource.connect(songGain);
      songGain.connect(audioCtx.destination);
    }
  }

  function fadeBgTo(targetGain, durationMs){
    if (!audioCtx || !bgGain) return;
    const now = audioCtx.currentTime;
    const dur = Math.max(0.05, durationMs / 1000);

    bgGain.gain.cancelScheduledValues(now);
    bgGain.gain.setValueAtTime(bgGain.gain.value, now);
    bgGain.gain.linearRampToValueAtTime(targetGain, now + dur);
  }

  async function startBgMusic(){
    const bg = $("bgMusic");
    if (!bg) return;

    ensureAudioGraph();

    if (audioCtx && audioCtx.state === "suspended") {
      try { await audioCtx.resume(); } catch(_) {}
    }

    try { bg.pause(); } catch(_) {}
    bg.currentTime = 0;
    bg.loop = false;
    bg.volume = 0.0001;

    try{
      await bg.play();
      fadeBgTo(BG_TARGET_GAIN, BG_FADE_MS);

      if (bgStopTimer) clearTimeout(bgStopTimer);
      bgStopTimer = setTimeout(() => stopBgMusic(true), BG_MAX_PLAY_MS);
    } catch(_){}
  }

  function stopBgMusic(fade){
    const bg = $("bgMusic");
    if (!bg) return;

    if (bgStopTimer) clearTimeout(bgStopTimer);
    bgStopTimer = null;

    if (!fade){
      fadeBgTo(0, 50);
      try { bg.pause(); } catch(_) {}
      return;
    }

    fadeBgTo(0, 900);
    setTimeout(() => { try { bg.pause(); } catch(_) {} }, 950);
  }

  function stopSong(){
    const song = $("songPlayer");
    if (!song) return;
    try { song.pause(); } catch(_) {}
    song.currentTime = 0;
    if (songGain) songGain.gain.value = 0;
  }

  // ---------- UI helpers ----------
  function show(id){ const el = $(id); if (el) el.classList.remove("hidden"); }
  function hide(id){ const el = $(id); if (el) el.classList.add("hidden"); }

  function clearAllBlocks(){
    ["b1","b2","b3","b4","b5"].forEach(id => hide(id));
    if ($("t1")) $("t1").innerHTML = "";
    if ($("t2")) $("t2").innerHTML = "";
    if ($("t3")) $("t3").innerHTML = "";
    if ($("t4")) $("t4").innerHTML = "";
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
    hide("topCard");
    hide("continueCard");
    hideChooser();

    show("backTopWrap");
    show("situationTitleCard");
    if ($("situationTitle")) $("situationTitle").textContent = s.title;

    hide("backBottomWrap");
  }

  function exitRunUI(){
    document.body.classList.remove("running");
    show("topCard");
    show("continueCard");
    hide("situationTitleCard");
    hide("backTopWrap");
    hide("backBottomWrap");
  }

  // ---------- Smooth scroll ----------
  function glideToElement(elOrId, duration = SCROLL_MS, offset = 0){
    const el = typeof elOrId === "string" ? document.getElementById(elOrId) : elOrId;
    if (!el) return Promise.resolve();

    const startY = window.scrollY;
    const rect = el.getBoundingClientRect();
    const targetY = startY + rect.top - offset;

    const start = performance.now();
    return new Promise(resolve => {
      function step(now){
        const t = Math.min(1, (now - start) / duration);
        const ease = 1 - Math.pow(1 - t, 3); // weich
        window.scrollTo(0, startY + (targetY - startY) * ease);
        if (t < 1) requestAnimationFrame(step);
        else resolve();
      }
      requestAnimationFrame(step);
    });
  }

  // ---------- Sanftes Einblenden (statt Schreibmaschine) ----------
  function splitToLines(text){
    // Absätze + Zeilenbrüche respektieren
    // Doppelte Umbrüche -> Leerzeile
    return (text || "")
      .replace(/\r\n/g, "\n")
      .split("\n");
  }

  async function revealTextLines(containerEl, text, myRun){
    if (!containerEl) return;
    containerEl.innerHTML = "";

    const lines = splitToLines(text);
    for (let i = 0; i < lines.length; i++){
      if (myRun !== runId) return;

      const line = lines[i];

      // Leerzeile = etwas Abstand
      if (line.trim() === ""){
        const spacer = document.createElement("div");
        spacer.style.height = "12px";
        containerEl.appendChild(spacer);
        await sleep(Math.max(260, LINE_FADE_STAGGER_MS / 2));
        continue;
      }

      const p = document.createElement("div");
      p.className = "line";
      p.textContent = line;
      containerEl.appendChild(p);

      // nächster Frame, dann "on" (für Transition)
      requestAnimationFrame(() => p.classList.add("on"));

      await sleep(LINE_FADE_STAGGER_MS);
    }
  }

  async function revealList(ul, items, myRun){
    if (!ul) return;
    ul.innerHTML = "";

    for (let idx = 0; idx < (items || []).length; idx++){
      if (myRun !== runId) return;

      const li = document.createElement("li");
      li.textContent = items[idx];
      ul.appendChild(li);

      requestAnimationFrame(() => li.classList.add("on"));
      await sleep(LIST_ITEM_STAGGER_MS);
    }
  }

  // ---------- Impuls ----------
  const impulses = [
    "Atme tief ein. Du darfst gehalten sein.",
    "Du darfst langsam sein.",
    "Dein Herz kennt den Weg.",
    "Alles darf leicht werden.",
    "Du darfst in Sicherheit ankommen."
  ];

  // ---------- Run situation ----------
  async function runSituation(n){
    runId++;
    const myRun = runId;

    clearAllBlocks();
    stopSong();
    stopBgMusic(false);

    const s = window.SITUATIONS && window.SITUATIONS[n];
    if (!s) {
      alert("Situation " + n + " nicht gefunden. Prüfe: situations/situation-" + n + ".js geladen?");
      return;
    }

    enterRunUI(s);

    // Song-Datei pro Situation (optional)
    const song = $("songPlayer");
    if (song && s.songFile) {
      const srcEl = song.querySelector("source");
      if (srcEl) {
        srcEl.src = s.songFile;
        song.load();
      }
    }

    // BG starten
    await startBgMusic();

    // -------- Block 1: Ankommen (oben starten: Back+Titel dürfen raus-scrollen) --------
    show("b1");
    await glideToElement("b1", SCROLL_MS, 0);
    await revealTextLines($("t1"), s.ankommenText, myRun);
    await sleep(BETWEEN_BLOCKS_MS);

    // -------- Block 2: Erklärung --------
    show("b2");
    // Nicht hart nach oben zerren – nur sanft Richtung Block, damit es ruhig bleibt
    await glideToElement("b2", SCROLL_MS, 0);
    await revealTextLines($("t2"), s.erklaerungText, myRun);
    await sleep(BETWEEN_BLOCKS_MS);

    // -------- Block 3: Affirmationen (soll oben starten) --------
    show("b3");
    await glideToElement("b3", SCROLL_MS, 0);
    await revealList($("t3"), s.affirmations, myRun);
    await sleep(SMALL_PAUSE_MS);

    // -------- Block 4: Mini-Ritual (kleine Pause) --------
    show("b4");
    await glideToElement("b4", SCROLL_MS, 0);
    await revealList($("t4"), s.ritual, myRun);
    await sleep(BETWEEN_BLOCKS_MS);

    // -------- Block 5: Gesungene Affirmation (bleibt UNTEN unter Ritual – NICHT nach oben schieben) --------
    show("b5");
    // Kein Scroll hier! Damit Ritual lesbar bleibt und Button darunter steht.

    // Outro (dominanter)
    const outro = s.songOutro;
    if (outro) {
      const p = document.createElement("div");
      p.className = "songOutro";
      p.textContent = outro;

      // unter den Button
      $("b5").appendChild(p);
    }

    // Back unten an
    show("backBottomWrap");

    // BG später ausblenden
    setTimeout(() => stopBgMusic(true), 45000);
  }

  // ---------- Wiring ----------
  const btnImpuls = $("btnImpuls");
  const impulsEl = $("impuls");
  const btnSong = $("btnSong");
  const btnContinue = $("btnContinue");

  // Situation wählen Button: schneller zeigen (4s statt 8s)
  if (btnContinue){
    btnContinue.classList.add("hidden");
    setTimeout(() => {
      btnContinue.classList.remove("hidden");
    }, 4000);

    btnContinue.addEventListener("click", () => {
      showChooser();
      // sanft zur Liste
      const chooseCard = $("chooseCard");
      if (chooseCard){
        const y = window.scrollY + chooseCard.getBoundingClientRect().top - 12;
        window.scrollTo({ top: y, behavior: "smooth" });
      }
    });
  }

  if (btnImpuls && impulsEl) {
    btnImpuls.addEventListener("click", () => {
      impulsEl.textContent = impulses[Math.floor(Math.random() * impulses.length)];
    });
  }

  function goBack(){
    runId++; // laufende Animationen stoppen
    clearAllBlocks();
    exitRunUI();
    showChooser();
    stopSong();
    stopBgMusic(true);
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  const btnBackTop = $("btnBackTop");
  const btnBackBottom = $("btnBackBottom");
  if (btnBackTop) btnBackTop.addEventListener("click", goBack);
  if (btnBackBottom) btnBackBottom.addEventListener("click", goBack);

  // Situation 1–9 Buttons
  for (let i = 1; i <= 9; i++){
    const btn = $(`btnSituation${i}`);
    if (btn) btn.addEventListener("click", () => runSituation(i));
  }

  // Song Button: BG stop + Song Gain Fade-in
  if (btnSong){
    btnSong.addEventListener("click", async () => {
      stopBgMusic(false);

      const song = $("songPlayer");
      if (!song) return;

      ensureAudioGraph();

      if (audioCtx && audioCtx.state === "suspended") {
        try { await audioCtx.resume(); } catch(_) {}
      }

      try{
        song.pause();
        song.currentTime = 0;
        song.volume = 1.0;

        if (songGain) songGain.gain.value = 0.01;
        await song.play();

        if (songGain){
          const now = audioCtx.currentTime;
          songGain.gain.cancelScheduledValues(now);
          songGain.gain.setValueAtTime(songGain.gain.value, now);
          songGain.gain.linearRampToValueAtTime(SONG_TARGET_GAIN, now + 1.2);
        }
      } catch(_){}
    });
  }

});
