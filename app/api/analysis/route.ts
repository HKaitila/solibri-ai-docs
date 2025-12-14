// app/api/analysis/route.ts - CORRECTED PATH

import { NextRequest, NextResponse } from 'next/server';
import { getZendeskService, ZendeskArticle } from '../../../lib/zendesk';

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
  matchedKeywords: string[];
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

function extractKeywords(text: string): string[] {
  // Convert to lowercase and remove punctuation
  const cleaned = text.toLowerCase().replace(/[.,!?;:]/g, '');
  
  // Split into words
  const words = cleaned.split(/\s+/);
  
  // Filter: keep words > 3 chars, exclude common words
  const commonWords = new Set([
    'the', 'and', 'with', 'from', 'have', 'that', 'this', 'will',
    'about', 'your', 'also', 'been', 'more', 'than', 'when', 'what',
    'where', 'which', 'help', 'article', 'information', 'solibri'
  ]);
  
  const keywords = words
    .filter(word => word.length > 3 && !commonWords.has(word))
    .slice(0, 15); // Limit to 15 keywords
  
  return [...new Set(keywords)]; // Remove duplicates
}

function calculateRelevance(
  articleTitle: string,
  articleBody: string,
  keywords: string[]
): { score: number; matched: string[] } {
  const fullText = `${articleTitle} ${articleBody}`.toLowerCase();
  const matched: string[] = [];
  
  for (const keyword of keywords) {
    // Count occurrences with case-insensitive search
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    const occurrences = (fullText.match(regex) || []).length;
    
    if (occurrences > 0) {
      matched.push(keyword);
    }
  }
  
  // Calculate relevance score
  const score = keywords.length > 0 ? (matched.length / keywords.length) * 100 : 0;
  
  return { score, matched };
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

    // Extract keywords from release notes
    const keywords = extractKeywords(releaseNotes);
    console.log('[Analysis] Extracted keywords:', keywords);

    // Fetch Zendesk articles
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
          error: error instanceof Error ? error.message : 'Failed to fetch articles from Zendesk'
        },
        { status: 500 }
      );
    }

    // Calculate relevance for each article
    const scoredArticles: Array<{
      article: ZendeskArticle;
      score: number;
      matched: string[];
    }> = articles
      .map(article => {
        const { score, matched } = calculateRelevance(
          article.title,
          article.body,
          keywords
        );
        return { article, score, matched };
      })
      .filter(item => item.score > 0) // Only keep articles with matches
      .sort((a, b) => b.score - a.score)
      .slice(0, 5); // Top 5 matches

    // Format response articles
    const matchedArticles: MatchedArticle[] = scoredArticles.map(item => ({
      id: item.article.id,
      title: item.article.title,
      url: item.article.html_url || `https://help.solibri.com/hc/en-us/articles/${item.article.id}`,
      relevanceScore: Math.round(item.score),
      matchedKeywords: item.matched,
      suggestedUpdates: generateUpdateSuggestion(item.article, item.matched),
    }));

    // Detect gaps (keywords that didn't match any article strongly)
    const gaps = keywords
      .filter(keyword => {
        // Check if keyword appears in any matched article
        return !matchedArticles.some(article =>
          article.matchedKeywords.includes(keyword)
        );
      })
      .map(topic => ({
        topic,
        mentions: countMentions(releaseNotes, topic),
      }))
      .sort((a, b) => b.mentions - a.mentions)
      .slice(0, 5); // Top 5 gaps

    // Generate summary
    const summary = generateSummary(
      version,
      date,
      matchedArticles.length,
      gaps.length,
      keywords.length
    );

    console.log('[Analysis] Analysis complete. Found', matchedArticles.length, 'matching articles and', gaps.length, 'gaps');

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
    console.error('[Analysis] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Analysis failed',
      },
      { status: 500 }
    );
  }
}

function generateUpdateSuggestion(article: ZendeskArticle, matchedKeywords: string[]): string {
  if (matchedKeywords.length === 0) return 'Review for relevance';
  
  const keywordText = matchedKeywords.slice(0, 3).join(', ');
  
  if (article.body.length < 200) {
    return `Add more detail about: ${keywordText}`;
  } else if (matchedKeywords.length >= 2) {
    return `Update with new information about: ${keywordText}`;
  } else {
    return `Add section on: ${matchedKeywords[0]}`;
  }
}

function generateSummary(
  version: string,
  date: string,
  matchedCount: number,
  gapCount: number,
  totalKeywords: number
): string {
  const coverage = matchedCount > 0 ? 'Good' : 'Low';
  return `Version ${version} (${date}): ${matchedCount} articles need updates, ${gapCount} gaps found, ${totalKeywords} key features identified. Coverage: ${coverage}`;
}

function countMentions(text: string, keyword: string): number {
  const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
  const matches = text.match(regex);
  return matches ? matches.length : 0;
}