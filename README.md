# AI BASE — ウェイティングリスト LP

先着300名限定特典付きウェイティングリストのランディングページ。
元は Vercel + Supabase。本リポジトリは **Cloudflare Workers（静的アセット + GitHub 連携ビルド）** 向けに再構成したもの。

## 構成

| パス | 役割 |
|---|---|
| `public/waitlist.html` | 本体（自己完結の静的 LP。元の `/waitlist.html` と同一） |
| `public/index.html` | ルートを `waitlist.html` にリダイレクト |
| `src/index.js` | Worker 本体。`POST /api/waitlist` を Supabase に保存、それ以外は静的アセットを配信 |
| `wrangler.toml` | 設定（アセットディレクトリ・環境変数）。ビルドはこれを自動で読む |

- 残り枠カウンターは Supabase の anon キーで直接読み取り（変更不要）。
- フォーム送信は `/api/waitlist`（Worker）経由で service_role キーを使い保存（RLS をバイパス）。

## デプロイ（Cloudflare、GitHub 連携）

GitHub にこのリポジトリが push 済みであること。Cloudflare の Worker プロジェクトを本リポジトリに接続すると、`wrangler.toml` を読んで自動でビルド・配信される。

**唯一の手動設定：シークレットを1つ登録**
Cloudflare ダッシュボード > 対象 Worker > **Settings > Variables and Secrets** > **Add** で：

- 種別 **Secret**、名前 `SUPABASE_SERVICE_ROLE_KEY`、値 = Supabase の **Settings > API > service_role** キー（**秘密。リポジトリ・wrangler.toml には絶対に入れない**）

`SUPABASE_URL` は `wrangler.toml` の `[vars]` に記載済み（公開可）。

登録後に再デプロイ（push か Deployments から Retry）すれば、フォーム送信 → `waitlist_registrations` に保存される。

## ローカル確認（任意）

```bash
npm i -g wrangler
# service_role キーをローカルに渡す
echo 'SUPABASE_SERVICE_ROLE_KEY=...' > .dev.vars   # .gitignore 済み
wrangler dev
```

## メモ

- `waitlist_registrations` は anon に SELECT 許可済み（カウンター用）。INSERT は service_role 経由のみ。列は `name` / `email` / `type`。
- 自動連携時に D1 データベース等が勝手に紐づくことがあるが、本プロジェクトでは未使用。`wrangler.toml` の内容が優先されるため無視してよい。
