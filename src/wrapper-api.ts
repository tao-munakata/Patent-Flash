import express from 'express';
import type { Request, Response } from 'express';
import type { SearchRequest } from './types';
import { JplatpatAdapter } from './adapters/jplatpat';
import { runSearch } from './browser-controller';

const app = express();
app.use(express.json());

const adapters = {
  jplatpat: new JplatpatAdapter(),
} as const;

// トップページ（検索UI）
app.get('/', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PatChat Wrapper API</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; background: #0f172a; color: #e2e8f0; min-height: 100vh; padding: 2rem; }
    h1 { font-size: 1.5rem; font-weight: 700; color: #38bdf8; margin-bottom: 0.25rem; }
    .subtitle { font-size: 0.85rem; color: #64748b; margin-bottom: 2rem; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 0.75rem; padding: 1.5rem; margin-bottom: 1.5rem; }
    .card h2 { font-size: 1rem; color: #94a3b8; margin-bottom: 1rem; letter-spacing: 0.05em; text-transform: uppercase; font-size: 0.75rem; }
    label { display: block; font-size: 0.85rem; color: #94a3b8; margin-bottom: 0.35rem; }
    input, select, textarea { width: 100%; background: #0f172a; border: 1px solid #334155; border-radius: 0.5rem; color: #e2e8f0; padding: 0.5rem 0.75rem; font-size: 0.9rem; margin-bottom: 1rem; }
    input:focus, select:focus, textarea:focus { outline: none; border-color: #38bdf8; }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    button { background: #0284c7; color: white; border: none; border-radius: 0.5rem; padding: 0.65rem 1.5rem; font-size: 0.95rem; cursor: pointer; font-weight: 600; }
    button:hover { background: #0369a1; }
    button:disabled { background: #334155; cursor: not-allowed; }
    #result { background: #0f172a; border: 1px solid #334155; border-radius: 0.5rem; padding: 1rem; font-family: monospace; font-size: 0.8rem; white-space: pre-wrap; word-break: break-all; min-height: 4rem; color: #a3e635; }
    .hit { font-size: 1.5rem; font-weight: 700; color: #38bdf8; margin-bottom: 0.5rem; }
    .patent { background: #1e293b; border: 1px solid #334155; border-radius: 0.5rem; padding: 0.75rem 1rem; margin-bottom: 0.75rem; }
    .patent .pub { font-size: 0.75rem; color: #64748b; }
    .patent .title { font-size: 0.9rem; color: #e2e8f0; margin: 0.25rem 0; }
    .patent .applicant { font-size: 0.8rem; color: #94a3b8; }
    .patent a { color: #38bdf8; font-size: 0.75rem; }
    .error { color: #f87171; }
    .spinner { display: inline-block; width: 1rem; height: 1rem; border: 2px solid #334155; border-top-color: #38bdf8; border-radius: 50%; animation: spin 0.6s linear infinite; margin-right: 0.5rem; vertical-align: middle; }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <h1>PatChat Wrapper API</h1>
  <p class="subtitle">J-PlatPat 特許検索ラッパー v1.0.0</p>

  <div class="card">
    <h2>検索条件</h2>
    <label>AND キーワード（スペース区切りで複数入力）</label>
    <input id="kw-and" type="text" placeholder="例: センサー マイコン" value="センサー マイコン">

    <div class="row">
      <div>
        <label>OR キーワード（任意）</label>
        <input id="kw-or" type="text" placeholder="例: 加熱 温度制御">
      </div>
      <div>
        <label>NOT キーワード（任意）</label>
        <input id="kw-not" type="text" placeholder="例: 照明">
      </div>
    </div>

    <div class="row">
      <div>
        <label>モード</label>
        <select id="mode">
          <option value="count_and_list">件数＋一覧 (count_and_list)</option>
          <option value="count_only">件数のみ (count_only)</option>
        </select>
      </div>
      <div>
        <label>最大取得件数（count_and_list 時）</label>
        <input id="max-results" type="number" value="5" min="1" max="50">
      </div>
    </div>

    <button id="btn" onclick="doSearch()">検索する</button>
  </div>

  <div id="output" style="display:none" class="card">
    <h2>結果</h2>
    <div id="result"></div>
  </div>

  <script>
    async function doSearch() {
      const andKws = document.getElementById('kw-and').value.trim().split(/\\s+/).filter(Boolean);
      const orKws  = document.getElementById('kw-or').value.trim().split(/\\s+/).filter(Boolean);
      const notKws = document.getElementById('kw-not').value.trim().split(/\\s+/).filter(Boolean);
      const mode   = document.getElementById('mode').value;
      const maxR   = parseInt(document.getElementById('max-results').value) || 5;

      if (!andKws.length) { alert('AND キーワードを入力してください'); return; }

      const btn = document.getElementById('btn');
      const out = document.getElementById('output');
      const res = document.getElementById('result');
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span>検索中...';
      out.style.display = 'none';

      const body = {
        site: 'jplatpat',
        keywords: { and: andKws, ...(orKws.length && { or: orKws }), ...(notKws.length && { not: notKws }) },
        mode,
        maxResults: maxR,
      };

      try {
        const resp = await fetch('./search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await resp.json();

        if (data.status === 'error') {
          res.innerHTML = '<span class="error">エラー: ' + data.error + '</span>';
        } else if (mode === 'count_only') {
          res.innerHTML = '<div class="hit">' + data.hitCount.toLocaleString() + ' 件</div><div style="color:#64748b;font-size:0.8rem">クエリ: ' + andKws.join(' ') + (orKws.length ? ' + OR' : '') + '</div>';
        } else {
          let html = '<div class="hit">' + data.hitCount.toLocaleString() + ' 件</div>';
          (data.results || []).forEach(function(p) {
            html += '<div class="patent"><div class="pub">' + p.pubNo + ' &nbsp;|&nbsp; ' + p.pubDate + '</div><div class="title">' + p.title + '</div><div class="applicant">' + p.applicant + '</div><a href="' + p.detailUrl + '" target="_blank">J-PlatPat で開く →</a></div>';
          });
          if (!data.results || !data.results.length) html += '<div style="color:#64748b">一覧なし（count_and_list を選択してください）</div>';
          res.innerHTML = html;
        }
      } catch(e) {
        res.innerHTML = '<span class="error">通信エラー: ' + e.message + '</span>';
      }

      btn.disabled = false;
      btn.innerHTML = '検索する';
      out.style.display = 'block';
    }
  </script>
</body>
</html>`);
});

// ヘルスチェック
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 検索エンドポイント
app.post('/search', async (req: Request, res: Response) => {
  const body = req.body as Partial<SearchRequest>;

  // バリデーション
  if (!body.site || !['jplatpat', 'google_patents'].includes(body.site)) {
    res.status(400).json({ error: 'site は jplatpat または google_patents を指定してください' });
    return;
  }
  if (!body.keywords?.and || !Array.isArray(body.keywords.and) || body.keywords.and.length === 0) {
    res.status(400).json({ error: 'keywords.and は1件以上の配列が必須です' });
    return;
  }
  if (body.keywords.and.length > 10) {
    res.status(400).json({ error: 'keywords.and は最大10件です' });
    return;
  }
  if (!body.mode || !['count_only', 'count_and_list'].includes(body.mode)) {
    res.status(400).json({ error: 'mode は count_only または count_and_list を指定してください' });
    return;
  }

  if (body.site !== 'jplatpat') {
    res.status(501).json({ error: `${body.site} は未実装です` });
    return;
  }

  const adapter = adapters[body.site];
  const query = adapter.buildQuery(body.keywords);
  const maxResults = Math.min(body.maxResults ?? 20, 50);

  console.log(`[search] site=${body.site} query="${query}" mode=${body.mode}`);

  const result = await runSearch(adapter, query, body.mode, maxResults);
  res.json(result);
});

const PORT = process.env.PORT ?? 3100;
app.listen(PORT, () => {
  console.log(`PatChat Wrapper API が起動しました → http://localhost:${PORT}`);
  console.log(`  ヘルスチェック: GET  http://localhost:${PORT}/health`);
  console.log(`  検索:           POST http://localhost:${PORT}/search`);
});
