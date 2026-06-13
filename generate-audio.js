#!/usr/bin/env node
// generate-audio.js — Seelenimpuls TTS via ElevenLabs API
// Usage:
//   node generate-audio.js --overview    Show word/char counts for all texts
//   node generate-audio.js --voices      List all voices in your ElevenLabs account
//   node generate-audio.js --test        Generate situation-01-de-basis.v1.mp3 only
//   node generate-audio.js --generate    Generate ALL audio files

'use strict';
const fs   = require('fs');
const path = require('path');
const https = require('https');

// ─── Load .env without dotenv package ────────────────────────────────────────
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const m = line.match(/^([^=#\s][^=]*)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
  });
}

const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) { console.error('❌  ELEVENLABS_API_KEY not found in .env'); process.exit(1); }

// ─── Config ───────────────────────────────────────────────────────────────────
const AUDIO_DIR    = path.join(__dirname, 'audio');
const VERTONUNG_DIR = path.join(__dirname, 'vertonung');
const MODEL        = 'eleven_multilingual_v2';
const FORMAT       = 'mp3_44100_128';
const VERSION      = 'v1';
const VOICE_SETTINGS = { stability: 0.7, similarity_boost: 0.8, style: 0.1, use_speaker_boost: true };

// ─── Argument parsing ─────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const MODE = args.includes('--generate') ? 'generate'
           : args.includes('--test')     ? 'test'
           : args.includes('--voices')   ? 'voices'
           :                               'overview';

// ─── ElevenLabs helpers ───────────────────────────────────────────────────────
function apiGet(apiPath) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.elevenlabs.io',
      path: apiPath,
      method: 'GET',
      headers: { 'xi-api-key': API_KEY, 'Accept': 'application/json' },
    };
    const req = https.request(options, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        try { resolve(JSON.parse(Buffer.concat(chunks).toString())); }
        catch (e) { resolve(Buffer.concat(chunks).toString()); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function apiTTS(voiceId, text, outputPath) {
  return new Promise((resolve, reject) => {
    const bodyStr = JSON.stringify({ text, model_id: MODEL, voice_settings: VOICE_SETTINGS });
    const options = {
      hostname: 'api.elevenlabs.io',
      path: `/v1/text-to-speech/${voiceId}?output_format=${FORMAT}`,
      method: 'POST',
      headers: {
        'xi-api-key': API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
        'Content-Length': Buffer.byteLength(bodyStr),
      },
    };
    const req = https.request(options, res => {
      if (res.statusCode !== 200) {
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => reject(new Error(`HTTP ${res.statusCode}: ${Buffer.concat(chunks).toString().substring(0,300)}`)));
        return;
      }
      const out = fs.createWriteStream(outputPath);
      res.pipe(out);
      out.on('finish', resolve);
      out.on('error', reject);
    });
    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });
}

// ─── Text parsing ─────────────────────────────────────────────────────────────
// Remove short breaks (< 1.5s) and collapse resulting bare newlines into spaces,
// so ElevenLabs receives flowing sentences instead of many short isolated fragments
// (which cause it to rush). Longer breaks (≥ 1.5s) stay as structural pauses.
function stripShortBreaks(text) {
  let t = text.replace(/<break time="([\d.]+)s"\s*\/>/g, (match, secs) => {
    return parseFloat(secs) < 1.5 ? ' ' : match;
  });
  // Collapse stray whitespace/newlines left by removed breaks into a single space
  t = t.replace(/[ \t]*\n[ \t]*/g, ' ').replace(/ {2,}/g, ' ').trim();
  return t;
}

// ElevenLabs max single break = 3.0s; cap longer breaks via chaining
function capBreaks(text) {
  return text.replace(/<break time="([\d.]+)s"\s*\/>/g, (_, t) => {
    const secs = parseFloat(t);
    if (secs <= 3.0) return `<break time="${Math.min(secs, 3.0).toFixed(1)}s" />`;
    // Chain of 3s breaks + remainder
    const count = Math.floor(secs / 3.0);
    const rem   = +(secs - count * 3.0).toFixed(1);
    let chain = '<break time="3.0s" />'.repeat(count);
    if (rem >= 0.1) chain += `<break time="${rem}s" />`;
    return chain;
  });
}

function extractPauseSection(block) {
  // Supports both DE ("Mit Pausenmarkierungen") and EN ("With Pause Markers") headings
  const m = block.match(/### (?:Mit Pausenmarkierungen|With Pause Markers)\n([\s\S]+)/);
  if (!m) return '';
  // Strip markdown blockquote lines (> Hinweis / > Note...)
  return m[1].replace(/^>.*\n?/mg, '').trim();
}

function parseVertonungFile(lang, num) {
  const langWord = lang === 'de' ? 'deutsch' : 'englisch';
  const file = path.join(VERTONUNG_DIR,
    `vertonung_situation_${String(num).padStart(2,'0')}_${langWord}.md`);
  if (!fs.existsSync(file)) return null;

  const content = fs.readFileSync(file, 'utf8');
  const modules = {};

  // Split on hr lines (---) to get module blocks
  const sections = content.split(/\n---+\n/);
  for (const sec of sections) {
    // Match both German (## Modul N) and English (## Module N) headings
    const mMatch = sec.match(/^## Modul(?:e)? (\d+)/m);
    if (!mMatch) continue;
    const n = parseInt(mMatch[1]);
    const txt = extractPauseSection(sec);
    if (txt) modules[n] = txt;
  }
  return modules;
}

function buildBasisText(modules) {
  // Combine modules 1–5, wrap with 1s intro + 2s outro silence
  const parts = ['<break time="1.0s" />'];
  for (let i = 1; i <= 5; i++) {
    if (!modules[i]) continue;
    parts.push(capBreaks(stripShortBreaks(modules[i])));
    if (i < 5) parts.push('<break time="2.0s" />');
  }
  parts.push('<break time="2.0s" />');
  return parts.join('\n');
}

function buildPremiumText(modules) {
  if (!modules[6]) return null;
  return '<break time="1.0s" />\n' + capBreaks(stripShortBreaks(modules[6])) + '\n<break time="2.0s" />';
}

function textChars(text) {
  return text.replace(/<break[^>]*\/>/g, '').replace(/\s+/g, ' ').trim().length;
}
function textWords(text) {
  return text.replace(/<break[^>]*\/>/g, '').trim().split(/\s+/).filter(Boolean).length;
}

// ─── Build task list ──────────────────────────────────────────────────────────
function buildTasks(deVoiceId, enVoiceId) {
  const tasks = [];
  for (let n = 1; n <= 11; n++) {
    for (const lang of ['de', 'en']) {
      const mods = parseVertonungFile(lang, n);
      if (!mods) continue;
      const voiceId = lang === 'de' ? deVoiceId : enVoiceId;
      const numStr  = String(n).padStart(2, '0');

      const basisText = buildBasisText(mods);
      tasks.push({ n, lang, type: 'basis', voiceId, text: basisText,
                   file: path.join(AUDIO_DIR, `situation-${numStr}-${lang}-basis.${VERSION}.mp3`) });

      const premiumText = buildPremiumText(mods);
      if (premiumText) {
        tasks.push({ n, lang, type: 'premium', voiceId, text: premiumText,
                     file: path.join(AUDIO_DIR, `situation-${numStr}-${lang}-premium.${VERSION}.mp3`) });
      }
    }
  }
  return tasks;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {

  // ── VOICES mode ──
  if (MODE === 'voices') {
    console.log('Fetching voices...');
    const data = await apiGet('/v1/voices');
    if (!data.voices) { console.error('Unexpected response:', JSON.stringify(data).substring(0,300)); return; }
    console.log('\nYour ElevenLabs voices:\n');
    data.voices.forEach(v => console.log(`  ${v.voice_id.padEnd(24)} ${v.name}`));
    return;
  }

  // ── OVERVIEW mode (no API calls) ──
  if (MODE === 'overview') {
    console.log('\n══════════════════════════════════════════════════════════');
    console.log('  SEELENIMPULS — AUDIO OVERVIEW (Schritt 1: Textübersicht)');
    console.log('══════════════════════════════════════════════════════════\n');
    console.log('Nr | Sprache | Typ     | Wörter | Zeichen');
    console.log('---|---------|---------|--------|--------');
    let totalChars = 0, totalFiles = 0;
    for (let n = 1; n <= 11; n++) {
      for (const lang of ['de', 'en']) {
        const mods = parseVertonungFile(lang, n);
        if (!mods) { console.log(` ${n.toString().padStart(2)} | ${lang.toUpperCase()}      | ---     | (file not found)`); continue; }
        const bText = buildBasisText(mods);
        const pText = buildPremiumText(mods);
        const bw = textWords(bText), bc = textChars(bText);
        console.log(` ${String(n).padStart(2)} | ${lang.toUpperCase()}      | Basis   | ${String(bw).padStart(6)} | ${String(bc).padStart(7)}`);
        totalChars += bc; totalFiles++;
        if (pText) {
          const pw = textWords(pText), pc = textChars(pText);
          console.log(`    |         | Premium | ${String(pw).padStart(6)} | ${String(pc).padStart(7)}`);
          totalChars += pc; totalFiles++;
        }
      }
    }
    console.log('\n──────────────────────────────────────────────────────────');
    console.log(`  ${totalFiles} Dateien gesamt`);
    console.log(`  ${totalChars.toLocaleString('de-DE')} Zeichen gesamt (ohne Break-Tags)`);
    console.log(`  ElevenLabs verrechnet ca. ${Math.round(totalChars/1000)}k Zeichen`);
    console.log('\n  Nächster Schritt: node generate-audio.js --voices');
    console.log('  Dann:             node generate-audio.js --test');
    console.log('  Vollständig:      node generate-audio.js --generate\n');
    return;
  }

  // ── All modes that need API voice lookup ──
  console.log('\nLoading voices from ElevenLabs...');
  const voiceData = await apiGet('/v1/voices');
  if (!voiceData.voices) {
    console.error('Could not load voices:', JSON.stringify(voiceData).substring(0,300));
    process.exit(1);
  }
  const voices = voiceData.voices;

  // Find DE voice (Lana Weiss – Meditation)
  let deVoice = voices.find(v => /lana weiss/i.test(v.name));
  if (!deVoice) deVoice = voices.find(v => /lana/i.test(v.name));
  if (!deVoice) {
    console.log('Available voices:', voices.map(v => v.name).join(', '));
    console.error('❌  Voice "Lana Weiss" not found in your account.');
    process.exit(1);
  }

  // Find EN voice (Eryn)
  let enVoice = voices.find(v => /^eryn$/i.test(v.name.trim()));
  if (!enVoice) enVoice = voices.find(v => /eryn/i.test(v.name));
  if (!enVoice) {
    console.log('Available voices:', voices.map(v => v.name).join(', '));
    console.error('❌  Voice "Eryn" not found in your account.');
    process.exit(1);
  }

  console.log(`✓ DE voice: "${deVoice.name}" (${deVoice.voice_id})`);
  console.log(`✓ EN voice: "${enVoice.name}" (${enVoice.voice_id})`);

  const tasks = buildTasks(deVoice.voice_id, enVoice.voice_id);

  // ── TEST mode: only situation-01-de-basis ──
  if (MODE === 'test') {
    const task = tasks.find(t => t.n === 1 && t.lang === 'de' && t.type === 'basis');
    if (!task) { console.error('Task not found'); process.exit(1); }
    console.log(`\nGenerating TEST file: ${path.basename(task.file)}`);
    console.log('─'.repeat(60));
    console.log('TEXT PREVIEW (first 400 chars):\n');
    console.log(task.text.substring(0, 400) + '...\n');
    console.log('─'.repeat(60));
    await apiTTS(task.voiceId, task.text, task.file);
    const stat = fs.statSync(task.file);
    console.log(`\n✓ Saved: ${task.file}`);
    console.log(`  Size: ${(stat.size / 1024).toFixed(1)} KB`);
    console.log('\nBitte Datei testen und dann --generate freigeben.');
    return;
  }

  // ── GENERATE mode: all files ──
  console.log(`\nGenerating ${tasks.length} audio files...\n`);
  const results = [];
  for (const task of tasks) {
    const label = `situation-${String(task.n).padStart(2,'0')}-${task.lang}-${task.type}.${VERSION}.mp3`;
    process.stdout.write(`  ${label.padEnd(48)} `);
    try {
      await apiTTS(task.voiceId, task.text, task.file);
      const stat = fs.statSync(task.file);
      const kb = (stat.size / 1024).toFixed(1);
      console.log(`✓  ${kb} KB`);
      results.push({ file: label, kb: parseFloat(kb), ok: true });
    } catch (e) {
      console.log(`✗  ${e.message.substring(0, 80)}`);
      results.push({ file: label, ok: false, error: e.message });
    }
    // 600ms delay to respect rate limits
    await new Promise(r => setTimeout(r, 600));
  }

  // Summary
  const ok = results.filter(r => r.ok);
  const fail = results.filter(r => !r.ok);
  const totalKB = ok.reduce((s, r) => s + r.kb, 0);
  console.log('\n══════════════════════════════════════════════════════════');
  console.log(`  ${ok.length}/${results.length} Dateien erfolgreich generiert`);
  console.log(`  Gesamtgröße: ${(totalKB / 1024).toFixed(1)} MB`);
  if (fail.length) {
    console.log(`\n  Fehler (${fail.length}):`);
    fail.forEach(r => console.log(`    ✗ ${r.file}: ${r.error}`));
  }
  console.log('\n  Nächster Schritt: SW-Version erhöhen und deployen.\n');
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
