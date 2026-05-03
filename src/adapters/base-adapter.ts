import type { Page } from 'playwright';
import type { SearchResponse } from '../types';

export interface SiteAdapter {
  buildQuery(keywords: { and: string[]; or?: string[]; not?: string[] }): string;
  search(
    page: Page,
    query: string,
    mode: 'count_only' | 'count_and_list',
    maxResults: number
  ): Promise<SearchResponse>;
}
