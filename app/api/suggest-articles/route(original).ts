import { NextRequest, NextResponse } from "next/server";
import { getEmbeddingProvider } from "../providers/embedding/factory";
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

    const embedding = getEmbeddingProvider();
    const zendeskService = getZendeskService();

    const { articles: allArticles } = await zendeskService.getAllArticles(
      1,
      100
    );

    const suggestedArticles = await embedding.search(releaseNotes, allArticles);

    console.log(`[SuggestArticles] Found ${suggestedArticles.length} articles`);

    return NextResponse.json({
      success: true,
      data: {
        articles: suggestedArticles.slice(0, 10),
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
