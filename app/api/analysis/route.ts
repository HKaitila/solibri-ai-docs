// app/api/analysis/route.ts - UPDATED: Using OpenAI Embeddings Integration

import { NextRequest, NextResponse } from 'next/server';
import { getZendeskService, ZendeskArticle } from '../../../lib/zendesk';
import { getEmbeddingProvider } from '../providers/embedding/factory';

interface AnalysisRequest {
  releaseNotes: string;
  version?: string;
  date?: string;
}

interface MatchedArticle {
  id: string;
  title: string;
  url: string;
  relevanceScore: number;
  suggestedUpdates?: string;
}

interface AnalysisResponse {
  success: boolean;
  data?: {
    articles: MatchedArticle[];
    gaps: Array<{ topic: string; mentions: number }>;
    summary: string;
    totalArticlesSearched: number;
  };
  error?: string;
}

/**
 * Extract key topics from release notes for gap detection
 */
function extractTopics(text: string): string[] {
  const cleaned = text.toLowerCase().replace(/[.,!?;:]/g, '');
  const words = cleaned.split(/\s+/);

  const commonWords = new Set([
    'the', 'and', 'with', 'from', 'have', 'that', 'this', 'will',
    'about', 'your', 'also', 'been', 'more', 'than', 'when', 'what',
    'where', 'which', 'help', 'article', 'information', 'solibri',
    'features', 'improvements', 'updates', 'new', 'version', 'release'
  ]);

  const topics = words
    .filter(word => word.length > 3 && !commonWords.has(word))
    .slice(0, 15);

  return [...new Set(topics)];
}

/**
 * Generate suggested update based on relevance score
 */
function generateUpdateSuggestion(score: number): string {
  if (score < 0.5) {
    return 'Review for relevance';
  } else if (score < 0.65) {
    return 'Update with related information';
  } else if (score < 0.8) {
    return 'Update with new information';
  } else {
    return 'Priority update required';
  }
}

/**
 * Count mentions of a keyword in text
 */
function countMentions(text: string, keyword: string): number {
  const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
  const matches = text.match(regex);
  return matches ? matches.length : 0;
}

/**
 * Generate analysis summary
 */
function generateSummary(
  version: string,
  date: string,
  matchedCount: number,
  gapCount: number,
  totalTopics: number
): string {
  const coverage = matchedCount >= 3 ? 'Good' : matchedCount >= 1 ? 'Moderate' : 'Low';
  return `Version ${version} (${date}): ${matchedCount} articles matched, ${gapCount} gaps identified, ${totalTopics} key topics. Coverage: ${coverage}`;
}

export async function POST(request: NextRequest): Promise<NextResponse<AnalysisResponse>> {
  try {
    const body: AnalysisRequest = await request.json();
    const { releaseNotes, version = 'Unknown', date = 'Unknown' } = body;

    if (!releaseNotes || releaseNotes.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Release notes are required' },
        { status: 400 }
      );
    }

    console.log('[Analysis] Starting analysis for version:', version);

    // Step 1: Fetch Zendesk articles
    console.log('[Analysis] Fetching Zendesk articles...');
    let articles: ZendeskArticle[];
    try {
      const zendeskService = getZendeskService();
      articles = await zendeskService.getAllArticles();
      console.log('[Analysis] Retrieved', articles.length, 'articles from Zendesk');
    } catch (error) {
      console.error('[Analysis] Error fetching Zendesk articles:', error);
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to fetch articles from Zendesk',
        },
        { status: 500 }
      );
    }

    // Step 2: Use OpenAI embeddings to find similar articles
    console.log('[Analysis] Using OpenAI embeddings for semantic matching...');
    let matchedArticles: MatchedArticle[] = [];
    try {
      const provider = getEmbeddingProvider();
      
      // Convert Zendesk articles to format expected by provider
      const providerArticles = articles.map(article => ({
        id: article.id,
        title: article.title,
        content: article.body,
        url: article.html_url || `https://help.solibri.com/hc/en-us/articles/${article.id}`,
      }));

      // Search for semantically similar articles
      const scoredArticles = await provider.search(releaseNotes, providerArticles);

      console.log('[Analysis] Found', scoredArticles.length, 'semantically similar articles');

      // Format results - take top 5
      matchedArticles = scoredArticles
        .slice(0, 5)
        .map(article => ({
          id: article.id,
          title: article.title,
          url: article.url,
          relevanceScore: Math.round(article.relevanceScore * 100), // Convert to 0-100 scale
          suggestedUpdates: generateUpdateSuggestion(article.relevanceScore),
        }));

      console.log('[Analysis] Formatted', matchedArticles.length, 'articles for response');
    } catch (error) {
      console.error('[Analysis] Error in semantic matching:', error);
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Semantic matching failed',
        },
        { status: 500 }
      );
    }

    // Step 3: Detect gaps (topics not well covered by matched articles)
    console.log('[Analysis] Detecting documentation gaps...');
    const topics = extractTopics(releaseNotes);
    const matchedTitles = matchedArticles.map(a => a.title.toLowerCase()).join(' ');

    const gaps = topics
      .filter(topic => !matchedTitles.includes(topic.toLowerCase()))
      .map(topic => ({
        topic,
        mentions: countMentions(releaseNotes, topic),
      }))
      .sort((a, b) => b.mentions - a.mentions)
      .slice(0, 5);

    console.log('[Analysis] Identified', gaps.length, 'documentation gaps');

    // Step 4: Generate summary
    const summary = generateSummary(
      version,
      date,
      matchedArticles.length,
      gaps.length,
      topics.length
    );

    console.log('[Analysis] Analysis complete');
    console.log('[Analysis] Results:', {
      articlesMatched: matchedArticles.length,
      gapsFound: gaps.length,
      totalArticlesSearched: articles.length,
    });

    return NextResponse.json({
      success: true,
      data: {
        articles: matchedArticles,
        gaps,
        summary,
        totalArticlesSearched: articles.length,
      },
    });

  } catch (error) {
    console.error('[Analysis] Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Analysis failed',
      },
      { status: 500 }
    );
  }
}