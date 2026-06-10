// Cloudflare Pages Function — POST /api/waitlist
// 元の Vercel サーバーレス関数と同等。フロントの fetch('/api/waitlist') をそのまま受け、
// Supabase の service_role キーで waitlist_registrations テーブルに保存する（RLS をバイパス）。
//
// 必要な環境変数（Cloudflare Pages の Settings > Environment variables で設定）:
//   SUPABASE_URL                例: https://hfknwufsphmwnzryveyx.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY   Supabase ダッシュボード Settings > API の service_role キー（秘密）

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });

export async function onRequestPost({ request, env }) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return json({ error: 'server_not_configured' }, 500);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  const name = (body.name || '').toString().trim();
  const email = (body.email || '').toString().trim();
  const type = (body.type || '').toString().trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: 'invalid_email' }, 400);
  }

  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/waitlist_registrations`, {
    method: 'POST',
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ name, email, type }),
  });

  if (!res.ok) {
    const detail = await res.text();
    return json({ error: 'db_error', detail }, 502);
  }

  return json({ ok: true });
}
// POST 以外のメソッドは Cloudflare Pages が自動的に 405 を返す。
