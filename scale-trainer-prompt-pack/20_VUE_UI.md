# Task 20: Vue Practice UI

Domain/Audio logicを再実装せず、既存APIを呼ぶView layerとして実装。

Components候補:
- PracticeApp.vue
- SettingsPanel.vue
- ScaleHeader.vue
- ScaleNotes.vue
- Fretboard.vue
- TransportControls.vue
- ProgressIndicator.vue
- VolumeControls.vue
- DebugPanel.vue

FretboardはSVG推奨。0〜24F全部を画面内表示、equal fret width、highest stringを上、丸のみ、Path線なし。

Visual states:
- Scale Tone: gray
- Current Path: outline/emphasis
- Root: double ring
- Current: red
- Next: yellow
- 丸内部textなし

Full Neckは `Position 4 / 12` 等表示。
Start中はtimeline-changing settings disabled。
SpaceでStart/Stop。
UI Component内でsetInterval等によるExercise progressionを実装禁止。
