'use strict';
/** Minimal SRT parser -> [{ index, start, end, startMs, endMs, text }] */

function tsToMs(ts) {
  const m = ts.trim().match(/(\d+):(\d+):(\d+)[,.](\d+)/);
  if (!m) return 0;
  return Number(m[1]) * 3600000 + Number(m[2]) * 60000 + Number(m[3]) * 1000 + Number(m[4]);
}

function parseSrt(srt) {
  const segments = [];
  const blocks = srt.replace(/\r/g, '').split(/\n\n+/);
  for (const block of blocks) {
    const lines = block.split('\n').filter((l) => l.trim() !== '');
    if (lines.length < 2) continue;
    let i = 0;
    if (/^\d+$/.test(lines[0].trim())) i = 1; // sequence number line
    const time = lines[i] && lines[i].match(/(.+?)\s*-->\s*(.+)/);
    if (!time) continue;
    const text = lines.slice(i + 1).join('\n').trim();
    segments.push({
      index: segments.length + 1,
      start: time[1].trim(),
      end: time[2].trim(),
      startMs: tsToMs(time[1]),
      endMs: tsToMs(time[2]),
      text
    });
  }
  return segments;
}

module.exports = { parseSrt, tsToMs };
