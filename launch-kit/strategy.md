# Launch Strategy — Whisper Transcriber

## Pricing

**$39 one-time** (launch price; list $49).

Competitor math: Otter.ai Pro is **$16.99/month** ($203.88/yr billed monthly, $100.20/yr annual).
- vs monthly: **pays for itself in under 3 months** (2.3 months).
- vs annual: pays for itself in under 5 months.
- Year-2 cost: Whisper Transcriber **$0**, Otter another $100–204.

The unlimited-minutes angle strengthens this: Otter Pro caps at 1,200 min/month and 90 min per conversation. Heavy users (podcasters, journalists doing long interviews) hit real walls that a local app simply doesn't have.

## Target communities (rules-aware angles)

- **r/podcasting** (~2M) — No blatant self-promo; participate first. Angle: answer "how do you make show notes / SRT subtitles cheaply" threads, mention the open-source repo (MIT) rather than the paid installer. Weekly promo threads allow direct links.
- **r/Journalism / r/freelanceWriters** — Self-promo is restricted; lead with the *privacy* problem: "cloud transcription services and source protection" discussion post, tool mentioned in comments when asked. The "your audio never leaves your machine" line resonates strongly here.
- **r/datacurious / r/selfhosted** (~500k) — Self-hosted culture loves local-first + open source. Angle: "I replaced my Otter subscription with a local whisper.cpp desktop app (MIT)". Share the GitHub repo directly — this community converts to the paid installer surprisingly well out of goodwill.
- **r/GetStudying / r/college** — Angle: transcribe recorded lectures into searchable notes; emphasize one-time student-friendly price. Check each sub's promo rules; usually fine when framed as "tool I built as a student would have loved".
- **r/software / r/opensource** — Straightforward "Show-off Saturday"-style posts of the repo; installer mentioned only in README.
- **Hacker News** — Show HN (draft below).
- **Indie Hackers + X (#buildinpublic)** — revenue-transparency posts do well; share launch numbers.

## Show HN draft

**Title:** Show HN: Whisper Transcriber – local, unlimited transcription desktop app (whisper.cpp)

**Body:**
I transcribe a lot of interviews and got tired of two things: paying $17/mo for Otter, and uploading sensitive recordings to a third-party cloud.

Whisper Transcriber is an Electron app around whisper.cpp + ffmpeg. Drag in any audio/video file (mp3/mp4/wav/m4a/mkv/…), it converts to 16 kHz WAV, runs Whisper locally on your CPU, and gives you a timestamped transcript with TXT/SRT/VTT export and a local history. First run downloads the whisper.cpp binary from the official GitHub releases and your chosen ggml model (tiny→medium) from Hugging Face; after that it's fully offline. No telemetry, no account.

Source is MIT: https://github.com/bensblueprints/whisper-transcriber (npm i && npm start). I sell a packaged one-click Windows installer for $39 one-time as the convenience option.

Known limitations I'd love feedback on: CPU-only by default (whisper.cpp cuBLAS builds exist — GPU toggle is on the roadmap), no speaker diarization yet, and medium is the largest model I expose in the picker.

## SEO keywords (10)

1. otter.ai alternative
2. offline transcription software
3. local whisper transcription app
4. transcribe audio to text offline
5. private transcription software
6. whisper.cpp gui windows
7. unlimited transcription no subscription
8. mp4 to srt converter local
9. transcription app one time purchase
10. transcribe interviews without uploading

## AppSumo / PitchGround pitch

Whisper Transcriber gives your audience the one thing every transcription SaaS refuses to sell: ownership. It's a polished Windows desktop app that runs OpenAI's Whisper model 100% locally — unlimited audio and video transcription with timestamped transcripts and TXT/SRT/VTT export, no minutes quota, no upload, no account. The market comparison writes its own copy: Otter.ai costs $204/year and caps users at 1,200 minutes a month; Whisper Transcriber is a single lifetime license with no caps at all, so it pays for itself in under three months. The privacy hook (journalists, lawyers, researchers, and podcasters whose recordings can't touch a third-party cloud) drives strong word-of-mouth, and the MIT-licensed source on GitHub gives buyers long-term confidence. Lifetime-deal audiences are exactly the "pay once, own it forever" buyers this product was built for.

## Launch sequence (suggested)

1. Publish GitHub repo + README polish (portfolio doubles as landing page).
2. Show HN on a Tuesday–Thursday morning ET.
3. Product Hunt the following week (assets in `product-hunt.md`).
4. Reddit drip over 2–3 weeks per community rules above.
5. X launch thread + #buildinpublic revenue updates.
6. Pitch AppSumo/PitchGround once 50+ organic sales prove conversion.
