# Task 21: PWA / Offline

`@vite-pwa/astro` 等を使いinstallable PWA化。

precache:
- HTML
- JS
- CSS
- Web Worker
- AudioWorklet
- manifest
- icons

外部runtime dependencyなし。
初回正常ロード後は完全offlineでPractice可能。

Update strategy = prompt。
playing中はreload禁止。
stoppedで新version通知。
ユーザーがUpdate押下時だけactivate + reload。
production build後、offline状態でもStartできることを検証。
