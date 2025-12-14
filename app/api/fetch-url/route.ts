// app/api/fetch-url/route.ts (SIMPLER, MORE RELIABLE VERSION)
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'Valid URL required' },
        { status: 400 }
      );
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    console.log('Fetching URL:', url);

    // Fetch the content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Cache-Control': 'no-cache',
      }
    });

    if (!response.ok) {
      console.error(`Fetch failed: ${response.status}`);
      return NextResponse.json(
        { error: `Failed to fetch URL: HTTP ${response.status}` },
        { status: 400 }
      );
    }

    const html = await response.text();
    console.log('HTML length received:', html.length);

    // Extract text content - simpler, more reliable approach
    let content = html;

    // Remove scripts and styles first
    content = content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '');

    // Remove HTML tags
    content = content
      .replace(/<[^>]+>/g, ' ')
      // Decode entities
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&ndash;/g, '–')
      .replace(/&mdash;/g, '—')
      // Clean whitespace
      .replace(/\s+/g, ' ')
      .trim();

    console.log('Content after extraction:', content.length);

    if (!content || content.length < 100) {
      console.error('Content too short after extraction');
      return NextResponse.json(
        { 
          error: 'No readable content found at URL. Try a different URL or paste the text manually.',
          debug: {
            originalLength: html.length,
            extractedLength: content.length,
            preview: content.substring(0, 200)
          }
        },
        { status: 400 }
      );
    }

    // Limit to 10k characters
    const finalContent = content.substring(0, 10000);

    console.log('Returning content:', finalContent.length, 'characters');

    return NextResponse.json({
      success: true,
      content: finalContent,
      charCount: finalContent.length,
      source: url,
      originalLength: content.length
    });
  } catch (error: any) {
    console.error('Fetch URL error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch URL' },
      { status: 500 }
    );
  }
}