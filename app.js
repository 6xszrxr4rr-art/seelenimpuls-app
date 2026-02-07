// app.js
document.addEventListener("DOMContentLoaded", () => {

  const $ = (id) => document.getElementById(id);
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  function show(id){ const el=$(id); if(el) el.classList.remove("hidden"); }
  function hide(id){ const el=$(id); if(el) el.classList.add("hidden"); }

  // sanftes Scrollen (langsam, kein Ruck)
  function glideToId(id, duration = 1800, offset = 0){
    const el = $(id);
    if (!el) return Promise.resolve();

    const startY = window.scrollY;
    const targetY = startY + el.getBoundingClientRect().top - offset;
    const start = performance.now();

    return new Promise(resolve => {
      function ease(t){ return 1 - Math.pow(1 - t, 3); }
      function step(now){
        const t = Math.min(1, (now - start) / duration);
        window.scrollTo(0, startY + (targetY - startY) * ease(t));
        if (t < 1) requestAnimationFrame(step);
        else resolve();
      }
      requestAnimationFrame(step);
    });
  }

  // Text nicht mehr "Schreibmaschine": Zeilen weich einblenden
  async function revealText(el, text, gapMs = 380){
    if (!el) return;
    el.innerHTML = "";
    const lines = (text || "").split("\n");

    for (const raw of lines){
      const line = document.createElement("div");
      line.className = "line";
      line.innerHTML = raw.trim() ? raw : "&nbsp;";
      el.appendChild(line);

      // nächster Frame, dann animieren
      requestAnimationFrame(() => line.classList.add("on"));
      await sleep(gapMs);
    }
  }

  async function revealList(ul, items, gapMs = 420){
    if (!ul) return;
    ul.innerHTML = "";

    for (const item of (items || [])){
      const li = document.createElement("li");
      li.className = "line";
      li.textContent = item;
      ul.appendChild(li);
      requestAnimationFrame(() => li.classList.add("on"));
      await sleep(gapMs);
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

  // ---------- Audio (wie gehabt, minimal stabil) ----------
  const BG_MAX_PLAY_MS = 180000;
  let bgStopTimer = null;

  let audioCtx = null;
  let bgGain = null;
  let bgSource = null;
  let songGain = null;
  let songSource = null;

  const BG_TARGET_GAIN = 0.0085;
  const SONG_TARGET_GAIN = 0.035;

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

  function fadeGain(gainNode, target, ms){
    if (!audioCtx || !gainNode) return;
    const now = audioCtx.currentTime;
    const dur = Math.max(0.05, ms / 1000);
    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setValueAtTime(gainNode.gain.value, now);
    gainNode.gain.linearRampToValueAtTime(target, now + dur);
  }

  async function startBgMusic(){
    const bg = $("bgMusic");
    if (!bg) return;

    ensureAudioGraph();
    if (audioCtx && audioCtx.state === "suspended") { try { await audioCtx.resume(); } catch(_){} }

    try { bg.pause(); } catch(_){}
    bg.currentTime = 0;
    bg.loop = false;
    bg.volume = 0.0001;

    try{
      await bg.play();
      fadeGain(bgGain, BG_TARGET_GAIN, 2000);

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
      fadeGain(bgGain, 0, 50);
      try { bg.pause(); } catch(_){}
      return;
    }
    fadeGain(bgGain, 0, 900);
    setTimeout(() => { try { bg.pause(); } catch(_){} }, 950);
  }

  function stopSong(){
    const song = $("songPlayer");
    if (!song) return;
    try { song.pause(); } catch(_){}
    song.currentTime = 0;
    if (songGain) songGain.gain.value = 0;
  }

  // ---------- UI state ----------
  let runId = 0;

  function clearBlocks(){
    ["b1","b2","b3","b4","b5"].forEach(hide);
    if ($("t1")) $("t1").innerHTML = "";
    if ($("t2")) $("t2").innerHTML = "";
    if ($("t3")) $("t3").innerHTML = "";
    if ($("t4")) $("t4").innerHTML = "";
    // Outro entfernen
    const b5 = $("b5");
    if (b5){
      const old = b5.querySelector(".songOutro");
      if (old) old.remove();
    }
  }

  function enterRunUI(s){
    document.body.classList.add("running");

    hide("topCard");
    hide("continueCard");
    hide("chooseHintCard");
    hide("chooseCard");

    show("backTopWrap");
    const titleEl = $("situationTitle");
    if (titleEl) titleEl.textContent = s.title || "";
    show("situationTitleCard");

    hide("backBottomWrap");
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function exitRunUI(){
    document.body.classList.remove("running");

    show("topCard");
    show("continueCard");

    hide("situationTitleCard");
    hide("backTopWrap");
    hide("backBottomWrap");
  }

  function showChooser(){
    show("chooseHintCard");
    show("chooseCard");
  }

  function goBack(){
    runId++;
    stopSong();
    stopBgMusic(true);
    clearBlocks();
    exitRunUI();
    showChooser();
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  // ---------- Run ----------
  async function runSituation(n){
    runId++;
    const myRun = runId;

    clearBlocks();
    stopSong();
    stopBgMusic(false);

    const s = window.SITUATIONS && window.SITUATIONS[n];
    if (!s) { alert("Situation " + n + " nicht gefunden."); return; }

    enterRunUI(s);

    // Song pro Situation setzen
    const song = $("songPlayer");
    if (song && s.songFile){
      const srcEl = song.querySelector("source");
      if (srcEl){ srcEl.src = s.songFile; song.load(); }
    }

    await startBgMusic();

    // Block 1: soll GANZ oben starten -> wir scrollen b1 an TOP (Back+Titel sind dann per Scroll erreichbar)
    show("b1");
    await glideToId("b1", 1700, 0);
    if (myRun !== runId) return;
    await revealText($("t1"), s.ankommenText, 360);
    await sleep(1600);

    // Block 2 normal weiter
    show("b2");
    await revealText($("t2"), s.erklaerungText, 360);
    await sleep(1400);

    // Block 3: soll GANZ oben starten (wo vorher der Zurück-Button war)
    show("b3");
    await glideToId("b3", 1700, 0);
    if (myRun !== runId) return;
    await revealList($("t3"), s.affirmations, 420);
    await sleep(1400);

    // Block 4 normal
    show("b4");
    await revealList($("t4"), s.ritual, 420);
    await sleep(1400);

    // Block 5: NICHT hochschieben! -> bleibt unter Ritual stehen
    show("b5");

    // Outro unter dem Button: dominanter Endimpuls
    if (s.songOutro){
      const p = document.createElement("p");
      p.className = "songOutro";
      p.textContent = s.songOutro;
      $("b5").appendChild(p);
      requestAnimationFrame(() => p.classList.add("on"));
    }

    show("backBottomWrap");

    setTimeout(() => stopBgMusic(true), 45000);
  }

  // ---------- Wiring ----------
  const btnImpuls = $("btnImpuls");
  const impulsEl = $("impuls");
  const btnContinue = $("btnContinue");
  const btnSong = $("btnSong");

  if (btnImpuls && impulsEl){
    btnImpuls.addEventListener("click", () => {
      impulsEl.textContent = impulses[Math.floor(Math.random() * impulses.length)];
    });
  }

  // Situation wählen: schneller einblenden (ca. 3–4s)
  if (btnContinue){
    btnContinue.classList.add("hidden");
    setTimeout(() => {
      btnContinue.classList.remove("hidden");
    }, 3800);

    btnContinue.addEventListener("click", () => showChooser());
  }

  // Back Buttons
  const btnBackTop = $("btnBackTop");
  const btnBackBottom = $("btnBackBottom");
  if (btnBackTop) btnBackTop.addEventListener("click", goBack);
  if (btnBackBottom) btnBackBottom.addEventListener("click", goBack);

  // Situation Buttons
  for (let i=1;i<=9;i++){
    const b = $(`btnSituation${i}`);
    if (b) b.addEventListener("click", () => runSituation(i));
  }

  // Song Button: BG stop + Song Fade-in
  if (btnSong){
    btnSong.addEventListener("click", async () => {
      stopBgMusic(false);

      const song = $("songPlayer");
      if (!song) return;

      ensureAudioGraph();
      if (audioCtx && audioCtx.state === "suspended") { try { await audioCtx.resume(); } catch(_){} }

      try{
        song.pause();
        song.currentTime = 0;
        song.volume = 1.0;

        if (songGain) songGain.gain.value = 0.01;
        await song.play();

        fadeGain(songGain, SONG_TARGET_GAIN, 1200);
      } catch(_){}
    });
  }

});
