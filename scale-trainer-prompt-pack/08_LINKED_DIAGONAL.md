# Task 08: Linked Diagonal Generator

対象: `src/domain/fretboard/linkedDiagonal.ts`

実装:
```ts
export type ConnectorInterval = 1 | 2 | 3
export function generateLinkedDiagonal(params: LinkedDiagonalParams): LinkedDiagonalPath | null
export function generateAllLinkedDiagonals(params: LinkedDiagonalBaseParams): readonly LinkedDiagonalPath[]
```

Rules:
- Diatonic base NPS = 3
- Pentatonic base NPS = 2
- Connector interval 1=every string, 2=every 2 strings, 3=every 3 strings
- Connectorを入れるstringではbase NPS + 次のScale Degreeを1 note追加
- Connectorもascending Scale Degree

禁止: scale degree skip / pitch下降 / 同pitch重複。
final stringにはConnector不要。
start candidateを低いfretから探索し「可能な限り低い開始Fret」かつ「final stringが17F以上」。valid pathなしはnull。ascending後は完全reverse。

C Major Pattern A/B/Cのsnapshot test。Pattern Aでは概ね3F付近→17F付近。
