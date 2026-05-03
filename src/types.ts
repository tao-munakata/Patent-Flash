export type SearchRequest = {
  site: 'jplatpat' | 'google_patents';
  keywords: {
    and: string[];
    or?: string[];
    not?: string[];
  };
  filters?: {
    dateFrom?: string;
    dateTo?: string;
    ipcCodes?: string[];
  };
  mode: 'count_only' | 'count_and_list';
  maxResults?: number;
};

export type PatentItem = {
  pubNo: string;
  title: string;
  applicant: string;
  pubDate: string;
  detailUrl: string;
};

export type SearchResponse = {
  status: 'success' | 'error' | 'partial';
  site: string;
  hitCount: number;
  cached: boolean;
  cachedAt?: string;
  results?: PatentItem[];
  error?: string;
};

