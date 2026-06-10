// Cloudflare Worker（静的アセット + APIルート）
// - /waitlist.html, /, その他の静的ファイル → public/ のアセットを配信（assetsが優先処理）
// - POST /api/waitlist → Supabase に保存（service_role キーで RLS をバイパス）
//
// 環境変数:
//   SUPABASE_URL                 wrangler.toml の [vars] に記載
//   SUPABASE_SERVICE_ROLE_KEY    ダッシュボードの Secret（または `wrangler secret put`）

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });

async function handleWaitlist(request, env) {
  if (request.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, 405);
  }
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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/waitlist') {
      return handleWaitlist(request, env);
    }
    // それ以外は静的アセットへフォールバック
    // （通常はアセットが Worker より先に配信されるため、ここに来るのは未マッチ時のみ）
    return env.ASSETS.fetch(request);
  },
};
