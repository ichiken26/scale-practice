# Task 07: Position Generator

対象: `src/domain/fretboard/positionGenerator.ts`

実装:
```ts
export function getNotesPerString(scaleType: ScaleType): 2 | 3
export function generatePositionFromStartMidi(params: GeneratePositionParams): FretboardPosition | null
export function enumeratePositions(params: EnumeratePositionParams): readonly FretboardPosition[]
export function validatePosition(position: FretboardPosition, params: PositionValidationParams): PositionValidationResult
```

アルゴリズム:
- Diatonic: 3 notes/string
- Pentatonic: 2 notes/string
- Lowest String上のScale ToneをstartMidi
- Scale Degreeを飛ばさずascending MIDI pitchesを生成
- string 0から順にDiatonicなら3 pitch、Pentatonicなら2 pitchずつ割当
- fret = midi - openStringMidi
- 全string使用

reject:
- fret < 0
- fret > 24
- Diatonic各stringで maxFret - minFret > 4
- Position全体のspanは制限しない

Exact test C Major / 6-string Standard / start C3 fret8:
6: 8 10 12
5: 8 10 12
4: 9 10 12
3: 9 10 12
2: 10 12 13
1: 10 12 13

E Minor Pentatonic @12:
6: 12 15
5: 12 14
4: 12 14
3: 12 14
2: 12 15
1: 12 15

enumeratePositionsは0〜24F内の完全Positionのみ、startFret昇順、+12F同shapeも別Position。descendingPathは完全逆走。

既定shape tableをハードコード禁止。
