// app/api/export-draft/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generateExportableDraft } from '../../../lib/export-draft';
import {
  translateTextWithDeepl,
  isSupportedDeeplLang,
} from '@/api/providers/translation/deepl';

interface ExportDraftRequest {
  articleTitle: string;
  suggestion: string;
  draftUpdate: string;
  articleUrl: string;
  releaseVersion: string;
  format: 'markdown' | 'xml' | 'json';
  targetLanguage?: 'FI' | 'DE' | 'NL' | 'FR';
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ExportDraftRequest;
    const {
      articleTitle,
      suggestion,
      draftUpdate,
      articleUrl,
      releaseVersion,
      format,
      targetLanguage,
    } = body;

    if (!articleTitle || !draftUpdate || !format) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 },
      );
    }

    const { markdown, xml, json } = await generateExportableDraft(
      articleTitle,
      suggestion,
      draftUpdate,
      articleUrl,
      releaseVersion,
    );

    let content: string;
    let mimeType: string;
    let extension: string;

    switch (format) {
      case 'markdown':
        content = markdown;
        mimeType = 'text/markdown';
        extension = 'md';
        break;
      case 'xml':
        content = xml;
        mimeType = 'application/xml';
        extension = 'xml';
        break;
      case 'json':
        content = json;
        mimeType = 'application/json';
        extension = 'json';
        break;
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid format' },
          { status: 400 },
        );
    }

    // Optional translation
    let finalContent = content;

    if (targetLanguage && isSupportedDeeplLang(targetLanguage)) {
      finalContent = await translateTextWithDeepl(content, targetLanguage);  
    }

    const baseFilename = articleTitle.toLowerCase().replace(/\s+/g, '-');
    const langSuffix =
      targetLanguage && isSupportedDeeplLang(targetLanguage)
        ? `-${targetLanguage.toLowerCase()}`
        : '';
    const filename = `${baseFilename}-draft-update${langSuffix}.${extension}`;

    return new NextResponse(finalContent, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('[Export Draft] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Export failed',
      },
      { status: 500 },
    );
  }
}
