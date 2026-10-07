# Task 10: Seeded RNG

対象: `src/domain/random/rng.ts`

Math.random()は禁止。

実装:
```ts
export interface SeededRng {
  next(): number
  nextInt(maxExclusive: number): number
}
export function createSeededRng(seed: number): SeededRng
export function shuffleSeeded<T>(values: readonly T[], rng: SeededRng): T[]
export function randomSeed(): number
```

shuffleはFisher-Yates。
同seedは完全同一sequence。別seedは異なるsequenceになり得る。
`randomSeed()`だけは `crypto.getRandomValues` 等で新seed生成可。Exercise中のrandomnessはSeededRngのみ使用。
