import { NextRequest, NextResponse } from "next/server";
import { getZendeskService } from "../service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const perPage = Math.min(parseInt(searchParams.get("per_page") || "20"), 100);

    const zendeskService = getZendeskService();

    let articles;
    let total = 0;
    let pages = 0;

    if (search && search.trim()) {
      articles = await zendeskService.searchArticles(search);
      total = articles.length;
      pages = Math.ceil(total / perPage);
      articles = articles.slice((page - 1) * perPage, page * perPage);
    } else {
      const result = await zendeskService.getAllArticles(page, perPage);
      articles = result.articles;
      total = result.total;
      pages = result.pages;
    }

    return NextResponse.json({
      success: true,
      data: {
        articles,
        pagination: {
          page,
          perPage,
          total,
          pages,
          hasNextPage: page < pages,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("[/api/zendesk/articles]", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch articles",
      },
      { status: 500 }
    );
  }
}
