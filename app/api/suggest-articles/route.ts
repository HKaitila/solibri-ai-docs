import { NextRequest, NextResponse } from 'next/server';
import { getZendeskService } from '../zendesk/service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { releaseNotes } = body;

    if (!releaseNotes || releaseNotes.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Release notes are required' },
        { status: 400 }
      );
    }

    console.log('[SuggestArticles] Searching for relevant articles...');
    
    const zendeskService = getZendeskService();
    
    // Fetch articles from Zendesk
    const result = await zendeskService.getAllArticles(1, 100);
    let allArticles = Array.isArray(result) ? result : result?.articles || [];
    
    console.log(`[SuggestArticles] Fetched ${allArticles.length} articles`);

    // Extract keywords from release notes
    const keywords = extractKeywords(releaseNotes);
    console.log(`[SuggestArticles] Keywords: ${keywords.join(', ')}`);

    // Score articles based on keyword matches
    const suggestedArticles = allArticles
      .map((article: any) => {
        const titleLower = (article.title || '').toLowerCase();
        const contentLower = (article.content || '').toLowerCase();
        
        // Count keyword matches
        let score = 0;
        keywords.forEach(keyword => {
          if (titleLower.includes(keyword)) score += 2; // Title match = higher weight
          if (contentLower.includes(keyword)) score += 1;
        });
        
        return {
          ...article,
          relevanceScore: score
        };
      })
      .filter((a: any) => a.relevanceScore > 0)
      .sort((a: any, b: any) => b.relevanceScore - a.relevanceScore)
      .slice(0, 10);

    console.log(`[SuggestArticles] Found ${suggestedArticles.length} articles`);

    return NextResponse.json({
      success: true,
      data: { articles: suggestedArticles }
    });
  } catch (error) {
    console.error('[SuggestArticles API Error]', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to suggest articles'
      },
      { status: 500 }
    );
  }
}

// Extract meaningful keywords from release notes
function extractKeywords(text: string): string[] {
  // Common technical terms and features
  const stopWords = new Set([
    'added', 'fixed', 'improved', 'the', 'a', 'an', 'and', 'or', 'in', 'on', 'at', 
    'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'been', 'be',
    'have', 'has', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may',
    'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
    'breaking', 'changes', 'new', 'feature', 'bug', 'crash', 'now', 'required'
  ]);

  // Split on whitespace and special chars, convert to lowercase
  const words = text
    .toLowerCase()
    .split(/[\s\-_.,;:!?()[\]{}]+/)
    .filter(word => word.length > 2 && !stopWords.has(word))
    .filter((word, idx, arr) => arr.indexOf(word) === idx); // Unique only

  // Key technical keywords for Solibri
  const technicalTerms = words.filter(word =>
    /ifc|ruleset|config|clash|model|property|export|import|filter|check|rule|attribute/.test(word)
  );

  // Return technical terms first, then general keywords
  return [...technicalTerms, ...words].slice(0, 10);
}
