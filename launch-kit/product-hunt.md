# Product Hunt Launch — Whisper Transcriber

## Name
Whisper Transcriber

## Tagline (60 chars max)
Unlimited local transcription. Pay once, never upload audio.
<!-- 59 chars -->

## Description (260 chars max)
Whisper Transcriber turns any audio or video file into an accurate, timestamped transcript — 100% on your own machine. No upload, no account, no monthly bill. Powered by whisper.cpp. Export TXT/SRT/VTT. $39 once instead of $17/mo for Otter.
<!-- ~240 chars -->

## Full description

Whisper Transcriber is a desktop app for people who transcribe a lot and are tired of two things: paying a subscription every month, and uploading sensitive recordings to someone else's cloud.

Drop in any file — an interview mp3, a podcast wav, a lecture mp4, a Zoom mkv — and OpenAI's Whisper model (via the excellent whisper.cpp) transcribes it entirely on your CPU. Your audio never leaves your machine. There's no account, no minutes quota, no per-file length cap.

**What you get:**
- Drag & drop any audio or video format (ffmpeg converts it automatically)
- Model picker: tiny → medium, English-only or multilingual, downloaded once
- Live progress bar while Whisper works
- Timestamped transcript view with one-click copy
- Export TXT, SRT, and VTT (subtitles ready for any editor)
- Local history of every transcription

**Who it's for:** journalists protecting sources, podcasters cutting show notes and subtitles, students transcribing lectures, researchers with confidential interviews — anyone whose audio shouldn't live on a subscription company's servers.

The code is MIT and open source. The one-time purchase is the polished 1-click Windows installer — pay once, own it forever.

## Maker first comment

Hey hunters 👋

I got tired of paying $17/mo to Otter just to transcribe interviews — that's $200+ a year for something my own computer can do for free. And honestly, the bigger issue for me was that every sensitive recording had to be uploaded to their cloud first.

So I built Whisper Transcriber: whisper.cpp + ffmpeg wrapped in a clean desktop app. You drag a file in, it transcribes locally, you export TXT/SRT/VTT. That's the whole product, and that's the point.

Honest notes:
- First run downloads the Whisper model (~78–148 MB) — after that it's fully offline.
- CPU transcription of a 1-hour file takes a few minutes with the base model, not seconds. For me that trade is worth it for the privacy and $0 marginal cost.
- Source is MIT on GitHub — you can run it free with `npm start`. The $39 gets you the 1-click installer and lifetime updates.

Would love to hear what model sizes / languages you'd want next.

## Gallery shots (5)

1. **Hero shot** — Main window in dark mode: drag-drop zone glowing on hover, sidebar history visible, tagline overlay "Your audio never leaves your machine."
2. **Transcription in progress** — A real mp4 file mid-transcription, progress bar at 47%, phase label "Transcribing locally…" to show live feedback.
3. **Transcript view** — Finished timestamped transcript of an interview with the Copy/TXT/SRT/VTT buttons highlighted.
4. **Model picker close-up** — The model dropdown open (tiny → medium) with the one-time download progress bar underneath, caption "Download once. Offline forever."
5. **Comparison card** — Simple graphic: "Otter.ai: $204/yr, uploads your audio ❌ vs Whisper Transcriber: $39 once, 100% local ✅ — pays for itself in under 3 months."
