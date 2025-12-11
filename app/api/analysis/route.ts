// app/api/analysis/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getLLMProvider } from "../providers/llm/factory";
import { getEmbeddingProvider } from "../providers/embedding/factory";
import { getZendeskService } from "../zendesk/service";
import { AnalysisRequest, AnalysisResponse } from "../providers/types";

export async function POST(request: NextRequest) {
  try {
    const body: AnalysisRequest = await request.json();
    const { releaseNotes } = body;

    if (!releaseNotes || releaseNotes.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Release notes are required" },
        { status: 400 }
      );
    }

    console.log("[Analysis] Starting analysis of release notes...");

    // Get providers
    const llm = getLLMProvider();
    const embedding = getEmbeddingProvider();
    const zendeskService = getZendeskService();

    console.log("[Analysis] Extracting features from release notes...");
    const extraction = await llm.extractReleaseNotes(releaseNotes);

    console.log("[Analysis] Searching for relevant articles...");
    const { articles: allArticles } = await zendeskService.getAllArticles(
      1,
      100
    );

    const suggestedArticles = await embedding.search(releaseNotes, allArticles);

    console.log(
      `[Analysis] Found ${suggestedArticles.length} relevant articles`
    );

    const response: AnalysisResponse = {
      extraction,
      suggestedArticles: suggestedArticles.slice(0, 5),
    };

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("[/api/analysis]", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Analysis failed",
      },
      { status: 500 }
    );
  }
}