# Task 15: Practice Round Generator

対象: `src/domain/practice/roundGenerator.ts`

実装:
```ts
export function generateRandomPositionRound(context: RoundGenerationContext): PracticeRound
export function generateFullNeckRound(context: RoundGenerationContext): PracticeRound
export function generateNextRound(context: RoundGenerationContext): PracticeRound
```

Random Position:
Scale Combination Bag → valid positions列挙 → Position Bag → 1 position。
valid position 0ならcombination skip + Debug event + 次Combination。

Full Neck:
全Position startFret順 + Linked A/B/C + Continuous A/B/C。各path間2 bars。
Scale announcement / Previewは統合仕様通り。

同seed + settings → 同じRound sequence。
