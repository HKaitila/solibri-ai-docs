// lib/embeddings.ts
import { OpenAI } from 'openai';

interface Article {
  id: string;
  title: string;
  content: string;
  category: string;
  updatedAt: string;
  relevanceScore: number;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Embed text using OpenAI's text-embedding-3-small model
 */
export async function embedText(text: string): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    throw new Error('Text cannot be empty');
  }

  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text.substring(0, 8000), // OpenAI has token limits
    });

    if (!response.data || response.data.length === 0) {
      throw new Error('No embedding returned from OpenAI');
    }

    return response.data[0].embedding;
  } catch (error) {
    console.error('Embedding error:', error);
    throw error;
  }
}

/**
 * Calculate cosine similarity between two embedding vectors
 * Returns value between 0 and 1 (1 = identical, 0 = completely different)
 */
export function cosineSimilarity(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    magnitude1 += vec1[i] * vec1[i];
    magnitude2 += vec2[i] * vec2[i];
  }

  const denominator = Math.sqrt(magnitude1) * Math.sqrt(magnitude2);

  if (denominator === 0) {
    return 0;
  }

  return dotProduct / denominator;
}

/**
 * Find articles most similar to the given text using embeddings
 * Returns articles ranked by semantic similarity
 */
export async function findSimilarArticles(
  text: string,
  articles: Article[],
  threshold: number = 0.4
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