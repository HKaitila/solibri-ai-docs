// app/api/export/route.ts - Export Analysis Results
import { NextRequest, NextResponse } from 'next/server';

interface ExportData {
  version: string;
  releaseNotes: string;
  matchedArticles: any[];
  gaps: any[];
  timestamp: string;
}

export async function POST(request: NextRequest) {
  try {
    const { format, analysis } = await request.json() as {
      format: 'xml' | 'markdown' | 'json';
      analysis: ExportData;
    };

    let content: string;
    let mimeType: string;
    let filename: string;

    if (format === 'xml') {
      content = generateXML(analysis);
      mimeType = 'application/xml';
      filename = 'analysis.xml';
    } else if (format === 'markdown') {
      content = generateMarkdown(analysis);
      mimeType = 'text/markdown';
      filename = 'analysis.md';
    } else if (format === 'json') {
      content = JSON.stringify(analysis, null, 2);
      mimeType = 'application/json';
      filename = 'analysis.json';
    } else {
      throw new Error('Invalid format');
    }

    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Export failed' },
      { status: 400 }
    );
  }
}

function generateXML(data: ExportData): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<analysis>\n';
  xml += `  <version>${escapeXml(data.version)}</version>\n`;
  xml += `  <timestamp>${data.timestamp}</timestamp>\n`;
  xml += '  <articles>\n';

  data.matchedArticles.forEach(article => {
    xml += '    <article>\n';
    xml += `      <id>${escapeXml(article.id)}</id>\n`;
    xml += `      <title>${escapeXml(article.title)}</title>\n`;
    xml += `      <score>${Math.round(article.relevanceScore * 100)}</score>\n`;
    xml += '    </article>\n';
  });

  xml += '  </articles>\n  <gaps>\n';

  data.gaps.forEach((gap: any) => {
    xml += '    <gap>\n';
    xml += `      <topic>${escapeXml(gap.topic)}</topic>\n`;
    xml += `      <reason>${escapeXml(gap.reason || '')}</reason>\n`;
    xml += '    </gap>\n';
  });

  xml += '  </gaps>\n</analysis>';
  return xml;
}

function generateMarkdown(data: ExportData): string {
  let md = `# Documentation Gap Analysis Report\n\n`;
  md += `**Version:** ${data.version}\n`;
  md += `**Generated:** ${new Date(data.timestamp).toLocaleString()}\n\n`;
  md += `## Summary\n`;
  md += `- Articles found: ${data.matchedArticles.length}\n`;
  md += `- Documentation gaps: ${data.gaps.length}\n\n`;
  md += `## Articles to Update\n\n`;

  data.matchedArticles.forEach(article => {
    md += `### ${article.title}\n`;
    md += `**Relevance:** ${Math.round(article.relevanceScore * 100)}%\n\n`;
  });

  md += `## Documentation Gaps\n\n`;
  data.gaps.forEach((gap: any) => {
    md += `### ${gap.topic}\n`;
    md += `${gap.reason || 'Mentioned in release notes'}\n\n`;
  });

  return md;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
