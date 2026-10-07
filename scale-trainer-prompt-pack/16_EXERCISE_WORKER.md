# Task 16: Exercise Generator Web Worker

GeneratorをMain Threadから分離。

対象例: `src/workers/exercise.worker.ts`, `src/workers/exerciseClient.ts`

Typed protocol:
Requests: INIT_SESSION / GENERATE_RANDOM_ROUND / GENERATE_FULL_NECK / GENERATE_NEXT
Responses: READY / ROUND_GENERATED / GENERATION_SKIPPED / ERROR

実装:
```ts
export class ExerciseWorkerClient {
  init(...)
  generateNext(...)
  dispose(...)
}
```

要件:
- GeneratorはDOM/Vue/WebAudio非依存
- Random Positionは現在Round中に次Roundをpre-generate
- Full Neckは現在Scale中に次Scaleをpre-generate
- Worker errorでUI全体をクラッシュさせない
- Request IDを付け古いresponseを誤適用しない
