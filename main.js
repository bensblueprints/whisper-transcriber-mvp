'use strict';
const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const os = require('os');

const dl = require('./src/lib/download');
const { toWav16k, probeDuration } = require('./src/lib/transcode');
const { transcribe } = require('./src/lib/whisper');
const { History } = require('./src/lib/history');

const SMOKE = process.argv.includes('--smoke');
let win = null;
let history = null;
let dataDir = null;
let busy = false;

function send(channel, payload) {
  if (win && !win.isDestroyed()) win.webContents.send(channel, payload);
}

function createWindow() {
  win = new BrowserWindow({
    width: 1100,
    height: 760,
    minWidth: 860,
    minHeight: 600,
    backgroundColor: '#0b0e14',
    autoHideMenuBar: true,
    title: 'Whisper Transcriber',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  if (SMOKE) {
    win.webContents.once('did-finish-load', () => {
      console.log('[smoke] renderer loaded OK');
      setTimeout(() => app.quit(), 500);
    });
  }
}

app.whenReady().then(() => {
  dataDir = app.getPath('userData');
  history = new History(dataDir);
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

/* ---------------- IPC ---------------- */

// Setup status: which assets are already downloaded
ipcMain.handle('setup:status', () => {
  const models = {};
  for (const name of Object.keys(dl.MODELS)) {
    models[name] = { installed: !!dl.modelPath(dataDir, name), sizeMB: dl.MODELS[name].sizeMB };
  }
  return {
    binaryInstalled: !!dl.whisperBinaryPath(dataDir),
    whisperVersion: dl.WHISPER_VERSION,
    models,
    dataDir
  };
});

// Download binary and/or model with progress events
ipcMain.handle('setup:ensure', async (_e, { model }) => {
  const onProgress = (p) => {
    send('setup:progress', {
      stage: p.stage,
      model: p.model || null,
      received: p.received,
      total: p.total,
      pct: p.total ? Math.round((p.received / p.total) * 100) : null
    });
  };
  const binPath = await dl.ensureWhisperBinary(dataDir, onProgress);
  const modelPath = await dl.ensureModel(dataDir, model, onProgress);
  send('setup:progress', { stage: 'done' });
  return { binPath, modelPath };
});

ipcMain.handle('dialog:pickFile', async () => {
  const res = await dialog.showOpenDialog(win, {
    properties: ['openFile'],
    filters: [
      { name: 'Audio / Video', extensions: ['mp3', 'wav', 'm4a', 'mp4', 'mov', 'mkv', 'webm', 'flac', 'ogg', 'aac', 'wma', 'avi', 'opus', 'aiff'] },
      { name: 'All files', extensions: ['*'] }
    ]
  });
  return res.canceled ? null : res.filePaths[0];
});

ipcMain.handle('transcribe:start', async (_e, { filePath, model, language }) => {
  if (busy) throw new Error('A transcription is already running.');
  if (!filePath || !fs.existsSync(filePath)) throw new Error('File not found: ' + filePath);
  busy = true;
  const id = crypto.randomBytes(8).toString('hex');
  const jobDir = path.join(dataDir, 'transcripts', id);
  try {
    // 1) make sure assets exist (no-op if already downloaded)
    send('job:status', { id, phase: 'setup', detail: 'Checking Whisper engine & model...' });
    const binPath = await dl.ensureWhisperBinary(dataDir, (p) => send('setup:progress', {
      stage: p.stage, received: p.received, total: p.total,
      pct: p.total ? Math.round((p.received / p.total) * 100) : null
    }));
    const modelPath = await dl.ensureModel(dataDir, model, (p) => send('setup:progress', {
      stage: p.stage, model, received: p.received, total: p.total,
      pct: p.total ? Math.round((p.received / p.total) * 100) : null
    }));

    // 2) convert to 16k mono wav
    send('job:status', { id, phase: 'convert', detail: 'Converting to 16 kHz WAV...' });
    const wavPath = path.join(jobDir, 'input-16k.wav');
    await toWav16k(filePath, wavPath);
    const duration = await probeDuration(wavPath);

    // 3) run whisper
    send('job:status', { id, phase: 'transcribe', detail: 'Transcribing locally...' });
    const started = Date.now();
    const result = await transcribe({
      binPath,
      modelPath,
      wavPath,
      outDir: jobDir,
      language: language || 'auto',
      threads: Math.max(2, Math.min(8, os.cpus().length - 1)),
      onProgress: (pct) => send('job:progress', { id, pct })
    });

    // 4) persist history
    const entry = {
      id,
      file: filePath,
      fileName: path.basename(filePath),
      date: new Date().toISOString(),
      model,
      language: language || 'auto',
      durationSec: duration,
      elapsedMs: Date.now() - started,
      outDir: jobDir,
      textPreview: result.text.slice(0, 160)
    };
    history.add(entry);
    try { fs.unlinkSync(wavPath); } catch (_) { /* keep transcripts, drop temp wav */ }

    send('job:status', { id, phase: 'done', detail: 'Done' });
    return { entry, text: result.text, segments: result.segments };
  } finally {
    busy = false;
  }
});

ipcMain.handle('history:list', () => history.list());

ipcMain.handle('history:load', (_e, id) => {
  const entry = history.get(id);
  if (!entry) throw new Error('History entry not found');
  const base = path.join(entry.outDir, 'output');
  const text = fs.existsSync(base + '.txt') ? fs.readFileSync(base + '.txt', 'utf8').trim() : '';
  const srt = fs.existsSync(base + '.srt') ? fs.readFileSync(base + '.srt', 'utf8') : '';
  const { parseSrt } = require('./src/lib/srt');
  return { entry, text, segments: parseSrt(srt) };
});

ipcMain.handle('history:delete', (_e, id) => {
  const entry = history.get(id);
  if (entry && entry.outDir && fs.existsSync(entry.outDir)) {
    fs.rmSync(entry.outDir, { recursive: true, force: true });
  }
  history.remove(id);
  return history.list();
});

ipcMain.handle('export:save', async (_e, { id, format }) => {
  const entry = history.get(id);
  if (!entry) throw new Error('Nothing to export');
  const src = path.join(entry.outDir, 'output.' + format);
  if (!fs.existsSync(src)) throw new Error('No ' + format.toUpperCase() + ' output for this transcription');
  const base = entry.fileName.replace(/\.[^.]+$/, '');
  const res = await dialog.showSaveDialog(win, {
    defaultPath: path.join(app.getPath('documents'), `${base}.${format}`),
    filters: [{ name: format.toUpperCase(), extensions: [format] }]
  });
  if (res.canceled) return null;
  fs.copyFileSync(src, res.filePath);
  return res.filePath;
});

ipcMain.handle('shell:openFolder', (_e, dir) => {
  if (dir && fs.existsSync(dir)) shell.openPath(dir);
});
