const wait = ms => new Promise(r=>setTimeout(r,ms));

const BG_VOL = 0.003;          // sehr leise
const BG_MAX = 90000;          // 90 Sekunden

const TYPE = 42;               // langsamer Text
const PAUSE = {
  b1: 4000,
  b2: 6500,
  b3: 7500,
  b4: 12000
};

const bg = document.getElementById("bgMusic");
const song = document.getElementById("song");

async function fade(audio,to,ms){
  const steps=50, step=ms/steps;
  const diff=(to-audio.volume)/steps;
  for(let i=0;i<steps;i++){
    audio.volume+=diff;
    await wait(step);
  }
}

async function startBg(){
  bg.volume=0;
  await bg.play();
  await fade(bg,BG_VOL,6000);
  setTimeout(()=>stopBg(),BG_MAX);
}

async function stopBg(){
  await fade(bg,0,4000);
  bg.pause(); bg.currentTime=0;
}

async function type(el,text){
  el.textContent="";
  for(const c of text){
    el.textContent+=c;
    await wait(TYPE);
  }
}

async function list(el,items){
  el.innerHTML="";
  for(const i of items){
    const li=document.createElement("li");
    el.appendChild(li);
    for(const c of i){
      li.textContent+=c;
      await wait(TYPE);
    }
    await wait(800);
  }
}

document.getElementById("startSituation").onclick = async ()=>{
  await startBg();

  document.getElementById("b1").classList.add("show");
  await type(t1,"Du bist hier.\nDu darfst jetzt langsamer werden.");
  await wait(PAUSE.b1);

  document.getElementById("b2").classList.add("show");
  await type(t2,
    "Innere Unruhe ist oft ein wertvoller Hinweis deines Unterbewusstseins.\n" +
    "Dein inneres System sucht nach Sicherheit.\n" +
    "Du darfst diesem Signal jetzt zuhören."
  );
  await wait(PAUSE.b2);

  document.getElementById("b3").classList.add("show");
  await list(t3,[
    "Ich bin sicher.",
    "Ich bin ganz.",
    "Ich bin gehalten in mir."
  ]);
  await wait(PAUSE.b3);

  document.getElementById("b4").classList.add("show");
  await list(t4,[
    "Nimm dir einen Moment nur für dich.",
    "Atme ruhig und gleichmäßig ein.",
    "Atme etwas länger aus.",
    "Lass deine Schultern sinken.",
    "Spüre den Boden unter deinen Füßen.",
    "Nimm wahr, wie Ruhe dich durchströmt."
  ]);
  await wait(PAUSE.b4);

  document.getElementById("b5").classList.add("show");
  document.getElementById("rain").style.display="block";
};

document.getElementById("playSong").onclick = async ()=>{
  await stopBg();
  song.currentTime=0;
  song.play();
};
