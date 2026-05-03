import { describe, it, expect, beforeEach } from 'vitest';
import { JplatpatAdapter } from '../../src/adapters/jplatpat';

describe('JplatpatAdapter.buildQuery', () => {
  let adapter: JplatpatAdapter;

  beforeEach(() => {
    adapter = new JplatpatAdapter();
  });

  it('AND条件のみ: 全角スペース区切り', () => {
    const result = adapter.buildQuery({ and: ['センサー', 'マイコン', '加熱'] });
    expect(result).toBe('センサー\u3000マイコン\u3000加熱');
  });

  it('AND条件1件: スペースなし', () => {
    const result = adapter.buildQuery({ and: ['センサー'] });
    expect(result).toBe('センサー');
  });

  it('OR条件あり: 括弧+OR演算子', () => {
    const result = adapter.buildQuery({
      and: ['センサー'],
      or: ['LED', '報知手段'],
    });
    expect(result).toBe('センサー (LED OR 報知手段)');
  });

  it('NOT条件あり: NOT演算子を先頭付与', () => {
    const result = adapter.buildQuery({
      and: ['センサー'],
      not: ['照明'],
    });
    expect(result).toBe('センサー NOT 照明');
  });

  it('AND+OR+NOT複合', () => {
    const result = adapter.buildQuery({
      and: ['センサー'],
      or: ['LED', '報知手段'],
      not: ['照明'],
    });
    expect(result).toBe('センサー (LED OR 報知手段) NOT 照明');
  });

  it('NOT条件が複数ある場合: それぞれに NOT を付与', () => {
    const result = adapter.buildQuery({
      and: ['センサー'],
      not: ['照明', 'ランプ'],
    });
    expect(result).toBe('センサー NOT 照明 NOT ランプ');
  });

  it('or が空配列のとき: OR部分を含まない', () => {
    const result = adapter.buildQuery({ and: ['センサー'], or: [] });
    expect(result).toBe('センサー');
  });

  it('not が空配列のとき: NOT部分を含まない', () => {
    const result = adapter.buildQuery({ and: ['センサー'], not: [] });
    expect(result).toBe('センサー');
  });

  it('and が空配列のとき: 例外を投げずに空文字列を返す', () => {
    expect(() => adapter.buildQuery({ and: [] })).not.toThrow();
    const result = adapter.buildQuery({ and: [] });
    expect(result).toBe('');
  });

  it('and が空でOR/NOTだけある場合: OR/NOT部分だけ返す', () => {
    const result = adapter.buildQuery({ and: [], or: ['LED'], not: ['照明'] });
    expect(result).toBe('(LED) NOT 照明');
  });
});
