# Scale Trainer Prompt Pack

ギター / ベース スケール練習Webアプリを、自前AIハーネスで段階実装するためのプロンプト群です。

## 推奨実行順
1. `00_COMMON_CONTRACT.md` を常時コンテキスト / Project Prompt として読み込ませる
2. `01_DOMAIN_TYPES.md` から `24_CI_CLOUDFLARE.md` まで順番に実行する
3. 各タスクごとに `typecheck -> test -> build -> diff review` を通す
4. 最後に `25_FINAL_AUDIT.md` で実装漏れ監査を行う

巨大プロンプトを一括実装させるのではなく、1モジュール単位で「実装 -> テスト -> 検証」を完了してから次へ進めてください。
