// app/api/analysis/route.ts
// Consolidated endpoint: merges suggest-articles + detect-gaps functionality
// Uses existing providers for clean, maintainable code

import { NextRequest, NextResponse } from 'next/server';
import { getLLMProvider } from '@/api/providers/llm/factory';
import { getEmbeddingProvider } from '@/api/providers/embedding/factory';
import { getZendeskService } from '@/api/zendesk/service';

interface Article {
  id: string;
  title: string;
  content: string;
  relevanceScore: number;
  category?: string;
  updatedAt?: string;
}

interface AnalysisGap {
  topic: string;
  mentions: number;
}

interface AnalysisResponse {
  success: boolean;
  data?: {
    articles: Article[];
    gaps: AnalysisGap[];
    summary: string;
  };
  error?: string;
  debug?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<AnalysisResponse>> {
  try {
    const body = await request.json();
    const { releaseNotes, version = '', date = '' } = body;

    // Validation
    if (!releaseNotes || typeof releaseNotes !== 'string' || releaseNotes.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Release notes are required and cannot be empty',
        },
        { status: 400 }
      );
    }

    console.log('[Analysis] Starting analysis of release notes...');

    // Initialize providers
    const llm = getLLMProvider();
    const embedding = getEmbeddingProvider();
    const zendeskService = getZendeskService();

    // ==========================================
    // STEP 1: Extract features from release notes
    // ==========================================
    console.log('[Analysis] Extracting features from release notes...');
    const extraction = await llm.extractReleaseNotes(releaseNotes);
    const extractedTopics = [
      ...extraction.features,
      ...extraction.bugFixes,
      ...extraction.breakingChanges,
    ];

    // ==========================================
    // STEP 2: Fetch all articles from Zendesk
    // ==========================================
    console.log('[Analysis] Fetching articles from Zendesk...');
    let allArticles: Article[] = [];
    try {
      const { articles } = await zendeskService.getAllArticles(1, 100);
      allArticles = articles;
      console.log(`[Analysis] Retrieved ${allArticles.length} articles from Zendesk`);
    } catch (error) {
      console.warn('[Analysis] Failed to fetch from Zendesk, continuing with mock data:', error);
      // Fallback to mock data for testing
      allArticles = getMockArticles();
    }

    // ==========================================
    // STEP 3: Find relevant articles using embeddings
    // ==========================================
    console.log('[Analysis] Finding similar articles using embeddings...');
    let suggestedArticles: Article[] = [];
    try {
      suggestedArticles = await embedding.search(releaseNotes, allArticles);
      console.log(`[Analysis] Found ${suggestedArticles.length} relevant articles via embeddings`);
    } catch (embedError) {
      console.warn('[Analysis] Embeddings search failed, using fallback:', embedError);
      // Fallback: basic keyword matching
      suggestedArticles = fallbackArticleMatching(releaseNotes, allArticles);
    }

    // ==========================================
    // STEP 4: Detect documentation gaps
    // ==========================================
    console.log('[Analysis] Detecting documentation gaps...');
    const gaps = await detectGaps(
      extractedTopics,
      suggestedArticles,
      allArticles,
      llm,
      embedding
    );

    // ==========================================
    // STEP 5: Generate summary
    // ==========================================
    const summary = `Found ${suggestedArticles.length} articles to update and ${gaps.length} documentation gaps.`;

    return NextResponse.json(
      {
        success: true,
        data: {
          articles: suggestedArticles.slice(0, 10),
          gaps: gaps.slice(0, 8),
          summary,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Analysis] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Analysis failed',
        debug: error instanceof Error ? error.stack?.substring(0, 300) : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * Detect documentation gaps by finding topics mentioned in release notes
 * that don't have corresponding articles
 */
async function detectGaps(
  extractedTopics: string[],
  suggestedArticles: Article[],
  allArticles: Article[],
  llm: ReturnType<typeof getLLMProvider>,
  embedding: ReturnType<typeof getEmbeddingProvider>
): Promise<AnalysisGap[]> {
  const suggestedTitles = new Set(
    suggestedArticles.map((a) => a.title.toLowerCase())
  );
  const allArticleTitles = new Set(
    allArticles.map((a) => a.title.toLowerCase())
  );

  const gaps: AnalysisGap[] = [];

  for (const topic of extractedTopics) {
    if (!topic || topic.length === 0) continue;

    const topicLower = topic.toLowerCase();

    // Check if topic is covered by suggested articles
    let isTopicCovered = suggestedTitles.has(topicLower);

    // Also check all articles as fallback
    if (!isTopicCovered) {
      isTopicCovered = allArticleTitles.has(topicLower);
    }

    // Check using embeddings for semantic similarity
    if (!isTopicCovered) {
      try {
        const similarArticles = await embedding.search(topic, allArticles);
        // If any article has relevance score > 0.6, consider it covered
        if (similarArticles.some((a) => a.relevanceScore > 0.6)) {
          isTopicCovered = true;
        }
      } catch (error) {
        console.warn(`[DetectGaps] Embedding search failed for "${topic}":`, error);
      }
    }

    if (!isTopicCovered) {
      gaps.push({
        topic,
        mentions: extractedTopics.filter(
          (t) => t.toLowerCase() === topicLower
        ).length,
      });
    }
  }

  // Remove duplicates
  const uniqueGaps = Array.from(
    new Map(gaps.map((g) => [g.topic.toLowerCase(), g])).values()
  );

  return uniqueGaps;
}

/**
 * Fallback: simple keyword matching when embeddings fail
 */
function fallbackArticleMatching(releaseNotes: string, articles: Article[]): Article[] {
  const releaseNotesLower = releaseNotes.toLowerCase();
  const words = releaseNotesLower.split(/\W+/).filter((w) => w.length > 3);
  const wordSet = new Set(words);

  return articles
    .map((article) => {
      const titleWords = article.title.toLowerCase().split(/\W+/);
      const contentWords = article.content.toLowerCase().split(/\W+/);
      const allWords = [...titleWords, ...contentWords];

      const matches = allWords.filter((w) => wordSet.has(w)).length;
      const relevanceScore = Math.min(
        1,
        Math.round((matches / Math.max(words.length, 1)) * 100) / 100
      );

      return {
        ...article,
        relevanceScore: Math.max(0.1, relevanceScore),
      };
    })
    .filter((a) => a.relevanceScore > 0.2)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 10);
}

/**
 * Mock articles for testing when Zendesk is unavailable
 */
function getMockArticles(): Article[] {
  return [
    {
      id: '1',
      title: 'Getting Started with Solibri',
      content: 'Learn the basics of Solibri BIM software. Installation, setup, and initial configuration.',
      category: 'Getting Started',
      updatedAt: '2025-12-01',
      relevanceScore: 0,
    },
    {
      id: '2',
      title: 'Importing IFC Files',
      content:
        'How to import IFC files into Solibri. Supports IFC 2x3, IFC 4.0, IFC 4.1, and IFC 4.4 formats.',
      category: 'Importing',
      updatedAt: '2025-11-15',
      relevanceScore: 0,
    },
    {
      id: '3',
      title: 'Model Checking and Validation',
      content:
        'Use Solibri Model Checker to validate BIM models. Check for clashes, collisions, and quality issues.',
      category: 'Quality Assurance',
      updatedAt: '2025-10-30',
      relevanceScore: 0,
    },
    {
      id: '4',
      title: 'Clash Detection Guide',
      content:
        'Detect and resolve clashes between building systems. Configure clash detection rules and review results.',
      category: 'Quality Assurance',
      updatedAt: '2025-11-01',
      relevanceScore: 0,
    },
    {
      id: '5',
      title: 'Exporting and Reporting',
      content:
        'Export your analysis results in various formats. Generate professional reports for stakeholders.',
      category: 'Exporting',
      updatedAt: '2025-09-20',
      relevanceScore: 0,
    },
  ];
}