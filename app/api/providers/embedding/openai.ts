import OpenAI from "openai";
import type { Article, ScoredArticle } from "../types";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const EMBEDDING_MODEL = "text-embedding-3-small";

// Limits to avoid exceeding the model context window
const MAX_ARTICLES = 50;
const MAX_CHARS_PER_ARTICLE = 4000;

export class OpenAIProvider {
  async embed(texts: string[]): Promise<number[][]> {
    const response = await client.embeddings.create({
      model: EMBEDDING_MODEL,
      input: texts,
    });

    return response.data.map((item) => item.embedding);
  }

  async search(query: string, articles: Article[]): Promise<ScoredArticle[]> {
    if (!articles.length) return [];

    // 1) Limit number of articles and truncate long content
    const limitedArticles = articles.slice(0, MAX_ARTICLES);

    const inputs = [
      query,
      ...limitedArticles.map((a) => {
        const content =
          a.content.length > MAX_CHARS_PER_ARTICLE
            ? a.content.slice(0, MAX_CHARS_PER_ARTICLE)
            : a.content;

        return `${a.title}\n\n${content}`;
      }),
    ];

    const [queryEmbedding, ...articleEmbeddings] = await this.embed(inputs);

    // 2) Compute cosine similarity
    const scores = articleEmbeddings.map((embedding, index) => ({
      article: limitedArticles[index],
      score: cosineSimilarity(queryEmbedding, embedding),
    }));

    // 3) Sort and return top matches
    return scores
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((s) => ({
        ...s.article,
        relevanceScore: s.score,
      }));
  }
}

// Simple cosine similarity
function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }

  if (!na || !nb) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}
