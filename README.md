# Whisper Transcriber

## Demo

VIDEO-PLACEHOLDER

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Unlimited local audio & video transcription. Pay once, own it forever. No subscription. Your audio never leaves your machine.**

Whisper Transcriber is a desktop app that does what Otter.ai charges **$17/month** for — but 100% locally, powered by [whisper.cpp](https://github.com/ggml-org/whisper.cpp) (OpenAI's Whisper model running natively on your CPU). Drop in any audio or video file, get back an accurate, timestamped transcript. No upload, no account, no per-minute limits, no monthly bill.

![Screenshot](docs/screenshot.png)

## ☕ Skip the setup — get the 1-click installer

Don't want to touch a terminal? Grab the packaged Windows installer (one-time purchase, lifetime updates):

**→ [https://whop.com/benjisaiempire/whisperdesk](https://whop.com/benjisaiempire/whisperdesk)**

The source here is MIT-licensed and always will be — the installer is just the convenient, pre-packaged version.

## Features

- 🎙️ **Drag & drop anything** — mp3, wav, m4a, mp4, mov, mkv, flac, ogg, webm… video is handled too (audio is extracted automatically)
- 🔒 **100% private** — transcription runs entirely on your machine; nothing is ever uploaded
- ♾️ **Unlimited** — no minutes cap, no monthly quota; transcribe 10 hours a day if you want
- 🧠 **Model picker** — tiny / base / small / medium (English-only or multilingual), downloaded once from Hugging Face
- 🌍 **Language auto-detect** or force English
- 📊 **Live progress** — real-time percentage while Whisper works
- 📝 **Timestamped transcript view** with one-click copy
- 💾 **Export TXT, SRT, VTT** — ready for subtitles, notes, or your editor
- 🕘 **History** — every transcription saved locally, reload it any time

## Quick start

```bash
git clone https://github.com/bensblueprints/whisper-transcriber
cd whisper-transcriber
npm i
npm start
```

On first transcription the app downloads two things (with a visible progress bar):

1. The prebuilt **whisper.cpp** Windows binary (~8 MB) from the official GitHub releases
2. Your chosen **Whisper model** (~78 MB for tiny, ~148 MB for base) from Hugging Face

After that, everything is offline.

## How it compares

| | **Whisper Transcriber** | Otter.ai |
|---|---|---|
| Price | **$39 one-time** | $16.99/month, forever |
| Cost after 1 year | **$39** | ~$204 |
| Transcription limit | **Unlimited** | 1,200 min/mo (Pro) |
| Max file length | **Unlimited** | 90 min per conversation |
| Privacy | **Audio never leaves your PC** | Uploaded to their cloud |
| Works offline | **Yes** | No |
| Video files | **Yes (audio auto-extracted)** | Limited |
| SRT/VTT subtitle export | **Yes** | Paid tiers |
| Account required | **No** | Yes |

*Pays for itself in under 3 months.*

## Tech stack

- **Electron** — main + preload + renderer, plain HTML/CSS/JS (no framework bloat)
- **whisper.cpp** — OpenAI Whisper inference in C++, CPU-native (GPU builds also available upstream)
- **ffmpeg-static** — bundled ffmpeg converts any input to the 16 kHz mono WAV Whisper expects
- **ggml models** — official quantized weights from `ggerganov/whisper.cpp` on Hugging Face

## Scripts

| Command | What it does |
|---|---|
| `npm start` | Launch the app |
| `npm test` | End-to-end smoke test: downloads the real binary + tiny model, generates a fixture with ffmpeg, runs the full pipeline, asserts TXT/SRT/VTT outputs |
| `npm run dist` | Build the Windows NSIS installer (electron-builder) |

## Privacy

No telemetry. No analytics. No network calls at all except the two one-time downloads above (whisper.cpp binary from GitHub, model weights from Hugging Face), both clearly surfaced in the UI. Transcripts are stored as plain files in your local app-data folder.

## License

[MIT](LICENSE) © 2026 Ben (bensblueprints)

## macOS build

See [MAC-BUILD.md](MAC-BUILD.md). Quickest path: GitHub **Actions** tab -> run the **Mac Build** (`mac-build.yml`) workflow to get a downloadable `.dmg` (unsigned - right-click -> Open on first launch).
