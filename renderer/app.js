'use strict';
/* Renderer logic — talks to main via window.api (preload bridge). */

const $ = (id) => document.getElementById(id);
const els = {
  model: $('modelSelect'),
  lang: $('langSelect'),
  badge: $('engineBadge'),
  setupBar: $('setupBar'),
  setupText: $('setupText'),
  setupFill: $('setupFill'),
  dropZone: $('dropZone'),
  browseBtn: $('browseBtn'),
  jobPanel: $('jobPanel'),
  jobName: $('jobName'),
  jobPhase: $('jobPhase'),
  jobFill: $('jobFill'),
  jobPct: $('jobPct'),
  resultPanel: $('resultPanel'),
  resultTitle: $('resultTitle'),
  resultMeta: $('resultMeta'),
  segments: $('segments'),
  copyBtn: $('copyBtn'),
  openFolderBtn: $('openFolderBtn'),
  historyList: $('historyList'),
  historyEmpty: $('historyEmpty'),
  toast: $('toast')
};

let current = null; // { entry, text, segments }
let toastTimer = null;

function toast(msg, isError) {
  els.toast.textContent = msg;
  els.toast.classList.toggle('error', !!isError);
  els.toast.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => els.toast.classList.add('hidden'), 3500);
}

function fmtBytes(n) {
  if (!n) return '';
  const mb = n / (1024 * 1024);
  return mb >= 1024 ? (mb / 1024).toFixed(2) + ' GB' : mb.toFixed(1) + ' MB';
}

function fmtDur(sec) {
  if (sec == null) return '';
  sec = Math.round(sec);
  const m = Math.floor(sec / 60), s = sec % 60;
  return `${m}m ${String(s).padStart(2, '0')}s`;
}

/* ---------- engine badge ---------- */
async function refreshBadge() {
  try {
    const st = await window.api.setupStatus();
    const model = els.model.value;
    const ready = st.binaryInstalled && st.models[model] && st.models[model].installed;
    els.badge.textContent = ready
      ? `engine ready · whisper.cpp ${st.whisperVersion} · ${model}`
      : `will download on first run (${model}: ~${st.models[model].sizeMB} MB)`;
    els.badge.className = 'badge ' + (ready ? 'badge-ok' : 'badge-warn');
  } catch (e) {
    els.badge.textContent = 'engine: unknown';
  }
}
els.model.addEventListener('change', refreshBadge);

/* ---------- download progress ---------- */
window.api.onSetupProgress((p) => {
  if (p.stage === 'done') { els.setupBar.classList.add('hidden'); refreshBadge(); return; }
  els.setupBar.classList.remove('hidden');
  const label = p.stage === 'binary'
    ? 'Downloading Whisper engine (one-time)'
    : `Downloading model ${p.model || ''} (one-time)`;
  els.setupText.textContent = `${label} — ${fmtBytes(p.received)}${p.total ? ' / ' + fmtBytes(p.total) : ''}`;
  els.setupFill.style.width = (p.pct != null ? p.pct : 30) + '%';
});

/* ---------- job progress ---------- */
window.api.onJobStatus((s) => {
  els.jobPhase.textContent = s.detail || s.phase;
  if (s.phase === 'done') els.jobFill.style.width = '100%';
});
window.api.onJobProgress((p) => {
  els.jobFill.style.width = p.pct + '%';
  els.jobPct.textContent = p.pct + '%';
});

/* ---------- transcription flow ---------- */
async function startTranscription(filePath) {
  if (!filePath) return;
  els.jobPanel.classList.remove('hidden');
  els.resultPanel.classList.add('hidden');
  els.jobName.textContent = filePath.split(/[\\/]/).pop();
  els.jobFill.style.width = '0%';
  els.jobPct.textContent = '0%';
  els.browseBtn.disabled = true;
  try {
    const res = await window.api.transcribe(filePath, els.model.value, els.lang.value);
    current = res;
    showResult(res);
    await renderHistory(res.entry.id);
    toast('Transcription complete');
  } catch (err) {
    toast(String(err.message || err).replace(/^Error invoking remote method '[^']+': Error: /, ''), true);
  } finally {
    els.browseBtn.disabled = false;
    els.jobPanel.classList.add('hidden');
    els.setupBar.classList.add('hidden');
    refreshBadge();
  }
}

function showResult(res) {
  els.resultPanel.classList.remove('hidden');
  els.resultTitle.textContent = res.entry.fileName;
  const meta = [
    new Date(res.entry.date).toLocaleString(),
    'model: ' + res.entry.model,
    res.entry.language !== 'auto' ? 'lang: ' + res.entry.language : 'lang: auto',
    res.entry.durationSec != null ? 'audio: ' + fmtDur(res.entry.durationSec) : null,
    res.entry.elapsedMs != null ? 'took: ' + fmtDur(res.entry.elapsedMs / 1000) : null
  ].filter(Boolean).join('  ·  ');
  els.resultMeta.textContent = meta;

  els.segments.innerHTML = '';
  if (!res.segments || res.segments.length === 0) {
    const div = document.createElement('div');
    div.className = 'seg';
    div.innerHTML = '<div class="seg-text"></div>';
    div.querySelector('.seg-text').textContent = res.text || '(no speech detected)';
    els.segments.appendChild(div);
    return;
  }
  for (const seg of res.segments) {
    const div = document.createElement('div');
    div.className = 'seg';
    const t = document.createElement('div');
    t.className = 'seg-time';
    t.textContent = seg.start.replace(/,\d+$/, '');
    const x = document.createElement('div');
    x.className = 'seg-text';
    x.textContent = seg.text;
    div.append(t, x);
    els.segments.appendChild(div);
  }
}

/* ---------- drag & drop / browse ---------- */
// stop Electron from navigating when a file is dropped outside the dropzone
window.addEventListener('dragover', (e) => e.preventDefault());
window.addEventListener('drop', (e) => e.preventDefault());

['dragenter', 'dragover'].forEach((ev) =>
  els.dropZone.addEventListener(ev, (e) => {
    e.preventDefault();
    els.dropZone.classList.add('drag');
  })
);
['dragleave', 'drop'].forEach((ev) =>
  els.dropZone.addEventListener(ev, (e) => {
    e.preventDefault();
    els.dropZone.classList.remove('drag');
  })
);
els.dropZone.addEventListener('drop', (e) => {
  const file = e.dataTransfer.files && e.dataTransfer.files[0];
  if (!file) return;
  const p = window.api.pathForFile(file);
  if (p) startTranscription(p);
});
els.browseBtn.addEventListener('click', async () => {
  const p = await window.api.pickFile();
  if (p) startTranscription(p);
});

/* ---------- copy / export ---------- */
els.copyBtn.addEventListener('click', async () => {
  if (!current) return;
  await navigator.clipboard.writeText(current.text || '');
  toast('Transcript copied to clipboard');
});
document.querySelectorAll('[data-export]').forEach((btn) =>
  btn.addEventListener('click', async () => {
    if (!current) return;
    try {
      const saved = await window.api.exportSave(current.entry.id, btn.dataset.export);
      if (saved) toast('Saved ' + saved);
    } catch (err) {
      toast(String(err.message || err), true);
    }
  })
);
els.openFolderBtn.addEventListener('click', () => {
  if (current) window.api.openFolder(current.entry.outDir);
});

/* ---------- history ---------- */
async function renderHistory(activeId) {
  const items = await window.api.historyList();
  els.historyList.innerHTML = '';
  els.historyEmpty.classList.toggle('hidden', items.length > 0);
  for (const it of items) {
    const li = document.createElement('li');
    li.className = 'history-item' + (it.id === activeId ? ' active' : '');
    const name = document.createElement('div');
    name.className = 'hi-name';
    name.textContent = it.fileName;
    const meta = document.createElement('div');
    meta.className = 'hi-meta';
    meta.textContent = new Date(it.date).toLocaleString() + ' · ' + it.model;
    const del = document.createElement('button');
    del.className = 'hi-del';
    del.title = 'Delete';
    del.textContent = '✕';
    del.addEventListener('click', async (e) => {
      e.stopPropagation();
      await window.api.historyDelete(it.id);
      if (current && current.entry.id === it.id) {
        current = null;
        els.resultPanel.classList.add('hidden');
      }
      renderHistory(current ? current.entry.id : null);
    });
    li.append(name, meta, del);
    li.addEventListener('click', async () => {
      try {
        const res = await window.api.historyLoad(it.id);
        current = res;
        showResult(res);
        renderHistory(it.id);
      } catch (err) {
        toast(String(err.message || err), true);
      }
    });
    els.historyList.appendChild(li);
  }
}

/* ---------- boot ---------- */
refreshBadge();
renderHistory(null);
