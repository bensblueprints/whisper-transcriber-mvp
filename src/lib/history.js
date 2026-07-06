'use strict';
/** Tiny JSON store for past transcriptions: <dataDir>/history.json */
const fs = require('fs');
const path = require('path');

class History {
  constructor(dataDir) {
    this.file = path.join(dataDir, 'history.json');
  }

  _load() {
    try {
      return JSON.parse(fs.readFileSync(this.file, 'utf8'));
    } catch (_) {
      return [];
    }
  }

  _save(items) {
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    fs.writeFileSync(this.file, JSON.stringify(items, null, 2));
  }

  list() {
    return this._load();
  }

  add(entry) {
    const items = this._load();
    items.unshift(entry);
    this._save(items.slice(0, 200));
    return entry;
  }

  get(id) {
    return this._load().find((e) => e.id === id) || null;
  }

  remove(id) {
    const items = this._load().filter((e) => e.id !== id);
    this._save(items);
  }
}

module.exports = { History };
