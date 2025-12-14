import { unstable_cache } from 'next/cache';

// Cache article metadata for 1 hour
export const getCachedArticles = unstable_cache(
  async (fetchFn: () => Promise<any[]>) => {
    return fetchFn();
  },
  ['articles-list'],
  { revalidate: 3600 }
);

// Cache comparison results for 1 hour
export const getCachedComparison = unstable_cache(
  async (
    releaseNotes: string,
    articleId: string,
    fetchFn: () => Promise<any>
  ) => {
    return fetchFn();
  },
  (releaseNotes, articleId) => [
    `comparison-${articleId}-${releaseNotes.substring(0, 50).replace(/\s+/g, '-')}`,
  ],
  { revalidate: 3600 }
);

// Cache embeddings for 24 hours (if using embeddings)
export const getCachedEmbedding = unstable_cache(
  async (articleId: string, fetchFn: () => Promise<any>) => {
    return fetchFn();
  },
  (articleId) => [`embedding-${articleId}`],
  { revalidate: 86400 }
);
