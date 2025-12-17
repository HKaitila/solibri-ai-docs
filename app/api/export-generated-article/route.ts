import { NextRequest, NextResponse } from 'next/server';
import {
  translateTextWithDeepl,
  isSupportedDeeplLang,
} from '../providers/translation/deepl';

interface ExportGeneratedArticleRequest {
  title: string;
  content: string;
  format: 'markdown' | 'html';
  targetLanguage?: 'FI' | 'DE' | 'NL' | 'FR';
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ExportGeneratedArticleRequest;
    const { title, content, format, targetLanguage } = body;

    if (!title || !content || !format) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 },
      );
    }

    const safeTitle = title.toLowerCase().replace(/\s+/g, '-');
    let output = content;
    let mimeType: string;
    let extension: string;

    switch (format) {
      case 'markdown':
        mimeType = 'text/markdown';
        extension = 'md';
        break;
      case 'html':
        mimeType = 'text/html';
        extension = 'html';
        break;
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid format' },
          { status: 400 },
        );
    }

    if (targetLanguage && isSupportedDeeplLang(targetLanguage)) {
      output = await translateTextWithDeepl(content, targetLanguage);
    }

    const langSuffix =
      targetLanguage && isSupportedDeeplLang(targetLanguage)
        ? `-${targetLanguage.toLowerCase()}`
        : '';

    const filename = `${safeTitle}-article${langSuffix}.${extension}`;

    return new NextResponse(output, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('[Export Generated Article] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Export failed',
      },
      { status: 500 },
    );
  }
}
