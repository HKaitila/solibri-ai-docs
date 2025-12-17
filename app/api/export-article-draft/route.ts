import { NextRequest, NextResponse } from 'next/server';

interface ExportRequest {
  releaseNotes: string;
  articleTitle: string;
  articleUrl?: string;
  suggestion: string;
  draftUpdate: string;
  format: 'paligo-xml' | 'markdown' | 'html';
}

function generatePaligoXml(request: ExportRequest): string {
  const { articleTitle, articleUrl, suggestion, draftUpdate, releaseNotes } = request;
  const timestamp = new Date().toISOString();
  const sanitizeForXml = (text: string) =>
    text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

  return `<?xml version="1.0" encoding="UTF-8"?>
<topic id="solibri-article-draft-${Date.now()}">
  <title>${sanitizeForXml(articleTitle)}</title>
  <body>
    <section>
      <title>Original Article</title>
      <p><xref href="${sanitizeForXml(articleUrl || '#')}" format="html" scope="external">View original</xref></p>
    </section>
    <section>
      <title>Analysis Summary</title>
      <p>${sanitizeForXml(suggestion)}</p>
    </section>
    <section>
      <title>Suggested Updates</title>
      <p>${sanitizeForXml(draftUpdate)}</p>
    </section>
    <section>
      <title>Generated</title>
      <p>${timestamp}</p>
    </section>
  </body>
</topic>`;
}

function generateMarkdown(request: ExportRequest): string {
  const { articleTitle, articleUrl, suggestion, draftUpdate } = request;
  return `# ${articleTitle}

## Original Article
[View](${articleUrl || '#'})

## Analysis
${suggestion}

## Updates
${draftUpdate}

---
Generated: ${new Date().toISOString()}`;
}

function generateHtml(request: ExportRequest): string {
  const { articleTitle, articleUrl, suggestion, draftUpdate } = request;
  const escape = (text: string) =>
    text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  return `<!DOCTYPE html>
<html>
<head>
  <title>${escape(articleTitle)}</title>
  <style>body{font-family:sans-serif;max-width:800px;margin:0 auto;padding:20px}h1{color:#0066cc}section{background:#f9f9f9;padding:15px;margin:15px 0;border-radius:6px}</style>
</head>
<body>
  <h1>${escape(articleTitle)}</h1>
  <section>
    <h2>Original</h2>
    <p><a href="${escape(articleUrl || '#')}" target="_blank">View Article</a></p>
  </section>
  <section>
    <h2>Analysis</h2>
    <p>${escape(suggestion)}</p>
  </section>
  <section>
    <h2>Updates</h2>
    <p>${escape(draftUpdate)}</p>
  </section>
</body>
</html>`;
}

export async function POST(request: NextRequest) {
  try {
    const body: ExportRequest = await request.json();
    const { releaseNotes, articleTitle, articleUrl, suggestion, draftUpdate, format } = body;

    if (!articleTitle || !draftUpdate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    let content: string;
    let contentType: string;
    let fileExtension: string;

    switch (format) {
      case 'paligo-xml':
        content = generatePaligoXml({ releaseNotes, articleTitle, articleUrl, suggestion, draftUpdate, format });
        contentType = 'application/xml';
        fileExtension = 'xml';
        break;
      case 'markdown':
        content = generateMarkdown({ releaseNotes, articleTitle, articleUrl, suggestion, draftUpdate, format });
        contentType = 'text/markdown';
        fileExtension = 'md';
        break;
      default:
        content = generateHtml({ releaseNotes, articleTitle, articleUrl, suggestion, draftUpdate, format });
        contentType = 'text/html';
        fileExtension = 'html';
    }

    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': `${contentType}; charset=utf-8`,
        'Content-Disposition': `attachment; filename="${articleTitle.replace(/\s+/g, '-')}-draft.${fileExtension}"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Export failed' },
      { status: 500 }
    );
  }
}
