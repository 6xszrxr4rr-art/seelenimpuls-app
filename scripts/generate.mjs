#!/usr/bin/env node
// ElevenLabs-Meditation-Generator
//   - Liest scripts/meditations.json
//   - Generiert jeden Block einzeln via ElevenLabs (eleven_multilingual_v2)
//   - Konkateniert mit echter ffmpeg-Stille (verhindert TTS-Hintergrundrauschen)
//   - Mischt mit Hintergrundmusik (Fade-In/Out, Pegel anpassbar in meditations.json)
//
// Benutzung:
//   ELEVENLABS_API_KEY=… node scripts/generate.mjs [nr]
//   nr = optional, einzelne Meditationsnummer (1..11). Ohne nr: alle.

import { readFile, mkdir, writeFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SPEC = resolve(ROOT, "scripts/meditations.json");
const OUT_DIR = resolve(ROOT, "audio");
const TMP = resolve(ROOT, ".tmp-meditation");

const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) {
  console.error("Fehler: ELEVENLABS_API_KEY ist nicht gesetzt.");
  process.exit(1);
}

const slug = (s) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/ß/g, "ss").replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const sh = (cmd, args) =>
  new Promise((res, rej) => {
    const p = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
    let err = "";
    p.stderr.on("data", (d) => (err += d.toString()));
    p.on("close", (code) =>
      code === 0 ? res() : rej(new Error(`${cmd} exit ${code}: ${err.slice(-400)}`))
    );
  });

async function tts(text, voiceId, voiceSettings, model, outPath) {
  const r = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: {
        "xi-api-key": API_KEY,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({ text, model_id: model, voice_settings: voiceSettings }),
    }
  );
  if (!r.ok) throw new Error(`ElevenLabs ${r.status}: ${await r.text()}`);
  const buf = Buffer.from(await r.arrayBuffer());
  await writeFile(outPath, buf);
}

async function silenceMp3(seconds, outPath) {
  await sh("ffmpeg", [
    "-y", "-f", "lavfi",
    "-i", `anullsrc=channel_layout=stereo:sample_rate=44100`,
    "-t", String(seconds), "-q:a", "9", "-acodec", "libmp3lame", outPath,
  ]);
}

async function concatMp3(parts, outPath) {
  const listFile = resolve(TMP, "concat.txt");
  await writeFile(listFile, parts.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join("\n"));
  await sh("ffmpeg", [
    "-y", "-f", "concat", "-safe", "0", "-i", listFile,
    "-c:a", "libmp3lame", "-b:a", "192k", outPath,
  ]);
}

async function mixWithMusic(voicePath, musicPath, mix, outPath) {
  // Stimme normal; Musik leiser, loopen wenn kürzer; Fade-In/Out; Schwanz nach Stimme
  const filter = [
    `[0:a]aresample=44100,apad=pad_dur=${mix.tail_after_voice_s}[v]`,
    `[1:a]aresample=44100,aloop=loop=-1:size=2e9,volume=${dbToLin(mix.music_volume_db)}[m1]`,
    `[m1]afade=t=in:st=0:d=${mix.fade_in_s}[m2]`,
    `[v][m2]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[mixed]`,
    `[mixed]afade=t=out:st=END-${mix.fade_out_s}:d=${mix.fade_out_s}[out]`,
  ].join(";");
  // END muss mit -t synchronisiert sein, deshalb erst Länge bestimmen
  const voiceDur = await audioDuration(voicePath);
  const totalDur = voiceDur + mix.tail_after_voice_s;
  const filterReal = filter.replace("END", String(totalDur));
  await sh("ffmpeg", [
    "-y", "-i", voicePath, "-i", musicPath,
    "-filter_complex", filterReal,
    "-map", "[out]", "-t", String(totalDur),
    "-c:a", "libmp3lame", "-b:a", "192k", outPath,
  ]);
}

async function audioDuration(path) {
  return new Promise((res, rej) => {
    const p = spawn("ffprobe", [
      "-v", "error", "-show_entries", "format=duration",
      "-of", "default=noprint_wrappers=1:nokey=1", path,
    ]);
    let out = "";
    p.stdout.on("data", (d) => (out += d.toString()));
    p.on("close", (c) => (c === 0 ? res(parseFloat(out)) : rej(new Error("ffprobe failed"))));
  });
}

const dbToLin = (db) => Math.pow(10, db / 20);

function resolveVoice(spec, med) {
  const key = med.voice || spec.default_voice;
  const v = spec.voices?.[key];
  if (!v) throw new Error(`Voice "${key}" für Meditation ${med.nr} nicht in spec.voices definiert.`);
  if (!v.voice_id || v.voice_id.startsWith("TBD_")) {
    throw new Error(`voice_id für "${key}" (${v.label}) in meditations.json fehlt — bitte ElevenLabs Voice-ID eintragen.`);
  }
  return v;
}

async function generateOne(spec, med) {
  const id = String(med.nr).padStart(2, "0");
  const title = slug(med.title);
  const workDir = resolve(TMP, `med-${id}`);
  await mkdir(workDir, { recursive: true });

  const voice = resolveVoice(spec, med);
  console.log(`\n=== Meditation ${med.nr}: ${med.title} ===`);
  console.log(`   ${med.blocks.length} Blöcke, Stimme=${voice.label} (${voice.voice_id})`);

  const parts = [];
  for (let i = 0; i < med.blocks.length; i++) {
    const b = med.blocks[i];
    const voicePart = resolve(workDir, `b${String(i).padStart(2, "0")}-v.mp3`);
    console.log(`   [${i + 1}/${med.blocks.length}] TTS: "${b.text.slice(0, 60)}…"`);
    await tts(b.text, voice.voice_id, spec.voice_settings, spec.model, voicePart);
    parts.push(voicePart);
    if (b.silence_after_s > 0) {
      const silPart = resolve(workDir, `b${String(i).padStart(2, "0")}-s.mp3`);
      await silenceMp3(b.silence_after_s, silPart);
      parts.push(silPart);
    }
  }

  const voiceFull = resolve(workDir, "voice.mp3");
  console.log(`   ⤷ konkateniere Stimme + Stille`);
  await concatMp3(parts, voiceFull);

  const finalName = `Meditation-${id}-${title}.mp3`;
  const finalPath = resolve(OUT_DIR, finalName);
  const musicPath = resolve(ROOT, med.background_music);

  if (!existsSync(musicPath)) {
    console.warn(`   ⚠ Musik fehlt: ${med.background_music} — gebe Stimmen-Only aus`);
    await sh("ffmpeg", ["-y", "-i", voiceFull, "-c:a", "copy", finalPath]);
  } else {
    console.log(`   ⤷ mixe mit Musik: ${med.background_music}`);
    await mixWithMusic(voiceFull, musicPath, spec.mix, finalPath);
  }
  console.log(`   ✓ ${finalName}`);
  return finalPath;
}

async function main() {
  const spec = JSON.parse(await readFile(SPEC, "utf-8"));
  await mkdir(TMP, { recursive: true });
  await mkdir(OUT_DIR, { recursive: true });

  const onlyNr = process.argv[2] ? parseInt(process.argv[2], 10) : null;
  const todo = onlyNr ? spec.meditations.filter((m) => m.nr === onlyNr) : spec.meditations;
  if (todo.length === 0) {
    console.error(`Keine Meditation mit Nr ${onlyNr} gefunden.`);
    process.exit(1);
  }

  const produced = [];
  for (const med of todo) produced.push(await generateOne(spec, med));

  console.log(`\nFertig. ${produced.length} Datei(en) in ${OUT_DIR}`);
  await rm(TMP, { recursive: true, force: true });
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
