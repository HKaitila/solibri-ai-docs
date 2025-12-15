// app/api/suggest/route.ts - Generate Claude Suggestions

import { NextRequest, NextResponse } from 'next/server';

interface Article {
  id: string;
  title: string;
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const { action, releaseNotes, article } = await request.json();

    if (action === 'update-suggestion') {
      const result = await generateUpdateSuggestion(releaseNotes, article);
      return NextResponse.json({ result });
    }

    throw new Error('Unknown action');
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Request failed' },
      { status: 400 }
    );
  }
}

async function generateUpdateSuggestion(releaseNotes: string, article: Article): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not set');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'content-type': 'application/json',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Based on these release notes, how should this help article be updated?

RELEASE NOTES:
${releaseNotes}

CURRENT ARTICLE:
Title: ${article.title}
Content: ${article.content.substring(0, 500)}...

Provide a concise, actionable suggestion (2-3 sentences) on what to update or add to this article.`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error: ${response.statusText} - ${error}`);
  }

  const data = await response.json() as any;
  return data.content.text;
}
