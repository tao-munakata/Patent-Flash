import fs from 'fs';
import path from 'path';
import type { Page } from 'playwright';
import type { SiteAdapter } from './base-adapter';
import type { PatentItem, SearchResponse } from '../types';

const BASE_URL = 'https://www.j-platpat.inpit.go.jp';

const TIMEOUT = {
  navigation: 25_000,
  selector: 15_000,
  results: 30_000,
} as const;

type Selectors = {
  searchInput: string;
  searchButton: string;
  hitCountMsg: string;
  hitCountTab: string;
  resultTable: string;
  pubNo: string;
  pubDate: string;
  title: string;
  applicant: string;
};

function loadSelectors(): Selectors {
  const configPath = path.resolve(__dirname, '../../config/selectors/jplatpat.json');
  const raw = fs.readFileSync(configPath, 'utf-8');
  return JSON.parse(raw) as Selectors;
}

/**
 * 件数テキストから整数を取得する。
 * "検索結果が3000件を超えたため（172492件）..." → 172492
 * "1,234件" → 1234
 */
function parseHitCount(text: string): number {
  // 3000件超えメッセージ: 括弧内の数値が真の件数
  const overflowMatch = text.match(/[（(](\d[\d,]*?)件[）)]/);
  if (overflowMatch) {
    return parseInt(overflowMatch[1].replace(/,/g, ''), 10);
  }
  // 通常表記
  const match = text.replace(/[,，]/g, '').match(/(\d+)件/);
  if (!match) return -1;
  return parseInt(match[1], 10);
}

/** 公開番号からJ-PlatPat詳細ページURLを生成する */
function buildDetailUrl(pubNoText: string): string {
  // "特開2026-074022" → "JP-2026-074022"
  const normalized = pubNoText
    .replace(/特開|特許|実開|実用/, '')
    .trim()
    .replace(/\s+/g, '');
  return `${BASE_URL}/c1801/PU/JP-${normalized}/11/ja`;
}

export class JplatpatAdapter implements SiteAdapter {
  private selectors: Selectors;

  constructor() {
    this.selectors = loadSelectors();
  }

  buildQuery(keywords: { and: string[]; or?: string[]; not?: string[] }): string {
    const parts: string[] = [];

    // AND条件: 半角スペース区切り（J-PlatPat の簡易検索は半角スペースでAND）
    if (keywords.and.length > 0) {
      parts.push(keywords.and.join(' '));
    }

    // OR条件: (A OR B) 形式
    if (keywords.or && keywords.or.length > 0) {
      parts.push(`(${keywords.or.join(' OR ')})`);
    }

    // NOT条件: NOT A NOT B 形式
    if (keywords.not && keywords.not.length > 0) {
      parts.push(...keywords.not.map((kw) => `NOT ${kw}`));
    }

    return parts.join(' ');
  }

  async search(
    page: Page,
    query: string,
    mode: 'count_only' | 'count_and_list',
    maxResults: number
  ): Promise<SearchResponse> {
    const sel = this.selectors;

    try {
      // トップページへ移動（SPA のため domcontentloaded で十分）
      await page.goto(BASE_URL, {
        timeout: TIMEOUT.navigation,
        waitUntil: 'domcontentloaded',
      });

      // 検索入力欄が表示されるまで待機
      await page.waitForSelector(sel.searchInput, { timeout: TIMEOUT.selector });
      await page.fill(sel.searchInput, query);

      // 検索ボタン（<a>タグ）をクリック
      await page.waitForSelector(sel.searchButton, { timeout: TIMEOUT.selector });
      await page.click(sel.searchButton);

      // 結果テーブルが表示されるまで待機
      await page.waitForSelector(sel.resultTable, { timeout: TIMEOUT.results });

      // 件数取得を page.evaluate 文字列で一括実行（タイミング問題を回避）
      const hitCount: number = await page.evaluate(`(function() {
        // 1) 3000件超えメッセージ: "（172492件）" → 172492
        var msg = document.querySelector('li#patentUtltyIntnlDocLst_searchResultMsg');
        if (msg) {
          var m1 = msg.textContent.match(/[（(](\\d[\\d,]*?)件[）)]/);
          if (m1) return parseInt(m1[1].replace(/,/g,''), 10);
        }
        // 2) タブ件数表示: "(1160)" → 1160
        var tab = document.querySelector('#s01_searchRsltSelect_tabPatentsUtility');
        if (tab) {
          var m2 = (tab.textContent || '').match(/\\((\\d[\\d,]*)\\)/);
          if (m2) return parseInt(m2[1].replace(/,/g,''), 10);
        }
        // 3) フォールバック: 表示行数
        return document.querySelectorAll('${sel.resultTable}').length;
      })()`) as number;

      if (mode === 'count_only') {
        return { status: 'success', site: 'jplatpat', hitCount, cached: false };
      }

      // count_and_list: Angular再レンダリングによる detach を避けるため $$eval で一括取得
      await page.waitForTimeout(1000);

      // page.evaluate に JS 文字列を渡す（tsx の __name ヘルパー混入を回避）
      // 行番号列が <th> のため td:nth-child では取れない。querySelectorAll('td') でインデックス参照
      const jsCode = `(function(tableSelector, max) {
        var rows = Array.from(document.querySelectorAll(tableSelector));
        var out = [];
        for (var i = 0; i < Math.min(rows.length, max); i++) {
          var tds = Array.from(rows[i].querySelectorAll('td'));
          if (tds.length < 5) continue;
          var text = function(idx) { return tds[idx] ? (tds[idx].textContent || '').trim() : ''; };
          var pubNo = text(0);
          if (!pubNo) continue;
          var normalized = pubNo.replace(/特開|特許|特表|特再|実開|実登|実公|実願/, '').trim();
          out.push({
            pubNo: pubNo,
            pubDate: text(3),
            title: text(4),
            applicant: text(5),
            detailUrl: 'https://www.j-platpat.inpit.go.jp/c1801/PU/JP-' + normalized + '/11/ja'
          });
        }
        return out;
      })('${sel.resultTable}', ${maxResults})`;

      const results = await page.evaluate(jsCode) as PatentItem[];

      return { status: 'success', site: 'jplatpat', hitCount, cached: false, results };

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);

      if (/timeout|Timeout/i.test(message)) {
        return { status: 'error', site: 'jplatpat', hitCount: 0, cached: false, error: 'サイトが応答しません' };
      }
      if (/waiting for selector|selector/i.test(message)) {
        return { status: 'error', site: 'jplatpat', hitCount: 0, cached: false, error: 'サイト構造が変更された可能性があります' };
      }
      return { status: 'error', site: 'jplatpat', hitCount: 0, cached: false, error: message };
    }
  }
}
