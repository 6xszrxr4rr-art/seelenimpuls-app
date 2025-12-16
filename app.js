const impulse = [
  "Atme tief ein. Du musst heute nicht alles halten.",
  "Du darfst langsam sein.",
  "Dein Herz kennt den Weg.",
  "Alles darf leicht sein."
];

const affirmationen = [
  "Ich bin sicher.",
  "Ich bin geführt.",
  "Ich vertraue mir."
];

function neuerImpuls() {
  // Text wechseln
  document.getElementById("impuls").innerText =
    impulse[Math.floor(Math.random() * impulse.length)];

  document.getElementById("affirmation").innerText =
    affirmationen[Math.floor(Math.random() * affirmationen.length)];

  // Musik starten (nach Button-Klick erlaubt, auch auf iPhone)
  const audio = document.getElementById("audioPlayer");
  if (audio) {
    audio.pause();           // falls es schon lief
    audio.currentTime = 0;   // von vorn starten
    audio.play().catch(() => {
      // Falls Safari trotzdem blockt, passiert einfach nichts.
      // Dann kann man den Play-Button nutzen.
    });
  }
}
