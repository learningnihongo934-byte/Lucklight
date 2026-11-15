// Lucklight Worker: serves public/ and the global leaderboard (/api/*), kept in one SQLite Durable Object.
import { AURA } from '../public/js/data.js';

const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

export class Board {
  constructor(state) {
    this.sql = state.storage.sql;
    this.sql.exec(`CREATE TABLE IF NOT EXISTS p (id TEXT PRIMARY KEY, name TEXT, best TEXT, n INTEGER, rolls INTEGER, t INTEGER)`);
  }
  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === '/api/top') {
      const best = this.sql.exec(`SELECT name, best, n, rolls FROM p ORDER BY n DESC, t ASC LIMIT 25`).toArray();
      const rolls = this.sql.exec(`SELECT name, best, n, rolls FROM p ORDER BY rolls DESC LIMIT 25`).toArray();
      return json({ best, rolls });
    }
    if (url.pathname === '/api/score' && req.method === 'POST') {
      let b; try { b = await req.json(); } catch { return json({ error: 'bad json' }, 400); }
      const id = String(b.id || ''), name = String(b.name || '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 16);
      const aura = AURA[b.best], rolls = Math.floor(Number(b.rolls));
      if (!/^[\w-]{8,48}$/.test(id) || !name || !aura || !(rolls >= 1 && rolls <= 1e9)) return json({ error: 'bad score' }, 400);
      const now = Date.now();
      const prev = this.sql.exec(`SELECT n, rolls, t FROM p WHERE id = ?`, id).toArray()[0];
      if (prev && now - prev.t < 2000) return json({ error: 'slow down' }, 429);
      // keep the best aura ever posted and the highest roll count
      const n = Math.max(aura.n, prev?.n || 0), best = aura.n >= (prev?.n || 0) ? b.best : null;
      if (prev) this.sql.exec(`UPDATE p SET name = ?, best = COALESCE(?, best), n = ?, rolls = MAX(rolls, ?), t = ? WHERE id = ?`, name, best, n, rolls, now, id);
      else this.sql.exec(`INSERT INTO p (id, name, best, n, rolls, t) VALUES (?, ?, ?, ?, ?, ?)`, id, name, b.best, n, rolls, now);
      return json({ ok: true });
    }
    return json({ error: 'not found' }, 404);
  }
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname.startsWith('/api/')) return env.BOARD.get(env.BOARD.idFromName('global')).fetch(req);
    return env.ASSETS.fetch(req);
  },
};
