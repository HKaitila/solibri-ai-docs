import { NextRequest, NextResponse } from "next/server";
import { getZendeskService } from "../../service";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Article ID is required" },
        { status: 400 }
      );
    }

    const zendeskService = getZendeskService();
    const article = await zendeskService.getArticle(id);

    return NextResponse.json({
      success: true,
      data: { article },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        {
          success: false,
          error: "Article not found",
        },
        { status: 404 }
      );
    }

    console.error("[/api/zendesk/article/[id]]", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch article",
      },
      { status: 500 }
    );
  }
}
