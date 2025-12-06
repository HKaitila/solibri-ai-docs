import { Article } from "../providers/types";

// Temporary fix for SSL certificate issue on Windows
if (process.env.NODE_ENV === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

export interface ZendeskArticle {
  id: number;
  title: string;
  body: string;
  created_at: string;
  updated_at: string;
  section_id: number;
}

export class ZendeskService {
  private subdomain: string;
  private email: string;
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.subdomain = process.env.ZENDESK_SUBDOMAIN || "";
    this.email = process.env.ZENDESK_EMAIL || "";
    this.apiKey = process.env.ZENDESK_API_KEY || "";

    if (!this.subdomain || !this.email || !this.apiKey) {
      throw new Error(
        "Zendesk credentials not configured. Set ZENDESK_SUBDOMAIN, ZENDESK_EMAIL, and ZENDESK_API_KEY"
      );
    }

    this.baseUrl = `https://${this.subdomain}.zendesk.com/api/v2`;
  }

  private getAuthHeader(): string {
    const credentials = `${this.email}/token:${this.apiKey}`;
    const encoded = Buffer.from(credentials).toString("base64");
    return `Basic ${encoded}`;
  }

  async getAllArticles(
    page: number = 1,
    perPage: number = 100
  ): Promise<{
    articles: Article[];
    total: number;
    pages: number;
  }> {
    try {
      const url = `${this.baseUrl}/help_center/articles.json?page=${page}&per_page=${perPage}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: this.getAuthHeader(),
          "Content-Type": "application/json",
        },
      });

      if (response.status === 401) {
        throw new Error("Zendesk authentication failed. Check API credentials.");
      }

      if (!response.ok) {
        throw new Error(
          `Zendesk API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      const articles: Article[] = data.articles.map(
        (article: ZendeskArticle) => ({
          id: String(article.id),
          title: article.title,
          content: article.body,
          category: `section_${article.section_id}`,
          updatedAt: article.updated_at,
        })
      );

      return {
        articles,
        total: data.count,
        pages: Math.ceil(data.count / perPage),
      };
    } catch (error) {
      console.error("Error fetching articles:", error);
      throw error;
    }
  }

  async searchArticles(query: string): Promise<Article[]> {
    try {
      const url = `${this.baseUrl}/help_center/articles/search.json?query=${encodeURIComponent(query)}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: this.getAuthHeader(),
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Zendesk search error: ${response.statusText}`);
      }

      const data = await response.json();

      return data.results.map((article: ZendeskArticle) => ({
        id: String(article.id),
        title: article.title,
        content: article.body,
        category: `section_${article.section_id}`,
        updatedAt: article.updated_at,
      }));
    } catch (error) {
      console.error("Error searching articles:", error);
      throw error;
    }
  }

  async getArticle(articleId: string): Promise<Article> {
    try {
      const url = `${this.baseUrl}/help_center/articles/${articleId}.json`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: this.getAuthHeader(),
          "Content-Type": "application/json",
        },
      });

      if (response.status === 404) {
        throw new Error(`Article not found: ${articleId}`);
      }

      if (!response.ok) {
        throw new Error(`Zendesk API error: ${response.statusText}`);
      }

      const data = await response.json();
      const article = data.article;

      return {
        id: String(article.id),
        title: article.title,
        content: article.body,
        category: `section_${article.section_id}`,
        updatedAt: article.updated_at,
      };
    } catch (error) {
      console.error("Error fetching article:", error);
      throw error;
    }
  }

  async getArticleCount(): Promise<number> {
    try {
      const response = await fetch(`${this.baseUrl}/help_center/articles.json?per_page=1`, {
        method: "GET",
        headers: {
          Authorization: this.getAuthHeader(),
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Zendesk API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.count;
    } catch (error) {
      console.error("Error getting article count:", error);
      throw error;
    }
  }
}

let zendeskService: ZendeskService | null = null;

export function getZendeskService(): ZendeskService {
  if (!zendeskService) {
    zendeskService = new ZendeskService();
  }
  return zendeskService;
}
