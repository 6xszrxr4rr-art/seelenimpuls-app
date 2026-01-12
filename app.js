window.onerror = function (msg, src, line, col) {
  alert("JS-Fehler: " + msg + " @ Zeile " + line + ":" + col);
};

document.addEventListener("DOMContentLoaded", () => {

  // ---------- Helper ----------
  const $ = (id) => document.getElementById(id);
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // --- sanftes Mit-Scrollen während des Tippens ---
  let lastScrollTs = 0;

function followWhileTyping(cursorEl){
  if (!cursorEl) return;

  const now = performance.now();
  if (now - lastScrollTs < 40) return; // ruhig & stabil
  lastScrollTs = now;

  const r = cursorEl.getBoundingClientRect();

  // Cursor bleibt immer auf gleicher Bildschirmhöhe
  const fixedY = window.innerHeight * 0.72;

  const cursorY = r.top + (r.height * 0.6);
  const diff = cursorY - fixedY;

  if (diff > 0) {
    window.scrollBy({ top: diff, behavior: "auto" });
  }
}

  function show(id){
    const el = $(id);
    if (!el) return;
    el.classList.remove("hidden");
  }

  function autoScrollTo(id){
    const el = $(id);
    if (!el) return;
    const y = window.scrollY + el.getBoundingClientRect().top - (window.innerHeight * 0.18);
    window.scrollTo({ top: y, behavior: "auto" });
  }

  function clearAllBlocks(){
    ["b1","b2","b3","b4","b5"].forEach(id => {
      const el = $(id);
      if (el) el.classList.add("hidden");
    });
    if ($("t1")) $("t1").innerHTML = "";
    if ($("t2")) $("t2").innerHTML = "";
    if ($("t3")) $("t3").innerHTML = "";
    if ($("t4")) $("t4").innerHTML = "";
  }

  // ---------- Inhalte ----------
  const impulses = [
    "Atme tief ein. Du musst heute nichts halten.",
    "Du darfst langsam sein.",
    "Dein Herz kennt den Weg.",
    "Alles darf leicht sein.",
    "Du musst nicht kämpfen, um sicher zu sein."
  ];

  const ankommenText =
    "Du bist hier.\n\n" +
    "Nichts drängt.\n" +
    "Nichts will gelöst werden.\n\n" +
    "Du darfst für einen Moment anhalten\n" +
    "und wahrnehmen,\n" +
    "dass dieser Augenblick gerade genug ist.";

  const erklaerungText =
    "Innere Unruhe entsteht oft dann,\n" +
    "wenn dein Inneres schneller ist als der Moment.\n\n" +
    "Gedanken kreisen,\n" +
    "der Körper bleibt angespannt,\n" +
    "auch wenn keine unmittelbare Gefahr da ist.\n\n" +
    "Dein Nervensystem sucht nicht nach Antworten.\n" +
    "Es sucht nach Sicherheit.\n\n" +
    "Diese kleinen Impulse laden dich ein,\n" +
    "wieder in deinem Körper anzukommen\n" +
    "und dem inneren Tempo sanft zu begegnen.";

  const affirmationItems = [
    "Ich darf langsamer werden.",
    "Ich bin jetzt hier.",
    "Ich bin getragen in diesem Moment."
  ];

  const ritualItems = [
    "Lass deinen Atem ruhig einströmen.",
    "Und lass ihn wieder hinausfließen – ein wenig länger, ein wenig weicher.",
    "Spüre, wie dein Körper gehalten wird.",
    "Der Boden unter dir. Die Fläche, die dich trägt.",
    "Mit jedem Ausatmen darf ein wenig Spannung gehen.",
    "Nicht alles. Nur so viel, wie jetzt möglich ist.",
    "Und dann bleibe hier noch einen Moment.",
    "Ohne etwas verändern zu müssen."
  ];

  // ---------- Timing ----------
  const CHAR_DELAY_MS = 110;
  const BETWEEN_BLOCKS_MS = 3000;
  const AFTER_RITUAL_MS = 5000;

  // ---------- Audio ----------
  const BG_TARGET_GAIN = 0.0085;
  const BG_FADE_MS = 2500;
  const BG_MAX_PLAY_MS = 180000;
  const SONG_TARGET_GAIN = 0.04;

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

  // ---------- Typing: Zeilen vorher umbrechen (kein Springen), dann buchstabenweise ----------
  function wrapTextToLines(text, el) {
    const style = getComputedStyle(el);
    const font = style.font || `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;

    const canvas = wrapTextToLines._c || (wrapTextToLines._c = document.createElement("canvas"));
    const ctx = canvas.getContext("2d");
    ctx.font = font;

    const paddingLeft = parseFloat(style.paddingLeft || "0");
    const paddingRight = parseFloat(style.paddingRight || "0");
    const maxWidth = el.clientWidth - paddingLeft - paddingRight;

    const paragraphs = (text || "").split("\n");
    const lines = [];

    for (const para of paragraphs) {
      if (!para.trim()) { lines.push(""); continue; }

      const words = para.split(/\s+/).filter(Boolean);
      let line = "";

      for (const w of words) {
        const test = line ? (line + " " + w) : w;

        if (ctx.measureText(test).width <= maxWidth) {
          line = test;
        } else {
          if (line) lines.push(line);

          if (ctx.measureText(w).width > maxWidth) {
            let chunk = "";
            for (const ch of w) {
              const t = chunk + ch;
              if (ctx.measureText(t).width <= maxWidth) chunk = t;
              else { if (chunk) lines.push(chunk); chunk = ch; }
            }
            line = chunk;
          } else {
            line = w;
          }
        }
      }
      if (line) lines.push(line);
    }

    return lines;
  }

  async function typeText(el, text, myRun){
    if (!el) return;

    el.innerHTML = "";
    const lines = wrapTextToLines(text, el);

    const cursor = document.createElement("span");
    cursor.className = "cursor";
    el.appendChild(cursor);

    for (let li = 0; li < lines.length; li++){
      if (myRun !== runId) return;
      const line = lines[li];

      for (let i = 0; i < line.length; i++){
        if (myRun !== runId) return;
        cursor.insertAdjacentText("beforebegin", line[i]);
        followWhileTyping(cursor);
        await sleep(CHAR_DELAY_MS);
      }

      if (li < lines.length - 1) {
  cursor.insertAdjacentHTML("beforebegin", "<br>");

  // ✅ Falls die nächste Zeile leer ist: sanft "nachlaufen" lassen
  if (lines[li + 1] === "") {
    for (let k = 0; k < 8; k++) {
      followWhileTyping(cursor);
      await sleep(CHAR_DELAY_MS);
    }
  } else {
    followWhileTyping(cursor);
    await sleep(Math.max(120, CHAR_DELAY_MS * 2));
  }
}
  }

  async function typeList(ul, items, myRun){
    if (!ul) return;
    ul.innerHTML = "";

    for (const item of items){
      if (myRun !== runId) return;

      const li = document.createElement("li");
      ul.appendChild(li);

      // BUCHSTABENWEISE, aber Scroll folgt ruhig
      for (let i = 0; i < item.length; i++){
        if (myRun !== runId) return;
        li.textContent += item[i];
        if (i % 6 === 0) followWhileTyping(li);
        await sleep(CHAR_DELAY_MS);
      }

      await sleep(600);
    }

    followWhileTyping(ul);
  }

  // ---------- UI Wiring ----------
  const btnImpuls = $("btnImpuls");
  const btnSituation1 = $("btnSituation1");
  const btnSong = $("btnSong");
  const impulsEl = $("impuls");

  if (!btnImpuls || !btnSituation1 || !btnSong || !impulsEl) {
    alert("Fehler: Ein Button/Element fehlt im HTML (IDs prüfen: btnImpuls, btnSituation1, btnSong, impuls).");
    return;
  }

  btnImpuls.addEventListener("click", () => {
    impulsEl.textContent = impulses[Math.floor(Math.random() * impulses.length)];
  });

  btnSituation1.addEventListener("click", async () => {
    runId++;
    const myRun = runId;

    clearAllBlocks();
    stopSong();
    stopBgMusic(false);
    await startBgMusic();

    show("b1");
    autoScrollTo("b1");
    await typeText($("t1"), ankommenText, myRun);
    await sleep(BETWEEN_BLOCKS_MS);

    show("b2");
    await typeText($("t2"), erklaerungText, myRun);
    await sleep(BETWEEN_BLOCKS_MS);

    show("b3");
    await typeList($("t3"), affirmationItems, myRun);
    await sleep(BETWEEN_BLOCKS_MS);

    show("b4");
    await typeList($("t4"), ritualItems, myRun);
    await sleep(AFTER_RITUAL_MS);

    show("b5");
autoScrollTo("b5");   // einmal sauber hinsetzen
lockScroll = true;    // ✅ ab jetzt NICHT mehr mitscrollen

    setTimeout(() => stopBgMusic(true), 45000);
  });

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

      if (songGain) songGain.gain.value = 0.02;

      await song.play();

      if (songGain){
        const now = audioCtx.currentTime;
        songGain.gain.cancelScheduledValues(now);
        songGain.gain.setValueAtTime(songGain.gain.value, now);
        songGain.gain.linearRampToValueAtTime(SONG_TARGET_GAIN, now + 1.2);
      }
    } catch(_){
      try{
        song.muted = true;
        await song.play();
        song.muted = false;
      } catch(__) {}
    }
  });

});
