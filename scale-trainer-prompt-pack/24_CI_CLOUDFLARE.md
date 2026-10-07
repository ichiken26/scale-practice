# Task 24: CI / Cloudflare Deployment

Astro static build。
Cloudflare Workers Static Assets。
`@astrojs/cloudflare` adapter不要。
wrangler assets: `./dist`。

GitHub Actions:
- pnpm install --frozen-lockfile
- pnpm lint
- pnpm typecheck
- pnpm test
- pnpm build
- wrangler deploy

Secretsは `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` 等の公式推奨方式。
PRではdeployしない。main branchへのmerge/pushでdeploy。
READMEへlocal / deploy方法を書く。
