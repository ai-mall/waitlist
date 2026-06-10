# AI BASE — ウェイティングリスト LP

先着300名限定特典付きウェイティングリストのランディングページ。
元は Vercel + Supabase だったが、元 Supabase は**紛失したアカウント所有**で書き込めないため、保存先を **Cloudflare D1** に変更。全体を Cloudflare Workers（静的アセット + API）で完結させている。外部アカウント・トークン・APIキーは不要。

## 構成

| パス | 役割 |
|---|---|
| `public/waitlist.html` | 本体（自己完結の静的 LP） |
| `public/index.html` | ルートを `waitlist.html` にリダイレクト |
| `src/index.js` | Worker 本体（API + アセット配信） |
| `wrangler.toml` | 設定（アセット / D1 バインディング / 上限値） |

### API
- `POST /api/waitlist` … `{name, email, type}` を D1 に保存。同一メールは冪等（二重登録しても1件）。
- `GET /api/count` … `{registered, remaining, limit, pct}` を返す。カウンター表示用。メールアドレスは公開しない。

### データベース（Cloudflare D1）
- DB名 `firstpen-waitlist` / binding `DB`
- テーブル `waitlist_registrations(id, name, email UNIQUE, type, created_at)`

## デプロイ

```bash
wrangler deploy
```

- 公開 URL: https://firstpen-waitlist-api.soga-naoya.workers.dev/waitlist
- 先着上限は `wrangler.toml` の `[vars] WAITLIST_LIMIT` で変更可。

## ローカル確認（任意）

```bash
wrangler dev          # ローカル D1 を使う
```

## メモ

- 旧 Worker に残っていた未使用シークレット（`SUPABASE_SERVICE_ROLE_KEY` / `SENDGRID_API_KEY` / `ADMIN_PASS` 等）は本コードでは未使用。削除する場合: `wrangler secret delete <NAME>`。
- 元の構成には SendGrid によるメール送信・管理ログインもあった模様（今回は未実装）。必要なら別途追加。
- 登録データの確認: `wrangler d1 execute firstpen-waitlist --remote --command "SELECT * FROM waitlist_registrations;"`
