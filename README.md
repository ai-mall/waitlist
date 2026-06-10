# AI BASE — ウェイティングリスト LP

先着300名限定特典付きウェイティングリストのランディングページ（静的サイト）。
登録フォームは外部のフォームシステム（jcity ASP）へリンク。サーバー処理・データベースは不要。

## 構成

| ファイル | 役割 |
|---|---|
| `waitlist.html` | 本体（自己完結の静的 LP） |
| `index.html` | ルートを `waitlist.html` にリダイレクト |

- 登録ボタン → `https://asp.jcity.co.jp/FORM/?K=infotop_IR4TflTj`（別タブで開く）
- 「300名限定」は静的表示（自動カウンターは廃止）

## ホスティング（GitHub Pages）

- 公開元：`main` ブランチ / ルート（`/`）
- 公開 URL：https://fp-tools.github.io/firstpen-waitlist/ （`/` は `waitlist.html` にリダイレクト）
- `main` に push すると自動で再公開される。

## 変更したいとき

- 登録ボタンのリンク先：`waitlist.html` 内の `asp.jcity.co.jp` の URL を書き換え
- 「300名限定」の数字：`waitlist.html` の `class="limit-num"` の値

## 履歴メモ

- 元は Vercel + Supabase。Supabase は紛失アカウント所有で使えず、一時 Cloudflare Workers + D1 で再構築 → 最終的にフォームを外部システム化したため静的サイト化し GitHub Pages へ移行。
- 旧 Cloudflare Worker（`firstpen-waitlist-api`）と D1 はもう使っていない（削除可）。
