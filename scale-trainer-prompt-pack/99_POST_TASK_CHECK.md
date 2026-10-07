# Post Task Check

今回追加したすべてのexported functionを列挙し、各関数について
- happy path test
- boundary test
- failure test
のどれが存在するか表で答えてください。

testが存在しないexported functionがあれば、次タスクへ進まずtestを追加してください。

その後必ず:
- pnpm typecheck
- pnpm test
- pnpm build

最後にgit diffを自己レビューし、仕様逸脱・不要変更・仮実装・未使用exportがないか確認してください。
