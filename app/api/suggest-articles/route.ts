import { NextRequest, NextResponse } from "next/server";
import { getZendeskService } from "../zendesk/service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { releaseNotes } = body;

    if (!releaseNotes || releaseNotes.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Release notes are required" },
        { status: 400 }
      );
    }

    console.log("[SuggestArticles] Searching for relevant articles...");

    const zendeskService = getZendeskService();

    const { articles: allArticles } = await zendeskService.getAllArticles(
      1,
      100
    );

    // TEMPORARY: Simple text matching instead of OpenAI embeddings
    const queryLower = releaseNotes.toLowerCase();
    const suggestedArticles = allArticles
      .map(article => ({
        ...article,
        relevanceScore: 
          (article.title.toLowerCase().includes(queryLower) ? 0.8 : 0) +
          (article.content.toLowerCase().includes(queryLower) ? 0.5 : 0)
      }))
      .filter(a => a.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 10);

    console.log(`[SuggestArticles] Found ${suggestedArticles.length} articles`);

    return NextResponse.json({
      success: true,
      data: {
        articles: suggestedArticles,
      },
    });
  } catch (error) {
    console.error("[/api/suggest-articles]", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to suggest articles",
      },
      { status: 500 }
    );
  }
}
