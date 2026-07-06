'use strict';
/**
 * Run whisper-cli.exe against a 16kHz WAV and collect TXT/SRT/VTT output.
 * Progress is parsed from whisper.cpp's --print-progress stderr lines:
 *   "whisper_print_progress_callback: progress =  15%"
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { parseSrt } = require('./srt');

/**
 * @param {object} opts
 * @param {string} opts.binPath   whisper-cli.exe
 * @param {string} opts.modelPath ggml model file
 * @param {string} opts.wavPath   16kHz mono wav
 * @param {string} opts.outDir    directory to write output.{txt,srt,vtt}
 * @param {string} [opts.language] 'auto' | 'en' | ...
 * @param {number} [opts.threads]
 * @param {(pct:number)=>void} [opts.onProgress]
 * @returns {Promise<{text:string, srt:string, vtt:string, segments:Array, files:{txt:string,srt:string,vtt:string}}>}
 */
function transcribe(opts) {
  const { binPath, modelPath, wavPath, outDir, language = 'auto', threads, onProgress } = opts;
  fs.mkdirSync(outDir, { recursive: true });
  const outBase = path.join(outDir, 'output');
  const args = [
    '-m', modelPath,
    '-f', wavPath,
    '-l', language,
    '-otxt', '-osrt', '-ovtt',
    '-of', outBase,
    '--print-progress'
  ];
  if (threads) args.push('-t', String(threads));

  return new Promise((resolve, reject) => {
    const child = spawn(binPath, args, { windowsHide: true, cwd: path.dirname(binPath) });
    let stderr = '';
    child.stderr.on('data', (d) => {
      const s = d.toString();
      stderr += s;
      if (onProgress) {
        // may contain several progress lines per chunk — take the last
        const matches = s.match(/progress\s*=\s*(\d+)%/g);
        if (matches) {
          const last = matches[matches.length - 1].match(/(\d+)%/);
          if (last) onProgress(Number(last[1]));
        }
      }
    });
    child.stdout.resume(); // drain
    child.on('error', reject);
    child.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`whisper-cli exited with code ${code}:\n${stderr.slice(-3000)}`));
      }
      try {
        const files = { txt: outBase + '.txt', srt: outBase + '.srt', vtt: outBase + '.vtt' };
        for (const f of Object.values(files)) {
          if (!fs.existsSync(f)) throw new Error('Expected output file missing: ' + f);
        }
        const text = fs.readFileSync(files.txt, 'utf8').trim();
        const srt = fs.readFileSync(files.srt, 'utf8');
        const vtt = fs.readFileSync(files.vtt, 'utf8');
        if (onProgress) onProgress(100);
        resolve({ text, srt, vtt, segments: parseSrt(srt), files });
      } catch (err) {
        reject(err);
      }
    });
  });
}

module.exports = { transcribe };
