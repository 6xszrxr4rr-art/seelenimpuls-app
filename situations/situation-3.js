/* ===========================
   Seelenimpuls – Situation 3
   Anspannung & inneres Festhalten
   =========================== */

document.addEventListener("DOMContentLoaded", () => {

  const $ = (id) => document.getElementById(id);
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  /* ---------- Scroll / Follow ---------- */
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
    if (el) el.classList.remove("hidden");
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
    ["t1","t2","t3","t4"].forEach(id => {
      if ($(id)) $(id).innerHTML = "";
    });
  }

  /* ---------- Inhalte ---------- */

  const ankommenText =
    "Du bist hier.\n\n" +
    "Vielleicht hält dein Körper gerade mehr,\n" +
    "als er müsste.\n" +
    "Schultern.\n" +
    "Kiefer.\n" +
    "Atem.\n\n" +
    "Du darfst nichts loslassen.\n" +
    "Noch nicht.\n\n" +
    "Nimm nur wahr,\n" +
    "wo du festhältst.\n\n" +
    "Und bleibe einen Moment hier.";

  const erklaerungText =
    "Innere Anspannung entsteht oft,\n" +
    "wenn etwas in uns wachsam bleibt.\n\n" +
    "Der Körper hält.\n" +
    "Als würde er sagen:\n" +
    "„Ich bin noch nicht sicher.“\n\n" +
    "Dabei braucht dein Nervensystem\n" +
    "keinen Befehl zum Loslassen.\n" +
    "Es braucht Erlaubnis.\n\n" +
    "Diese Impulse laden dich ein,\n" +
    "dem inneren Festhalten sanft zu begegnen\n" +
    "und Spannung Schritt für Schritt\n" +
    "nicht mehr tragen zu müssen.";

  const affirmationItems = [
    "Ich muss jetzt nichts lösen.",
    "Ich darf mich ein wenig entspannen.",
    "Mein Körper darf nachlassen."
  ];

  const ritualItems = [
    "Stelle beide Füße bewusst auf den Boden.",
    "Spüre den Kontakt und die Stabilität unter dir.",
    "Atme ruhig ein.",
    "Lass das Ausatmen langsam länger werden.",
    "Nimm wahr, wo dein Körper festhält.",
    "Vielleicht in den Schultern, im Bauch oder im Kiefer.",
    "Lege eine Hand auf diese Stelle oder halte sie dort innerlich.",
    "Stelle dir vor, wie sich dort mit jedem Ausatmen etwas löst.",
    "Nicht ganz – nur ein wenig.",
    "Stelle dir vor, du öffnest innerlich die Hand, die bisher festgehalten hat.",
    "Sage innerlich: „Ich darf mich lösen.“",
    "Bleibe noch drei ruhige Atemzüge bei Boden, Atem und diesem Satz."
  ];

  /* ---------- Timing ---------- */
  const CHAR_DELAY_MS = 140;
  const BETWEEN_BLOCKS_MS = 3000;
  const AFTER_RITUAL_MS = 5000;

  /* ---------- Audio ---------- */
  const BG_TARGET_GAIN = 0.0085;
  const SONG_TARGET_GAIN = 0.035;

  let audioCtx = null;
  let bgGain = null;
  let songGain = null;

  function ensureAudioGraph(){
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    const bg = $("bgMusic");
    if (bg){
      const src = audioCtx.createMediaElementSource(bg);
      bgGain = audioCtx.createGain();
      bgGain.gain.value = 0;
      src.connect(bgGain);
      bgGain.connect(audioCtx.destination);
    }

    const song = $("songPlayer");
    if (song){
      const src = audioCtx.createMediaElementSource(song);
      songGain = audioCtx.createGain();
      songGain.gain.value = 0;
      src.connect(songGain);
      songGain.connect(audioCtx.destination);
    }
  }

  /* ---------- Typing ---------- */

  function wrapTextToLines(text, el){
    const style = getComputedStyle(el);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    ctx.font = style.font;
    const maxWidth = el.clientWidth;

    const lines = [];
    const paragraphs = text.split("\n");

    for (const p of paragraphs){
      if (!p.trim()){ lines.push(""); continue; }
      const words = p.split(" ");
      let line = "";
      for (const w of words){
        const test = line ? line + " " + w : w;
        if (ctx.measureText(test).width <= maxWidth) line = test;
        else { lines.push(line); line = w; }
      }
      if (line) lines.push(line);
    }
    return lines;
  }

  async function typeText(el, text){
    el.innerHTML = "";
    const lines = wrapTextToLines(text, el);
    const cursor = document.createElement("span");
    cursor.className = "cursor";
    el.appendChild(cursor);

    for (let l = 0; l < lines.length; l++){
      for (let c of lines[l]){
        cursor.insertAdjacentText("beforebegin", c);
        followWhileTyping(cursor);
        await sleep(CHAR_DELAY_MS);
      }
      if (l < lines.length - 1){
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
      for (let c of item){
        li.textContent += c;
        await sleep(CHAR_DELAY_MS);
      }
      await sleep(600);
    }
  }

  /* ---------- Start ---------- */

  const btnSituation3 = $("btnSituation3");
  const btnSong = $("btnSong");

  if (!btnSituation3) return;

  btnSituation3.addEventListener("click", async () => {
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
  });

  btnSong?.addEventListener("click", async () => {
    const song = $("songPlayer");
    if (!song) return;

    song.src = "audio/Song-Situation-3.mp3";
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
