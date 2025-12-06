import { EmbeddingProvider, Article, ScoredArticle } from "../types";

export class OpenAIProvider implements EmbeddingProvider {
  private apiKey: string;
  private model = "text-embedding-3-small";

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || "";
    if (!this.apiKey) {
      throw new Error("OPENAI_API_KEY not set");
    }
  }

  async embed(text: string): Promise<number[]> {
    const cleanText = text.substring(0, 32000);

    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: cleanText,
        model: this.model,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI embedding error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data.embedding;
  }

  async search(
    query: string,
    articles: Article[]
  ): Promise<ScoredArticle[]> {
    if (!articles || articles.length === 0) {
      return [];
    }

    try {
      const queryEmbedding = await this.embed(query);

      const articleTexts = articles.map((a) => `${a.title}. ${a.content}`);
      const embeddings = await Promise.all(
        articleTexts.map((text) => this.embed(text))
      );

      const scores = embeddings.map((embedding, index) => ({
        article: articles[index],
        score: this.cosineSimilarity(queryEmbedding, embedding),
      }));

      return scores
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .map((item) => ({
          ...item.article,
          relevanceScore: item.score,
        }));
    } catch (error) {
      console.error("Search error:", error);
      throw error;
    }
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));

    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0;
    }

    return dotProduct / (magnitudeA * magnitudeB);
  }
}
