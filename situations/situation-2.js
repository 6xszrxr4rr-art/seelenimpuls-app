// Optional: Fehler sofort zeigen
window.onerror = function (msg, src, line, col) {
  alert("JS-Fehler: " + msg + " @ Zeile " + line + ":" + col);
};

document.addEventListener("DOMContentLoaded", () => {

  // ---------- Helper ----------
  const $ = (id) => document.getElementById(id);
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // ---------- Scroll / Follow ----------
  let lastScrollTs = 0;
  let lockScroll = false;

  function followWhileTyping(cursorEl){
    if (!cursorEl || lockScroll) return;

    const now = performance.now();
    if (now - lastScrollTs < 80) return;
    lastScrollTs = now;

    const r = cursorEl.getBoundingClientRect();
    const fixedY = window.innerHeight * 0.72;
    const cursorY = r.top + (r.height * 0.6);
    const diff = cursorY - fixedY;

    if (diff > 0) {
      window.scrollBy({ top: Math.min(14, diff), behavior: "auto" });
    }
  }

  function show(id){
    const el = $(id);
    if (!el) return;
    el.classList.remove("hidden");
  }

  function snapToTop(id){
    const el = $(id);
    if (!el) return;
    const y = window.scrollY + el.getBoundingClientRect().top - 12;
    window.scrollTo({ top: y, behavior: "auto" });
  }

  function clearAllBlocks(){
    lockScroll = false;
    ["b1","b2","b3","b4","b5"].forEach(id => {
      const el = $(id);
      if (el) el.classList.add("hidden");
    });
    if ($("t1")) $("t1").innerHTML = "";
    if ($("t2")) $("t2").innerHTML = "";
    if ($("t3")) $("t3").innerHTML = "";
    if ($("t4")) $("t4").innerHTML = "";
  }

  // ---------- Impuls (Kopfkarte) ----------
  const impulses = [
    "Atme tief ein. Du musst heute nichts halten.",
    "Du darfst langsam sein.",
    "Dein Herz kennt den Weg.",
    "Alles darf leicht sein.",
    "Du darfst in Sicherheit ankommen."
  ];

  // ---------- Situationen (1 & 2) ----------
  // Hintergrundmusik bleibt gleich, Song je Situation verschieden.
  // ⚠️ Bitte den Song-Dateinamen für Situation 2 nach deinem Export benennen.
  const situations = {
    s1: {
      title: "Innere Unruhe &\nGedankenkarussell",
      hint: "Tippe hier, um sanft zu starten (mit sehr leiser Hintergrundmusik).",
      ankommen:
        "Du bist hier.\n\n" +
        "Dieser Moment trägt dich.\n" +
        "Du darfst weich werden.\n\n" +
        "Atme ruhig weiter.\n" +
        "Spüre: Jetzt ist genug.\n" +
        "Jetzt ist Raum.",
      erklaerung:
        "Innere Unruhe ist oft ein wertvoller Hinweis.\n\n" +
        "Gedanken bewegen sich schnell,\n" +
        "der Körper bleibt aufmerksam.\n\n" +
        "Dein Nervensystem sucht Sicherheit.\n" +
        "Es lädt dich ein, wieder im Körper anzukommen.\n\n" +
        "Diese Impulse unterstützen dich dabei,\n" +
        "Tempo zu lösen\n" +
        "und in dir ruhiger zu werden.",
      affirmationen: [
        "Ich darf langsamer werden.",
        "Ich bin jetzt hier.",
        "Ich bin getragen in diesem Moment."
      ],
      ritual: [
        "Stelle beide Füße bewusst auf den Boden.",
        "Spüre den Kontakt zum Boden und das Gewicht deines Körpers.",
        "Atme ruhig ein.",
        "Lass das Ausatmen etwas länger werden als das Einatmen.",
        "Spüre, wo die Unruhe gerade am stärksten ist.",
        "Lege eine Hand auf diese Stelle oder halte sie dort innerlich.",
        "Mit dem Ausatmen darf dort ein wenig Weite entstehen.",
        "Stelle dir vor, du trittst innerlich einen Schritt aus dem Gedankenkarussell heraus.",
        "Sage innerlich: „Ich komme zurück in diesen Moment.“",
        "Bleibe noch drei ruhige Atemzüge bei Boden, Atem und diesem Satz."
      ],
      songSrc: "audio/held-within.mp3"
    },

    s2: {
      title: "Überforderung &\ninnerer Druck",
      hint: "Tippe hier, wenn gerade vieles gleichzeitig da ist.",
      ankommen:
        "Du bist hier.\n\n" +
        "Dein Körper darf kurz ankommen.\n\n" +
        "Vielleicht ist gerade vieles gleichzeitig da.\n" +
        "Gedanken. Aufgaben. Erwartungen.\n\n" +
        "Du musst nichts sortieren.\n" +
        "Du darfst einfach hier sein.\n\n" +
        "Einen Moment lang.\n" +
        "Genau so, wie es jetzt ist.",
      erklaerung:
        "Überforderung entsteht oft nicht durch ein einzelnes Thema.\n\n" +
        "Sondern durch die Menge.\n" +
        "Zu viele Eindrücke.\n" +
        "Zu viele innere To-dos.\n\n" +
        "Der Körper bleibt dabei oft in Bereitschaft.\n" +
        "Als müsste gleich etwas erledigt werden.\n\n" +
        "Dabei sucht dein Nervensystem gerade etwas anderes:\n" +
        "Übersicht.\n" +
        "Entlastung.\n" +
        "Ein Signal von „Es ist genug für diesen Moment.“\n\n" +
        "Diese Impulse laden dich ein,\n" +
        "den inneren Druck sanft zu lockern\n" +
        "und wieder mehr Raum im eigenen Tempo zu finden.",
      affirmationen: [
        "Ich darf Schritt für Schritt gehen.",
        "Ich darf loslassen, was ich gerade nicht halten möchte.",
        "Ich darf mir Raum lassen."
      ],
      ritual: [
        "Stelle beide Füße bewusst auf den Boden.",
        "Spüre den Kontakt zum Boden und das Gewicht deines Körpers.",
        "Atme ruhig ein.",
        "Lass das Ausatmen etwas länger werden als das Einatmen.",
        "Spüre, wo der Druck oder die Enge gerade sitzt.",
        "Lege eine Hand auf diese Stelle oder halte sie dort innerlich.",
        "Mit dem Ausatmen darf dort ein wenig Weite entstehen.",
        "Stelle dir vor, du trittst innerlich einen Schritt aus dem Kreis der Anforderungen heraus.",
        "Sage innerlich: „Ich darf loslassen, was jetzt zu viel ist.“",
        "Bleibe noch drei ruhige Atemzüge bei Boden, Atem und diesem Satz."
      ],
      // ⬇️ HIER: bitte den Dateinamen zu deinem fertigen Song setzen!
      songSrc: "audio/s2-overwhelm.mp3"
    }
  };

  // ---------- Timing ----------
  const CHAR_DELAY_MS = 140;
  const BETWEEN_BLOCKS_MS = 3000;
  const AFTER_RITUAL_MS = 5000;

  // ---------- Audio (BG bleibt gleich) ----------
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

  // ---------- Typing ----------
  function wrapTextToLines(text, el) {
    const style = getComputedStyle(el);
    const font = style.font || `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;

    const canvas = wrapTextToLines._c || (wrapTextToLines._c = document.createElement("canvas"));
    const ctx = canvas.getContext("2d");
    ctx.font = font;

    const maxWidth = el.clientWidth;
    const paragraphs = (text || "").split("\n");
    const lines = [];

    for (const para of paragraphs) {
      if (!para.trim()) { lines.push(""); continue; }

      const words = para.split(/\s+/).filter(Boolean);
      let line = "";

      for (const w of words) {
        const test = line ? (line + " " + w) : w;
        if (ctx.measureText(test).width <= maxWidth) line = test;
        else {
          if (line) lines.push(line);
          line = w;
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
  }

  async function typeList(ul, items, myRun){
    if (!ul) return;
    ul.innerHTML = "";

    for (const item of items){
      if (myRun !== runId) return;

      const li = document.createElement("li");
      ul.appendChild(li);

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

  // ---------- UI ----------
  const btnImpuls = $("btnImpuls");
  const btnSituation1 = $("btnSituation1");
  const btnSong = $("btnSong");
  const impulsEl = $("impuls");

  if (!btnImpuls || !btnSituation1 || !btnSong || !impulsEl) {
    alert("Fehler: Ein Button/Element fehlt im HTML (IDs prüfen: btnImpuls, btnSituation1, btnSong, impuls).");
    return;
  }

  // Impuls
  btnImpuls.addEventListener("click", () => {
    impulsEl.textContent = impulses[Math.floor(Math.random() * impulses.length)];
  });

  // ---------- Situation Buttons ----------
  // Wir klonen den bestehenden Button für Situation 2 (damit du index.html nicht anfassen musst).
  const s1Btn = btnSituation1;
  const s1Headline = s1Btn.querySelector(".headline");
  const s1Hint = s1Btn.querySelector(".hint");

  if (s1Headline) s1Headline.innerText = situations.s1.title;
  if (s1Hint) s1Hint.innerText = situations.s1.hint;

  const s2Btn = s1Btn.cloneNode(true);
  s2Btn.id = "btnSituation2";
  const s2Headline = s2Btn.querySelector(".headline");
  const s2Hint = s2Btn.querySelector(".hint");
  if (s2Headline) s2Headline.innerText = situations.s2.title;
  if (s2Hint) s2Hint.innerText = situations.s2.hint;

  // unter Situation 1 einfügen
  s1Btn.parentElement.appendChild(document.createElement("div")).style.height = "10px";
  s1Btn.parentElement.appendChild(s2Btn);

  // Song-Source setzen
  function setSongSrc(src){
    const player = $("songPlayer");
    if (!player) return;

    player.pause();
    player.currentTime = 0;

    // Source tauschen
    const source = player.querySelector("source");
    if (source) {
      source.src = src;
      player.load();
    }
  }

  async function runSituation(sit){
    runId++;
    const myRun = runId;

    clearAllBlocks();
    stopSong();
    stopBgMusic(false);
    await startBgMusic();

    setSongSrc(sit.songSrc);

    // Block 1
    show("b1");
    snapToTop("b1");
    await sleep(80);
    await typeText($("t1"), sit.ankommen, myRun);
    await sleep(BETWEEN_BLOCKS_MS);

    // Block 2
    show("b2");
    await typeText($("t2"), sit.erklaerung, myRun);
    await sleep(BETWEEN_BLOCKS_MS);

    // Block 3
    show("b3");
    await typeList($("t3"), sit.affirmationen, myRun);
    await sleep(BETWEEN_BLOCKS_MS);

    // Block 4
    show("b4");
    await typeList($("t4"), sit.ritual, myRun);
    await sleep(AFTER_RITUAL_MS);

    // Block 5
    show("b5");
    lockScroll = true;

    setTimeout(() => stopBgMusic(true), 45000);
  }

  s1Btn.addEventListener("click", () => runSituation(situations.s1));
  s2Btn.addEventListener("click", () => runSituation(situations.s2));

  // Song Button
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

      if (songGain) songGain.gain.value = 0.01; // sehr leiser Start
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
