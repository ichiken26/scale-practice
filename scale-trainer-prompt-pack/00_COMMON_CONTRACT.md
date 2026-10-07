# Scale Trainer Implementation Contract

このRepositoryでは、別途与えられている「ギター / ベース スケール練習Webアプリ 統合仕様」を唯一のSource of Truthとする。

## 実装ルール
1. 今回指定された関数・型・テストだけを主対象として実装する。
2. TODO / FIXME / throw new Error("not implemented") / 仮実装を残さない。
3. Mock implementationをproduction codeとして採用しない。
4. 関係ない既存コードを勝手にrewriteしない。
5. 公開APIの変更が必要なら、変更前に理由を説明する。
6. TypeScript strictを維持する。
7. anyは禁止。ただし外部API境界で不可避なら理由を書く。
8. Domain logicはPure Functionを優先する。
9. Vue / DOM / Web Audio依存をdomain層へ持ち込まない。
10. Math.random()は禁止。ランダム処理はseeded PRNG経由。
11. 時間計算でsetInterval/setTimeoutをMaster Clockにしない。
12. floating-point時刻の累積加算は禁止。
13. magic numberをロジックに埋め込まない。
14. 各exported functionについてunit testを書く。
15. 正常系だけでなく境界値・異常系もテストする。
16. 既存テストを壊さない。
17. 実装完了時に必ず `pnpm typecheck`, `pnpm test`, `pnpm build` を実行する。

## 実装開始前
まず以下だけを回答する。
- 今回変更予定のファイル
- 実装対象関数
- 依存する既存関数
- 想定するテストケース

その後実装する。

## 実装完了時
### Implemented
### Tests
### Validation
- typecheck: PASS / FAIL
- test: PASS / FAIL
- build: PASS / FAIL
### Remaining
未実装がなければ `None`。

PASSしていない状態で「完了」と宣言しない。
