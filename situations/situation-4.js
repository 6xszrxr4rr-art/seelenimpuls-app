/* ===========================
   Seelenimpuls – Situation 4
   Erschöpfung & fehlende Kraft
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
    "Vielleicht fühlt sich alles gerade schwer an.\n" +
    "Ganz still.\n" +
    "Einfach müde.\n\n" +
    "Du darfst langsamer werden.\n" +
    "Du darfst dich zurücklehnen.\n\n" +
    "Dieser Moment trägt dich.";

  const erklaerungText =
    "Erschöpfung entsteht oft,\n" +
    "wenn wir über längere Zeit stark waren.\n\n" +
    "Der Körper meldet sich leise.\n" +
    "Als Signal.\n" +
    "Als Schutz.\n\n" +
    "Dein Nervensystem sucht jetzt\n" +
    "Schonung,\n" +
    "Entlastung\n" +
    "und ein sanftes Zurückfinden in Ruhe.\n\n" +
    "Diese Impulse laden dich ein,\n" +
    "Kraft nicht zu erzeugen,\n" +
    "sondern sie sich behutsam\n" +
    "wieder annähern zu lassen.";

  const affirmationItems = [
    "Ich darf müde sein.",
    "Ich darf bei mir ankommen.",
    "Ruhe darf mich erreichen."
  ];

  const ritualItems = [
    "Stelle beide Füße bewusst auf den Boden oder spüre die Unterlage, die dich trägt.",
    "Nimm wahr, wie dein Körper gehalten wird.",
    "Atme ruhig ein.",
    "Lass das Ausatmen weich und mühelos werden.",
    "Spüre, wo dein Körper müde ist.",
    "Lege eine Hand auf diese Stelle oder halte sie dort innerlich.",
    "Lass dort alles sanft sein.",
    "Stelle dir vor, du darfst dich innerlich ablegen – so, als würdest du Gewicht abgeben.",
    "Sage innerlich: „Ich darf mich ausruhen.“",
    "Bleibe noch drei ruhige Atemzüge bei Boden, Atem und diesem Satz."
  ];

  // ---------- Timing ----------
  const CHAR_DELAY_MS = 140;
  const BETWEEN_BLOCKS_MS = 3000;
  const AFTER_RITUAL_MS = 5000;

  // ---------- Audio ----------
  const BG_TARGET_GAIN = 0.0085;
  const BG_FADE_MS = 2500;
  const SONG_TARGET_GAIN = 0.035;

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
  async function startSituation4(){
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

  // Extern aufrufbar (Button / Controller)
  window.startSituation4 = startSituation4;

});
