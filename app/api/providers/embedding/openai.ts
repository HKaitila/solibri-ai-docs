// app/api/providers/embedding/openai.ts - FIXED: Batch processing with token limit

import OpenAI from "openai";
import type { Article, ScoredArticle } from "../../types";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const EMBEDDING_MODEL = "text-embedding-3-small";

// Batch settings to avoid token limits
const BATCH_SIZE = 20; // Process 20 articles at a time
const MAX_ARTICLES = 500;
const MAX_CHARS_PER_ARTICLE = 4000; // Reduced from 8000 to save tokens

export class OpenAIProvider {
  /**
   * Embed texts in batches to avoid token limits
   */
  async embed(texts: string[]): Promise<number[][]> {
    if (!texts || texts.length === 0) {
      return [];
    }

    try {
      const response = await client.embeddings.create({
        model: EMBEDDING_MODEL,
        input: texts.map(t => t.substring(0, MAX_CHARS_PER_ARTICLE)), // Truncate to save tokens
      });

      return response.data
        .sort((a, b) => a.index - b.index)
        .map((item) => item.embedding);
    } catch (error) {
      console.error("[OpenAI] Embedding error:", error);
      throw error;
    }
  }

  /**
   * Search for similar articles - processes in batches to avoid token limits
   */
  async search(query: string, articles: Article[]): Promise<ScoredArticle[]> {
    if (!articles.length) {
      console.log("[OpenAI] No articles provided");
      return [];
    }

    try {
      console.log(`[OpenAI] Searching ${articles.length} articles...`);

      // Limit articles to process
      const limitedArticles = articles.slice(0, MAX_ARTICLES);

      console.log(`[OpenAI] Processing ${limitedArticles.length} articles for embedding`);

      // Step 1: Embed the query
      console.log("[OpenAI] Embedding query...");
      const queryEmbedding = await this.embed([
        query.substring(0, MAX_CHARS_PER_ARTICLE),
      ]);

      if (queryEmbedding.length === 0) {
        console.error("[OpenAI] Failed to generate query embedding");
        return [];
      }

      const queryEmbed = queryEmbedding[0];

      // Step 2: Embed articles in batches
      console.log(
        `[OpenAI] Embedding articles in batches of ${BATCH_SIZE}...`
      );

      const articleScores: Array<{
        article: Article;
        score: number;
      }> = [];

      // Process articles in batches
      for (let i = 0; i < limitedArticles.length; i += BATCH_SIZE) {
        const batch = limitedArticles.slice(
          i,
          Math.min(i + BATCH_SIZE, limitedArticles.length)
        );
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(limitedArticles.length / BATCH_SIZE);

        console.log(
          `[OpenAI] Batch ${batchNum}/${totalBatches} (${batch.length} articles)...`
        );

        try {
          // Prepare article texts
          const articleTexts = batch.map((a) => {
            const content =
              a.content.length > MAX_CHARS_PER_ARTICLE
                ? a.content.slice(0, MAX_CHARS_PER_ARTICLE)
                : a.content;
            return `${a.title}\n\n${content}`;
          });

          // Get embeddings for this batch
          const batchEmbeddings = await this.embed(articleTexts);

          // Calculate similarities for this batch
          for (let j = 0; j < batch.length; j++) {
            const embedding = batchEmbeddings[j];
            const score = cosineSimilarity(queryEmbed, embedding);

            articleScores.push({
              article: batch[j],
              score,
            });
          }
        } catch (batchError) {
          console.error(
            `[OpenAI] Error processing batch ${batchNum}:`,
            batchError
          );
          // Continue with next batch even if one fails
          continue;
        }
      }

      console.log(
        `[OpenAI] Processed ${articleScores.length} articles successfully`
      );

      // Sort by score and return top results
      const topResults = articleScores
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .map((s) => ({
          ...s.article,
          relevanceScore: s.score,
        }));

      console.log(`[OpenAI] Found ${topResults.length} top matching articles`);

      return topResults;
    } catch (error) {
      console.error("[OpenAI] Search error:", error);
      throw error;
    }
  }
}

/**
 * Compute cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
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