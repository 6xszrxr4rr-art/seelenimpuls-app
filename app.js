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
    // alles zuerst ausblenden
  document.getElementById("situation-impuls").style.display = "none";
  document.getElementById("situation-affirmationen").style.display = "none";
  document.getElementById("situation-ritual").style.display = "none";

  // Ankommenssatz
  document.getElementById("impuls").innerText =
    "Du darfst jetzt ruhig werden.";

  // Erklärung nach 2 Sekunden
  setTimeout(() => {
    document.getElementById("situation-impuls").style.display = "block";
  }, 2000);

  // Affirmationen nach 5 Sekunden
  setTimeout(() => {
    document.getElementById("situation-affirmationen").style.display = "block";
  }, 5000);

  // Ritual nach 8 Sekunden
  setTimeout(() => {
    document.getElementById("situation-ritual").style.display = "block";
  }, 8000);
}
