// Cloudflare Worker（静的アセット + API）— 保存先は Cloudflare D1
// - GET  /              , /waitlist.html など … public/ の静的アセットを配信
// - POST /api/waitlist  … 登録を D1 に保存
// - GET  /api/count     … 登録数・残り枠を返す（カウンター用。メールは公開しない）
//
// バインディング（wrangler.toml）:
//   DB              D1 データベース
//   ASSETS          静的アセット
//   WAITLIST_LIMIT  先着上限（文字列）

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });

function getLimit(env) {
  const n = parseInt(env.WAITLIST_LIMIT, 10);
  return Number.isFinite(n) && n > 0 ? n : 300;
}

async function handleCount(env) {
  const limit = getLimit(env);
  const row = await env.DB.prepare(
    'SELECT COUNT(*) AS c FROM waitlist_registrations'
  ).first();
  const registered = row?.c ?? 0;
  const remaining = Math.max(0, limit - registered);
  const pct = Math.min(100, Math.round((registered / limit) * 100));
  return json({ registered, remaining, limit, pct });
}

async function handleWaitlist(request, env) {
  if (request.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, 405);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  const name = (body.name || '').toString().trim().slice(0, 200);
  const email = (body.email || '').toString().trim().slice(0, 320);
  const type = (body.type || '').toString().trim().slice(0, 50);

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: 'invalid_email' }, 400);
  }

  try {
    // 同一メールの二重登録は無視（冪等）
    await env.DB.prepare(
      'INSERT INTO waitlist_registrations (name, email, type) VALUES (?, ?, ?) ' +
        'ON CONFLICT(email) DO NOTHING'
    )
      .bind(name, email, type)
      .run();
  } catch (e) {
    return json({ error: 'db_error', detail: String(e) }, 502);
  }

  return json({ ok: true });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/waitlist') {
      return handleWaitlist(request, env);
    }
    if (url.pathname === '/api/count') {
      return handleCount(env);
    }
    // それ以外は静的アセットへ
    return env.ASSETS.fetch(request);
  },
};
