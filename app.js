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
  document.getElementById("impuls").innerText =
    impulse[Math.floor(Math.random() * impulse.length)];
  document.getElementById("affirmation").innerText =
    affirmationen[Math.floor(Math.random() * affirmationen.length)];
}
