// lib/embeddings.ts - UPDATED with caching

import OpenAI from "openai";
import type { Article, ScoredArticle } from "../api/providers/types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ← ← ← ← ← ADD CACHE HERE
const embeddingCache = new Map<string, number[]>();

/**
 * Get embedding from cache or generate new one
 */
export async function getEmbeddingWithCache(text: string): Promise<number[]> {
  if (embeddingCache.has(text)) {
    console.log('[Embeddings] Cache hit');
    return embeddingCache.get(text)!;
  }
  const embedding = await embedText(text);
  embeddingCache.set(text, embedding);
  console.log(`[Embeddings] Cached embedding (cache size: ${embeddingCache.size})`);
  return embedding;
}

/**
 * Generate embedding for a single text
 */
export async function embedText(text: string): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    throw new Error('Text cannot be empty');
  }

  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text.substring(0, 8000),
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('[Embeddings] Error generating embedding:', error);
    throw error;
  }
}

/**
 * Calculate cosine similarity between two embeddings
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) {
    return 0;
  }

  let dot = 0;
  let na = 0;
  let nb = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }

  if (na === 0 || nb === 0) {
    return 0;
  }

  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/**
 * Find articles most similar to the given text
 */
export async function findSimilarArticles(
  text: string,
  articles: Article[],
  threshold: number = 0.6
): Promise<Article[]> {
  if (!articles || articles.length === 0) {
    return [];
  }

  try {
    // Embed the input text
    const queryEmbedding = await embedText(text);

    // Embed each article (title + preview of content)
    const articleScores = await Promise.all(
      articles.map(async article => {
        try {
          const articleText = `${article.title}. ${article.content.substring(0, 500)}`;
          const articleEmbedding = await embedText(articleText);
          const score = cosineSimilarity(queryEmbedding, articleEmbedding);

          return {
            ...article,
            relevanceScore: Math.round(score * 10), // Convert to 0-10 scale
            embeddingScore: score, // Keep original for filtering
          };
        } catch (error) {
          console.error(`Error embedding article ${article.id}:`, error);
          return {
            ...article,
            relevanceScore: 0,
            embeddingScore: 0,
          };
        }
      })
    );

    // Filter by threshold and sort by score
    return articleScores
      .filter(a => a.embeddingScore >= threshold)
      .sort((a, b) => b.embeddingScore - a.embeddingScore)
      .map(({ embeddingScore, ...article }) => article); // Remove temp field
  } catch (error) {
    console.error('Error finding similar articles:', error);
    return [];
  }
}

/**
 * Check if a topic has a similar article already
 * Returns true if found similar article (gap should be filtered out)
 */
export async function hasSimilarArticle(
  topic: string,
  articles: Article[],
  threshold: number = 0.6
): Promise<boolean> {
  try {
    const similar = await findSimilarArticles(topic, articles, threshold);
    return similar.length > 0;
  } catch (error) {
    console.error('Error checking for similar articles:', error);
    return false;
  }
}

/**
 * Batch embed multiple texts (more efficient)
 */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (!texts || texts.length === 0) {
    return [];
  }

  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: texts.map(t => t.substring(0, 8000)),
    });

    return response.data
      .sort((a, b) => a.index - b.index)
      .map(item => item.embedding);
  } catch (error) {
    console.error('Batch embedding error:', error);
    throw error;
  }
}

/**
 * Clear the embedding cache (useful for testing)
 */
export function clearEmbeddingCache(): void {
  embeddingCache.clear();
  console.log('[Embeddings] Cache cleared');
}

/**
 * Get cache statistics
 */
export function getEmbeddingCacheStats(): {
  size: number;
  items: string[];
} {
  const items = Array.from(embeddingCache.keys()).map(key =>
    key.substring(0, 50) + (key.length > 50 ? '...' : '')
  );

  return {
    size: embeddingCache.size,
    items,
  };
}