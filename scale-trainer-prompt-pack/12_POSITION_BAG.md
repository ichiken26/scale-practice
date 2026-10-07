# Task 12: Position Shuffle Bag

対象: `src/domain/practice/positionBag.ts`

同じRoot / Scale / Tuningについて、有効Positionを一巡するまで同Positionを再利用しない。

実装:
```ts
export function createPositionBagKey(params: PositionBagKeyParams): string
export function createPositionBag(positions: readonly FretboardPosition[], rng: SeededRng): PositionBag
export function drawPosition(bag: PositionBag): PositionDrawResult
export function refillPositionBag(positions: readonly FretboardPosition[], rng: SeededRng, previousPositionId?: string): PositionBag
```

完全同一 Root + Scale + Position の連続だけは禁止。
同じRoot+Scaleで別Positionは許可。同startFretの別Scaleも許可。
