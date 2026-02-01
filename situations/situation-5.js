/* ===========================
   Seelenimpuls – Situation 5
   Traurigkeit & leise Schwere
   =========================== */

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

  // ---------- Inhalte ----------
  const ankommenText =
    "Du bist hier.\n\n" +
    "Vielleicht liegt etwas Schweres in dir.\n" +
    "Ohne klare Worte.\n" +
    "Ohne Grund.\n\n" +
    "Du darfst es fühlen.\n\n" +
    "Leise.\n" +
    "Still.\n" +
    "So, wie es ist.";

  const erklaerungText =
    "Traurigkeit muss nicht laut sein.\n" +
    "Oft zeigt sie sich als Schwere.\n\n" +
    "Ein Ziehen.\n" +
    "Ein Rückzug.\n" +
    "Ein langsameres Inneres.\n\n" +
    "Dein Nervensystem sucht in solchen Momenten\n" +
    "Halt.\n\n" +
    "Diese Impulse laden dich ein,\n" +
    "mit der leisen Schwere zu sein\n" +
    "und dich dabei getragen zu fühlen.";

  const affirmationItems = [
    "Ich darf fühlen, was da ist.",
    "Ich darf ehrlich bei mir sein.",
    "Ich bin gehalten in diesem Moment."
  ];

  const ritualItems = [
    "Stelle beide Füße bewusst auf den Boden.",
    "Spüre den Halt unter dir.",
    "Atme ruhig ein.",
    "Lass das Ausatmen sanft fließen.",
    "Nimm die Schwere oder Traurigkeit wahr.",
    "Lege eine Hand auf dein Herz oder deinen Bauch.",
    "Spüre den Kontakt.",
    "Stelle dir vor, dass dein Atem diese Stelle sanft berührt.",
    "Lass Raum entstehen – ganz in deinem Tempo.",
    "Sage innerlich: „Ich darf fühlen, was da ist.“",
    "Bleibe noch drei ruhige Atemzüge bei Boden, Atem und diesem Satz."
  ];

  // ---------- Timing ----------
  const CHAR_DELAY_MS = 140;
  const BETWEEN_BLOCKS_MS = 3000;
  const AFTER_RITUAL_MS = 5000;

  // ---------- Audio ----------
  const SONG_TARGET_GAIN = 0.035;

  let audioCtx = null;
  let songGain = null;
  let songSource = null;

  function ensureAudioGraph(){
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    const song = $("songPlayer");
    if (song){
      songSource = audioCtx.createMediaElementSource(song);
      songGain = audioCtx.createGain();
      songGain.gain.value = 0;
      songSource.connect(songGain);
      songGain.connect(audioCtx.destination);
    }
  }

  // ---------- Typing ----------
  function wrapTextToLines(text, el) {
    const style = getComputedStyle(el);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    ctx.font = style.font;
    const maxWidth = el.clientWidth;
    const lines = [];
    const paragraphs = text.split("\n");

    paragraphs.forEach(p => {
      if (!p.trim()) { lines.push(""); return; }
      let line = "";
      p.split(" ").forEach(word => {
        const test = line ? line + " " + word : word;
        if (ctx.measureText(test).width <= maxWidth) {
          line = test;
        } else {
          lines.push(line);
          line = word;
        }
      });
      if (line) lines.push(line);
    });
    return lines;
  }

  async function typeText(el, text){
    el.innerHTML = "";
    const lines = wrapTextToLines(text, el);
    const cursor = document.createElement("span");
    cursor.className = "cursor";
    el.appendChild(cursor);

    for (let li = 0; li < lines.length; li++){
      for (let i = 0; i < lines[li].length; i++){
        cursor.insertAdjacentText("beforebegin", lines[li][i]);
        followWhileTyping(cursor);
        await sleep(CHAR_DELAY_MS);
      }
      if (li < lines.length - 1) {
        cursor.insertAdjacentHTML("beforebegin", "<br>");
        await sleep(CHAR_DELAY_MS * 2);
      }
    }
  }

  async function typeList(ul, items){
    ul.innerHTML = "";
    for (const item of items){
      const li = document.createElement("li");
      ul.appendChild(li);
      for (let i = 0; i < item.length; i++){
        li.textContent += item[i];
        if (i % 6 === 0) followWhileTyping(li);
        await sleep(CHAR_DELAY_MS);
      }
      await sleep(600);
    }
  }

  // ---------- Start ----------
  async function startSituation5(){
    clearAllBlocks();
    ensureAudioGraph();

    show("b1");
    snapToTop("b1");
    await typeText($("t1"), ankommenText);
    await sleep(BETWEEN_BLOCKS_MS);

    show("b2");
    await typeText($("t2"), erklaerungText);
    await sleep(BETWEEN_BLOCKS_MS);

    show("b3");
    await typeList($("t3"), affirmationItems);
    await sleep(BETWEEN_BLOCKS_MS);

    show("b4");
    await typeList($("t4"), ritualItems);
    await sleep(AFTER_RITUAL_MS);

    show("b5");
    lockScroll = true;
  }

  // Extern aufrufbar
  window.startSituation5 = startSituation5;

  // Song Button: spielt Song-Situation-5.mp3
  const btnSong = $("btnSong");
  btnSong?.addEventListener("click", async () => {
    const song = $("songPlayer");
    if (!song) return;

    song.src = "audio/Song-Situation-5.mp3";
    ensureAudioGraph();

    song.currentTime = 0;
    await song.play();

    if (songGain){
      const now = audioCtx.currentTime;
      songGain.gain.setValueAtTime(0.01, now);
      songGain.gain.linearRampToValueAtTime(SONG_TARGET_GAIN, now + 1.2);
    }
  });

});
