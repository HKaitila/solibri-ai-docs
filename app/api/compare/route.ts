import { NextRequest, NextResponse } from "next/server";
import { getLLMProvider } from "../providers/llm/factory";
import { CompareRequest, CompareResponse } from "../providers/types";

export async function POST(request: NextRequest) {
  try {
    const body: CompareRequest = await request.json();
    const { releaseNotes, articleId, articleContent } = body;

    if (!releaseNotes || !articleContent) {
      return NextResponse.json(
        {
          success: false,
          error: "Release notes and article content are required",
        },
        { status: 400 }
      );
    }

    console.log(`[Compare] Analyzing article ${articleId}...`);

    const llm = getLLMProvider();

    const impactAnalysis = await llm.analyzeImpact(releaseNotes, articleContent);

    console.log(
      `[Compare] Impact analysis complete: severity=${impactAnalysis.severity}, score=${impactAnalysis.score}`
    );

    const suggestedUpdate = await llm.generateUpdate(
      releaseNotes,
      articleContent
    );

    console.log(`[Compare] Generated updated article (${suggestedUpdate.length} chars)`);

    const response: CompareResponse = {
      shouldUpdate: impactAnalysis.score >= 5,
      suggestedUpdate,
      impactAnalysis,
    };

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("[/api/compare]", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Comparison failed",
      },
      { status: 500 }
    );
  }
}
