# Task 11: Weighted Scale Shuffle Bag

対象: `src/domain/practice/scaleWeights.ts`, `src/domain/practice/weightedBag.ts`

`GENERAL_GUITAR_BASS_WEIGHTS` を定義。

Weight 2:
- Major: C G D A E F
- Natural Minor: A E B F# C# D
- Harmonic Minor: A E D B
- Melodic Minor: なし
- Major Pentatonic: C G D A E F
- Minor Pentatonic: E A D G B C

実装:
```ts
export function getScaleWeight(root: PitchClass, scaleType: ScaleType): 1 | 2
export function buildWeightedScaleBag(selectedScale: ScaleType | "random"): readonly ScaleCombination[]
export function shuffleScaleBag(bag: readonly ScaleCombination[], rng: SeededRng): ScaleCombination[]
export function preventBoundaryDuplicate(previous: ScaleCombination | null, nextBag: ScaleCombination[]): ScaleCombination[]
```

必須test:
- Random: 72 basic + 28 bonus = 100 entries
- 全72 combination >= 1
- common 28 combinations = exactly 2
- Major固定: 12 + 6 = 18
- Bag境界でpreviousと先頭が同Combinationなら別要素とのswapを試みる
