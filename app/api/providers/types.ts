// Core types for impact analysis
export interface ImpactAnalysis {
  score: number;                    // 1-10
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  category: string;
  affectedRoles: string[];
  summary: string;
  actionRequired: string;
  riskAssessment: string;
}

// LLM Provider Interface (all providers must implement)
export interface LLMProvider {
  analyzeImpact(notes: string, article: string): Promise<ImpactAnalysis>;
  generateUpdate(notes: string, article: string): Promise<string>;
  translateText(text: string, targetLanguage: string): Promise<string>;
}

// Embedding types
export interface EmbeddingProvider {
  embed(texts: string[]): Promise<number[][]>;
  search(query: string, articles: Article[]): Promise<ScoredArticle[]>;
}

export interface Article {
  id: string;
  title: string;
  content: string;
  category?: string;
  updatedAt?: string;
}

export interface ScoredArticle extends Article {
  relevanceScore: number;
}

// API Request/Response types
export interface AnalysisRequest {
  releaseNotes: string;
  articleId?: string;
}

export interface AnalysisResponse {
  extraction: {
    features: string[];
    bugFixes: string[];
    deprecations: string[];
    breakingChanges: string[];
  };
  suggestedArticles: ScoredArticle[];
}

export interface CompareRequest {
  releaseNotes: string;
  articleId: string;
  articleContent: string;
}

export interface CompareResponse {
  shouldUpdate: boolean;
  suggestedUpdate: string;
  impactAnalysis: ImpactAnalysis;
}

export interface ExportRequest {
  articleTitle: string;
  content: string;
  impactAnalysis?: ImpactAnalysis;
  languages: string[];
  includeMetadata?: boolean;
}

// Error handling
export class ProviderError extends Error {
  constructor(
    public provider: string,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = "ProviderError";
  }
}

export class RateLimitError extends ProviderError {
  constructor(provider: string, public retryAfter: number) {
    super(provider, "RATE_LIMIT", `Rate limited. Retry after ${retryAfter}s`);
  }
}
