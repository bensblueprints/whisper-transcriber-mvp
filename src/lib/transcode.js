'use strict';
/**
 * Convert any audio/video input to 16 kHz mono WAV (what whisper.cpp expects)
 * using the bundled ffmpeg-static binary. 100% local.
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

function ffmpegPath() {
  // ffmpeg-static resolves to the platform binary inside node_modules.
  // In a packaged app the module lives in app.asar.unpacked (see package.json build config).
  const p = require('ffmpeg-static');
  return p.replace('app.asar' + path.sep, 'app.asar.unpacked' + path.sep);
}

function run(bin, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { windowsHide: true });
    let stderr = '';
    child.stderr.on('data', (d) => { stderr += d.toString(); });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited with code ${code}:\n${stderr.slice(-2000)}`));
    });
  });
}

/** Convert input media file to 16kHz mono s16 WAV at outPath. */
async function toWav16k(inputPath, outPath) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  await run(ffmpegPath(), [
    '-y', '-hide_banner', '-loglevel', 'error',
    '-i', inputPath,
    '-vn',
    '-ac', '1',
    '-ar', '16000',
    '-c:a', 'pcm_s16le',
    outPath
  ]);
  return outPath;
}

/** Duration of a media file in seconds (parsed from ffmpeg -i output). */
function probeDuration(inputPath) {
  return new Promise((resolve) => {
    const child = spawn(ffmpegPath(), ['-hide_banner', '-i', inputPath], { windowsHide: true });
    let stderr = '';
    child.stderr.on('data', (d) => { stderr += d.toString(); });
    child.on('error', () => resolve(null));
    child.on('close', () => {
      const m = stderr.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
      if (!m) return resolve(null);
      resolve(Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]));
    });
  });
}

module.exports = { ffmpegPath, toWav16k, probeDuration };
