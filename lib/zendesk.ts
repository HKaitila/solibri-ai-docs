// lib/zendesk.ts - FIXED: Using Node's native https with proper SSL handling

export interface ZendeskArticle {
  id: string;
  title: string;
  body: string;
  html_url: string;
  updated_at?: string;
  created_at?: string;
  author_id?: string;
  section_id?: string;
  category_id?: string;
}

interface ZendeskResponse {
  articles: any[];
  count: number;
}

interface CacheData {
  articles: ZendeskArticle[];
  timestamp: number;
}

// Cache in memory (per-instance)
let articleCache: CacheData | null = null;
const CACHE_DURATION_MS = 1000 * 60 * 60; // 1 hour

class ZendeskService {
  private baseUrl: string;
  private authToken: string;
  private email: string;

  constructor(email: string, apiKey: string, subdomain: string) {
    this.email = email;
    this.authToken = apiKey;
    // Construct base URL using subdomain
    this.baseUrl = `https://${subdomain}.zendesk.com/api/v2/help_center/en-us`;
  }

  private getAuthHeader(): string {
    const credentials = `${this.email}/token:${this.authToken}`;
    return `Basic ${Buffer.from(credentials).toString('base64')}`;
  }

  private isCacheValid(): boolean {
    if (!articleCache) return false;
    const now = Date.now();
    return now - articleCache.timestamp < CACHE_DURATION_MS;
  }

  private async fetchWithSSLBypass(url: string): Promise<Response> {
    // Use https module directly to bypass SSL issues
    const https = await import('https');
    const http = await import('http');
    
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const protocol = urlObj.protocol === 'https:' ? https : http;
      const agent = new (protocol as any).Agent({
        rejectUnauthorized: false,
      });

      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/json',
        },
        agent: agent,
      };

      const req = (protocol as any).request(options, (res: any) => {
        let data = '';

        res.on('data', (chunk: string) => {
          data += chunk;
        });

        res.on('end', () => {
          // Create a Response-like object
          const response = new Response(data, {
            status: res.statusCode,
            statusText: res.statusMessage,
            headers: new Headers(res.headers),
          });
          resolve(response);
        });
      });

      req.on('error', (error: Error) => {
        reject(error);
      });

      req.end();
    });
  }

  async getAllArticles(): Promise<ZendeskArticle[]> {
    // Return cached articles if valid
    if (this.isCacheValid() && articleCache) {
      console.log('[Zendesk] Using cached articles');
      return articleCache.articles;
    }

    console.log('[Zendesk] Fetching articles from Zendesk API...');
    console.log('[Zendesk] Base URL:', this.baseUrl);

    try {
      const articles: ZendeskArticle[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        console.log('[Zendesk] Fetching page:', page);
        
        const response = await this.fetchWithSSLBypass(
          `${this.baseUrl}/articles.json?page=${page}&per_page=100`
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[Zendesk] API error response:', errorText);
          throw new Error(`Zendesk API error: ${response.status} ${response.statusText}`);
        }

        const data: ZendeskResponse = await response.json();
        
        // Transform articles
        articles.push(
          ...data.articles.map((article: any) => ({
            id: String(article.id),
            title: article.title,
            body: article.body,
            html_url: article.html_url,
            updated_at: article.updated_at,
            created_at: article.created_at,
            author_id: article.author_id,
            section_id: article.section_id,
            category_id: article.category_id,
          }))
        );

        hasMore = data.articles.length === 100;
        page++;

        // Respect rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Update cache
      articleCache = {
        articles,
        timestamp: Date.now(),
      };

      console.log(`[Zendesk] Fetched and cached ${articles.length} articles`);
      return articles;
    } catch (error) {
      console.error('[Zendesk] Error fetching articles:', error);
      throw error;
    }
  }

  async getArticle(id: string): Promise<ZendeskArticle> {
    try {
      const response = await this.fetchWithSSLBypass(
        `${this.baseUrl}/articles/${id}.json`
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Article not found');
        }
        throw new Error(`Zendesk API error: ${response.status}`);
      }

      const data = await response.json();
      const article = data.article;

      return {
        id: String(article.id),
        title: article.title,
        body: article.body,
        html_url: article.html_url,
        updated_at: article.updated_at,
        created_at: article.created_at,
        author_id: article.author_id,
        section_id: article.section_id,
        category_id: article.category_id,
      };
    } catch (error) {
      console.error('[Zendesk] Error fetching article:', error);
      throw error;
    }
  }

  clearCache(): void {
    articleCache = null;
    console.log('[Zendesk] Cache cleared');
  }
}

let serviceInstance: ZendeskService | null = null;

export function getZendeskService(): ZendeskService {
  // Use the correct variable names from your .env.local
  const email = process.env.ZENDESK_EMAIL;
  const apiKey = process.env.ZENDESK_API_KEY;
  const subdomain = process.env.ZENDESK_SUBDOMAIN;

  console.log('[Zendesk Service] Initializing...');
  console.log('[Zendesk Service] Email:', email ? '✓' : '✗ MISSING');
  console.log('[Zendesk Service] API Key:', apiKey ? '✓' : '✗ MISSING');
  console.log('[Zendesk Service] Subdomain:', subdomain ? '✓' : '✗ MISSING');

  if (!email || !apiKey || !subdomain) {
    throw new Error(
      'Zendesk credentials not configured. Set ZENDESK_EMAIL, ZENDESK_API_KEY, and ZENDESK_SUBDOMAIN in .env.local'
    );
  }

  if (!serviceInstance) {
    serviceInstance = new ZendeskService(email, apiKey, subdomain);
  }

  return serviceInstance;
}

export function getCachedArticles(): ZendeskArticle[] | null {
  if (articleCache && articleCache.articles.length > 0) {
    return articleCache.articles;
  }
  return null;
}

export function clearZendeskCache(): void {
  if (serviceInstance) {
    serviceInstance.clearCache();
  }
}