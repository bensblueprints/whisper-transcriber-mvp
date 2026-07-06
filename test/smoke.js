'use strict';
/**
 * End-to-end smoke test (no Electron needed) — exercises the real pipeline:
 *
 *   1. Downloads the actual whisper.cpp Windows binary (~8 MB) if missing
 *   2. Downloads the actual ggml-tiny.en model (~78 MB) if missing
 *   3. Generates a 3-second WAV fixture with the bundled ffmpeg-static
 *      (silence — we assert the pipeline runs and emits transcript files,
 *      not specific words)
 *   4. Converts it through the same 16kHz-mono path the app uses
 *   5. Runs whisper-cli and asserts TXT/SRT/VTT outputs exist and parse
 *
 * Assets are cached in test/.cache so re-runs are fast.
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const dl = require('../src/lib/download');
const { toWav16k, ffmpegPath } = require('../src/lib/transcode');
const { transcribe } = require('../src/lib/whisper');
const { parseSrt } = require('../src/lib/srt');
const { History } = require('../src/lib/history');

const CACHE = path.join(__dirname, '.cache');       // binary + model (kept between runs)
const WORK = path.join(__dirname, '.work');         // per-run outputs (wiped)

function log(msg) { console.log('[smoke] ' + msg); }

function progressLogger(label) {
  let lastPct = -10;
  return (p) => {
    const pct = p.total ? Math.round((p.received / p.total) * 100) : 0;
    if (pct >= lastPct + 10) {
      lastPct = pct;
      log(`${label}: ${pct}% (${(p.received / 1048576).toFixed(1)} MB)`);
    }
  };
}

(async () => {
  fs.rmSync(WORK, { recursive: true, force: true });
  fs.mkdirSync(WORK, { recursive: true });
  fs.mkdirSync(CACHE, { recursive: true });

  // 1) real whisper.cpp binary download
  log('ensuring whisper.cpp binary (' + dl.WHISPER_VERSION + ')...');
  const binPath = await dl.ensureWhisperBinary(CACHE, progressLogger('binary'));
  assert.ok(fs.existsSync(binPath), 'whisper-cli binary exists');
  log('binary: ' + binPath);

  // 2) real tiny.en model download from Hugging Face
  log('ensuring ggml-tiny.en model...');
  const modelPath = await dl.ensureModel(CACHE, 'tiny.en', progressLogger('model'));
  const modelSize = fs.statSync(modelPath).size;
  assert.ok(modelSize > 50 * 1024 * 1024, 'model file is plausibly sized (>50MB), got ' + modelSize);
  log('model: ' + modelPath + ' (' + (modelSize / 1048576).toFixed(0) + ' MB)');

  // 3) generate a real fixture with ffmpeg-static: 3s of silence as mp3
  //    (proves the "any input format -> wav" conversion path too)
  const fixtureMp3 = path.join(WORK, 'fixture.mp3');
  log('generating 3s audio fixture via ffmpeg-static...');
  const gen = spawnSync(ffmpegPath(), [
    '-y', '-hide_banner', '-loglevel', 'error',
    '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo',
    '-t', '3', '-c:a', 'libmp3lame', fixtureMp3
  ], { encoding: 'utf8' });
  assert.strictEqual(gen.status, 0, 'ffmpeg fixture generation failed: ' + gen.stderr);
  assert.ok(fs.statSync(fixtureMp3).size > 1000, 'fixture mp3 has content');

  // 4) convert to 16kHz mono wav (same code path as the app)
  const wavPath = path.join(WORK, 'fixture-16k.wav');
  await toWav16k(fixtureMp3, wavPath);
  const wavSize = fs.statSync(wavPath).size;
  // 3s * 16000Hz * 2 bytes mono ≈ 96000 bytes + header
  assert.ok(wavSize > 90000 && wavSize < 110000, '16kHz wav has expected size, got ' + wavSize);
  log('converted wav: ' + wavPath + ' (' + wavSize + ' bytes)');

  // 5) run whisper-cli end-to-end
  const outDir = path.join(WORK, 'out');
  log('running whisper-cli...');
  let sawProgress = false;
  const result = await transcribe({
    binPath, modelPath, wavPath, outDir,
    language: 'en',
    onProgress: (pct) => { sawProgress = true; if (pct % 50 === 0) log('whisper progress: ' + pct + '%'); }
  });

  assert.ok(fs.existsSync(result.files.txt), 'TXT output exists');
  assert.ok(fs.existsSync(result.files.srt), 'SRT output exists');
  assert.ok(fs.existsSync(result.files.vtt), 'VTT output exists');
  assert.ok(sawProgress, 'progress callbacks fired');
  assert.ok(typeof result.text === 'string', 'text is a string');
  assert.ok(Array.isArray(result.segments), 'segments parsed from SRT');
  const vtt = fs.readFileSync(result.files.vtt, 'utf8');
  assert.ok(vtt.startsWith('WEBVTT'), 'VTT file has WEBVTT header');
  log('whisper output text: ' + JSON.stringify(result.text.slice(0, 80)));
  log('segments: ' + result.segments.length);

  // 6) SRT parser sanity on a known-good sample
  const sample = '1\n00:00:00,000 --> 00:00:02,500\nHello world\n\n2\n00:00:02,500 --> 00:00:04,000\nSecond line\n';
  const segs = parseSrt(sample);
  assert.strictEqual(segs.length, 2);
  assert.strictEqual(segs[0].text, 'Hello world');
  assert.strictEqual(segs[1].startMs, 2500);

  // 7) history store round-trip
  const hist = new History(WORK);
  hist.add({ id: 'abc', fileName: 'fixture.mp3', date: new Date().toISOString() });
  assert.strictEqual(hist.list().length, 1);
  assert.strictEqual(hist.get('abc').fileName, 'fixture.mp3');
  hist.remove('abc');
  assert.strictEqual(hist.list().length, 0);
  // history.json must be BOM-free valid JSON
  hist.add({ id: 'x' });
  JSON.parse(fs.readFileSync(path.join(WORK, 'history.json'), 'utf8'));

  log('ALL SMOKE TESTS PASSED');
})().catch((err) => {
  console.error('[smoke] FAILED:', err);
  process.exit(1);
});
