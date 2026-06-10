# AI BASE — ウェイティングリスト LP

先着300名限定特典付きウェイティングリストのランディングページ。
元は Vercel + Supabase で構築。本リポジトリは **Cloudflare Pages（GitHub 連携）** 向けに再構成したもの。

## 構成

| ファイル | 役割 |
|---|---|
| `waitlist.html` | 本体（自己完結の静的 LP。元の `/waitlist.html` と同一） |
| `index.html` | ルートアクセスを `waitlist.html` にリダイレクト |
| `functions/api/waitlist.js` | Cloudflare Pages Function。`POST /api/waitlist` を受け Supabase に保存 |

フロントの残り枠カウンターは Supabase の anon キーで直接読み取り（変更不要）。
フォーム送信は `/api/waitlist`（上記 Function）経由で service_role キーを使い保存（RLS をバイパス）。

## Cloudflare Pages へのデプロイ手順

1. このリポジトリを GitHub に push 済みであること。
2. Cloudflare ダッシュボード > **Workers & Pages** > **Create** > **Pages** > **Connect to Git**。
3. 本リポジトリを選択。ビルド設定:
   - **Framework preset**: None
   - **Build command**: （空欄）
   - **Build output directory**: `/`（リポジトリのルート）
4. **Settings > Environment variables** に以下を追加（Production / Preview 両方）:
   - `SUPABASE_URL` = `https://hfknwufsphmwnzryveyx.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` = Supabase ダッシュボード **Settings > API** の **service_role** キー（**秘密。リポジトリには絶対に入れない**）
5. デプロイ後、`https://<project>.pages.dev/waitlist.html` で表示確認。フォーム送信 → Supabase の `waitlist_registrations` に行が増えることを確認。

## ローカル確認（任意）

```bash
npm i -g wrangler
# .dev.vars に SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY を記載（.gitignore 済み）
wrangler pages dev .
```

## メモ

- `waitlist_registrations` テーブルは anon に SELECT を許可済み（カウンター用）。INSERT は service_role 経由のみ。
- service_role キーは Cloudflare の環境変数にのみ保存し、コードや Git には含めないこと。
