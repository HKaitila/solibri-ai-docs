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

    // TEMPORARY: Return top 5 articles by relevance (without calling OpenAI)
    // Just do a simple text match for now
    const queryLower = query.toLowerCase();
    const scored = articles.map(article => ({
      ...article,
      relevanceScore: 
        (article.title.toLowerCase().includes(queryLower) ? 0.8 : 0) +
        (article.content.toLowerCase().includes(queryLower) ? 0.5 : 0)
    }));

    return scored
      .filter(a => a.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.score)
      .slice(0, 5);
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
