# Scale Trainer

An installable, offline-first guitar and bass scale practice app. It generates deterministic 2NPS/3NPS positions, linked diagonals, and continuous full-neck paths, then schedules the metronome and reference instrument from absolute AudioContext frames.

## Requirements

- Node.js 22 or newer
- pnpm 10.18.3 (via Corepack)
- A browser with Web Audio and module Worker support

## Local development

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

Open `http://localhost:4321`. Press Start once to allow audio playback. Space starts or stops practice when a form control is not focused. Practice settings remain locked during playback. If the page becomes hidden, playback stops so a suspended AudioContext cannot leave the visual state stale.

## Validation

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
```

Unit and integration tests cover the pitch, theory, spelling, tuning, fretboard, path generation, seeded bags, exercises, absolute-tick timeline, round generation, DSP, clock mapping, and timing recorder. The browser suite verifies transport state, supported instruments, 0–24 fret rendering, and reload after the network is disabled.

## Audio and timing model

- `PPQN` is 960. Timeline events are integer ticks converted independently to context time; no previous-event floating-point accumulation is used.
- The AudioWorklet schedules at absolute AudioContext frames and uses the actual output block length.
- Visual state is recalculated from `getOutputTimestamp()` (or `currentTime` fallback) every animation frame. Animation frame count never advances the exercise.
- Stop clears future events and fades active voices. Backgrounding stops the session.
- Timing debug exposes the session seed and max/mean/P95/P99 deviation statistics. The operational acceptance target is P99 at or below 25 ms on the target device during a 30-minute run.

## Offline updates

The production build precaches the application shell, Worker, AudioWorklet, manifest, and icon. The service worker uses prompt-based updates: it never reloads while practice is playing, displays an update notice after playback stops, and activates only when Update is selected.

## Cloudflare deployment

`wrangler.jsonc` publishes `./dist` as Worker Static Assets. Configure `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` as GitHub Actions secrets. Pull requests run validation only; pushes to `main` validate and then run:

```sh
pnpm wrangler deploy
```

For a manual deployment, run `pnpm build` followed by the same Wrangler command from an authenticated environment.

## Security and privacy

The app has no server-side data store, analytics, external runtime assets, or user input that is rendered as HTML. Random session seeds come from `crypto.getRandomValues`; all in-session choices use the deterministic seeded generator. The CSP-compatible application does not use `eval`, and generated musical data stays in the browser.
