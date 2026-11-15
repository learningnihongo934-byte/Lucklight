// Lucklight Worker: serves public/ and the global leaderboard (/api/*), kept in one SQLite Durable Object.
// Table p3 = the 1,000-aura fresh start (the old table p is left alone and unused).
import { AURA } from '../public/js/data.js';

const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

export class Board {
  constructor(state) {
    this.sql = state.storage.sql;
    this.sql.exec(`CREATE TABLE IF NOT EXISTS p3 (id TEXT PRIMARY KEY, name TEXT, best TEXT, n INTEGER, rolls INTEGER, t INTEGER, title TEXT)`);
  }
  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === '/api/top') {
      const best = this.sql.exec(`SELECT name, best, n, rolls, title FROM p3 ORDER BY n DESC, t ASC LIMIT 25`).toArray();
      const rolls = this.sql.exec(`SELECT name, best, n, rolls, title FROM p3 ORDER BY rolls DESC LIMIT 25`).toArray();
      return json({ best, rolls });
    }
    if (url.pathname === '/api/score' && req.method === 'POST') {
      let b; try { b = await req.json(); } catch { return json({ error: 'bad json' }, 400); }
      const title = String(b.title || '').replace(/[\u0000-\u001f<>]/g, '').slice(0, 24), id = String(b.id || ''), name = String(b.name || '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 16);
      const aura = AURA[b.best], rolls = Math.floor(Number(b.rolls));
      if (!/^[\w-]{8,48}$/.test(id) || !name || !aura || !(rolls >= 1 && rolls <= 1e12)) return json({ error: 'bad score' }, 400);
      const now = Date.now();
      const prev = this.sql.exec(`SELECT n, rolls, t FROM p3 WHERE id = ?`, id).toArray()[0];
      if (prev && now - prev.t < 2000) return json({ error: 'slow down' }, 429);
      // keep the best aura ever posted and the highest roll count
      const n = Math.max(aura.n, prev?.n || 0), best = aura.n >= (prev?.n || 0) ? b.best : null;
      if (prev) this.sql.exec(`UPDATE p3 SET name = ?, best = COALESCE(?, best), n = ?, rolls = MAX(rolls, ?), t = ?, title = ? WHERE id = ?`, name, best, n, rolls, now, title, id);
      else this.sql.exec(`INSERT INTO p3 (id, name, best, n, rolls, t, title) VALUES (?, ?, ?, ?, ?, ?, ?)`, id, name, b.best, n, rolls, now, title);
      return json({ ok: true });
    }
    // internal only: the Worker forwards here after checking the admin key (not reachable under /api/)
    if (url.pathname === '/internal/remove' && req.method === 'POST') {
      const { name } = await req.json();
      const n = this.sql.exec(`SELECT COUNT(*) AS c FROM p3 WHERE name = ?`, name).toArray()[0].c;
      this.sql.exec(`DELETE FROM p3 WHERE name = ?`, name);
      return json({ ok: true, removed: n });
    }
    return json({ error: 'not found' }, 404);
  }
}

// constant-time-ish compare for the admin key
const same = (a, b) => { if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0; };

async function admin(req, env) {
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);
  let b; try { b = await req.json(); } catch { return json({ error: 'bad json' }, 400); }
  if (!env.ADMIN_KEY || !same(b.key, env.ADMIN_KEY)) return json({ error: 'bad key' }, 403);
  if (b.cmd === 'check') return json({ ok: true });
  if (b.cmd === 'remove' && typeof b.name === 'string' && b.name.trim()) {
    const stub = env.BOARD.get(env.BOARD.idFromName('global'));
    return stub.fetch('https://board/internal/remove', { method: 'POST', body: JSON.stringify({ name: b.name.trim().slice(0, 16) }) });
  }
  return json({ error: 'unknown command' }, 400);
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname === '/api/admin') return admin(req, env);
    if (url.pathname.startsWith('/api/')) return env.BOARD.get(env.BOARD.idFromName('global')).fetch(req);
    return env.ASSETS.fetch(req);
  },
};
