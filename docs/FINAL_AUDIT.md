# Final implementation audit

Audit date: 2026-10-07. The source, tests, production output, service-worker manifest, dependency report, and Cloudflare dry run were inspected directly.

## Requirements

| Requirement | Implementation | Test or evidence | Status |
| --- | --- | --- | --- |
| Web Audio master clock | Absolute AudioContext frames in `practiceAudio.ts` and `practiceProcessor.ts` | Chromium Start/Stop E2E | PASS |
| Output timestamp mapping | `getClockSnapshot`, latency-aware audible-time estimate | clock unit tests | PASS |
| No accumulated floating-point time | Tick-to-time conversion always starts from session origin | BPM 40/100/220 and 960,000-tick tests | PASS |
| No timer master clock | Visual state is queried by animation frame; audio is worklet-driven | prohibited-pattern source scan | PASS |
| PPQN 960 and bar padding | Integer tick constants, absolute events, bar-aligned descending attack | timeline unit tests | PASS |
| 3NPS / 2NPS | Generated from scale intervals for diatonic / pentatonic scales | exact C major and E minor pentatonic tests | PASS |
| Drop/custom tuning | Presets, octave inference, non-re-entrant validation | Drop D, DADGBE, bass 4/5/6 tests | PASS |
| Position enumeration | Complete 0–24 fret positions, sorted, octave shapes retained | position unit tests | PASS |
| Linked connectors | Intervals 1/2/3, strict ascending scale degrees, reverse descent | linked-path unit tests | PASS |
| Continuous A/B/C | Hard-constrained seeded candidates and distinct scoring modes | deterministic and distinct-path tests | PASS |
| Weighted bag 100 | 72 base entries plus 28 weighted entries | exact count/weight tests | PASS |
| Position bag | Per-combination state persists in the Worker and refills without boundary repeat | bag and 18-round session tests | PASS |
| Seed reproducibility | Mulberry-style seeded generator; cryptographic seed only at session creation | RNG and round equality tests | PASS |
| Random Position | Invalid combinations skip with debug record; valid position is drawn from stateful bag | round integration tests | PASS |
| Full Neck | Ordered positions + linked A/B/C + distinct continuous A/B/C, with two-bar gaps | full-neck integration test | PASS |
| Announcement / preview | One-bar announcement and preview events; path visible before first note | timeline tests and UI E2E | PASS |
| Reference slot / hold | Standard note events use 80%; padded final note extends to the bar and controls voice release frames | timeline tests and generated worklet inspection | PASS |
| AudioWorklet scheduling | Actual block length, absolute target frames, future queue, accent, stop fade | production chunk inspection and browser Start/Stop | PASS |
| Worker isolation / prefetch | Typed request IDs, stale response rejection, stateful next-round prefetch | Worker client tests and UI E2E | PASS |
| Fretboard UI | 0–24, equal-width frets, highest string on top, circles only, required colors/rings | Chromium DOM E2E | PASS |
| Transport / Wake Lock / background | Space transport, locked settings, wake lock, stop on hidden | Chromium interaction and hidden-state E2E | PASS |
| PWA offline | App shell, Worker, AudioWorklet, manifest, and icon are precached | offline reload E2E and `sw.js` inspection | PASS |
| Prompted service-worker update | Notice is hidden during play; activation/reload occurs only on Update | component logic and production build | PASS |
| Timing debug | Seed plus max/mean/P95/P99, output timestamp and dropped-frame samples | recorder unit tests and UI integration | PASS |
| Cloudflare static assets | Astro static output and `wrangler.jsonc` assets directory | Wrangler deploy dry run | PASS |
| CI | Frozen install, lint, typecheck, tests, build, main-only deploy | workflow inspection | PASS |
| Security | CSP and hardening headers, no external runtime assets, patched dependencies | production audit: no known vulnerabilities | PASS |

## Exported function test coverage

Legend: H = happy path, B = boundary, F = invalid/failure path, N/A = total function with no invalid input contract.

| Exported API | H | B | F | Test file |
| --- | --- | --- | --- | --- |
| `mod12`, `midiToPitchClass`, `midiToOctave` | yes | yes | yes | `music.test.ts` |
| `pitchClassDistanceUp`, `nearestMidiForPitchClass` | yes | yes | yes | `music.test.ts` |
| `frequencyFromMidi` | yes | yes | yes | `music.test.ts` |
| `getScaleIntervals`, `getScalePitchClasses` | yes | yes | N/A | `music.test.ts` |
| `isPitchClassInScale`, `getScaleDegree` | yes | yes | N/A | `music.test.ts` |
| `getNextScaleMidi`, `generateAscendingScaleMidi` | yes | yes | yes | `music.test.ts` |
| `chooseTonicSpelling`, `spellScale` | yes | yes | N/A | `music.test.ts` |
| `getTuningPresets`, `inferCustomTuningMidi`, `validateTuning` | yes | yes | yes | `music.test.ts` |
| `midiAtFret`, `fretForMidi`, `buildFretboard`, `findScaleLocations` | yes | yes | yes | `fretboard.test.ts` |
| `getNotesPerString`, `generatePositionFromStartMidi` | yes | yes | yes | `fretboard.test.ts` |
| `enumeratePositions`, `validatePosition` | yes | yes | yes | `fretboard.test.ts` |
| `generateLinkedDiagonal`, `generateAllLinkedDiagonals` | yes | yes | yes | `paths.test.ts` |
| `generateContinuousCandidates` | yes | yes | N/A | `paths.test.ts` |
| `calculateContinuousMetrics` | yes | yes | N/A | `paths.test.ts` |
| `scorePlayability`, `scoreBalanced`, `scoreHorizontal` | yes | yes | N/A | `paths.test.ts` |
| `selectDistinctContinuousPaths` | yes | yes | yes | `paths.test.ts` |
| `createSeededRng`, `shuffleSeeded`, `randomSeed` | yes | yes | yes | `practice.test.ts` |
| `getScaleWeight` | yes | yes | N/A | `practice.test.ts` |
| `buildWeightedScaleBag`, `shuffleScaleBag`, `preventBoundaryDuplicate` | yes | yes | yes | `practice.test.ts` |
| `createPositionBagKey`, `createPositionBag`, `drawPosition`, `refillPositionBag` | yes | yes | yes | `practice.test.ts`, `round-state.test.ts` |
| `createNormalPattern`, `createSlidingWindowPattern` | yes | yes | yes | `practice.test.ts` |
| `createAscendingExercise`, `createDescendingExercise` | yes | yes | N/A | `practice.test.ts` |
| `ticksPerExerciseNote`, `alignTickToNextBar` | yes | yes | yes | `timeline-round-audio.test.ts` |
| `buildExerciseTimeline` | yes | yes | N/A | `timeline-round-audio.test.ts` |
| `tickToContextTime`, `timelineDurationSeconds` | yes | yes | yes | `timeline-round-audio.test.ts` |
| `generateRandomPositionRound`, `generateFullNeckRound`, `generateNextRound` | yes | yes | yes | `timeline-round-audio.test.ts`, `round-state.test.ts` |
| `getSynthParameters`, `createKarplusStrongVoice` | yes | yes | yes | `timeline-round-audio.test.ts` |
| `getClockSnapshot`, `estimateAudibleContextTime` | yes | yes | N/A | `timeline-round-audio.test.ts` |
| `timelineTickAtContextTime`, `getVisualStateAtTick` | yes | yes | yes | `timeline-round-audio.test.ts` |
| `calculateTimingStats`, `recordTimingSample`, `createTimingRecorder` | yes | yes | yes | `timeline-round-audio.test.ts` |
| `ExerciseWorkerClient.init`, `generateNext`, `dispose` | yes | yes | yes | `worker-client.test.ts` |
| `PracticeAudioEngine.start`, `setVolumes`, `stop`, `dispose` | yes | yes | yes | Chromium E2E |

## Source and artifact scan

- No production use of unseeded random APIs, interval/timer master clocks, dynamic HTML injection, or external runtime URLs.
- No unfinished implementation markers were found in `src`, `tests`, CI, or application documentation.
- The production service worker precaches the Worker and AudioWorklet chunks.
- `git diff` is not meaningful for this directory because the enclosing Git repository is `/home/ichiken` and its local exclude rule ignores the entire workspace. File-by-file source review, `git diff --check`, generated-artifact inspection, and the validation suite were used instead.

## Missing implementation

None.
