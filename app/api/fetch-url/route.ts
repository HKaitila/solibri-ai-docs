import { NextRequest, NextResponse } from 'next/server';

function decodeHtmlEntities(text: string): string {
  const entities: { [key: string]: string } = {
    '&nbsp;': ' ',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&apos;': "'",
    '&amp;': '&',
    '&ndash;': '–',
    '&mdash;': '—',
    '&ldquo;': '"',
    '&rdquo;': '"',
    '&lsquo;': "'",
    '&rsquo;': "'",
    '&bull;': '•',
    '&hellip;': '…',
  };

  let decoded = text;
  Object.entries(entities).forEach(([entity, char]) => {
    decoded = decoded.replace(new RegExp(entity.replace('&', '\\&'), 'g'), char);
  });

  // Also handle numeric entities like &#123;
  decoded = decoded.replace(/&#(\d+);/g, (_, code) => {
    return String.fromCharCode(parseInt(code, 10));
  });

  // Handle hex entities like &#x1F;
  decoded = decoded.replace(/&#x([0-9A-Fa-f]+);/g, (_, code) => {
    return String.fromCharCode(parseInt(code, 16));
  });

  return decoded;
}

async function fetchUrlContent(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`);
    }

    const html = await response.text();
    
    // Extract text content
    let text = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Decode HTML entities
    text = decodeHtmlEntities(text);

    return text;
  } catch (error) {
    throw new Error(
      error instanceof Error 
        ? error.message 
        : 'Failed to fetch URL'
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    const content = await fetchUrlContent(url);
    
    return NextResponse.json({ content });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: `Error fetching URL: ${errorMessage}` },
      { status: 500 }
    );
  }
}
