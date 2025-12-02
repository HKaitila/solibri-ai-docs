import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { releaseNotes } = await request.json();

    if (!releaseNotes || !releaseNotes.trim()) {
      return NextResponse.json(
        { error: 'Release notes are required' },
        { status: 400 }
      );
    }

    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    // Call OpenAI API with improved prompt
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
                messages: [
          {
            role: 'system',
            content: `You are a professional technical writer for Solibri, a BIM (Building Information Modeling) software. 
Your task is to convert release notes into clear, well-structured help center articles.

Format your response as follows:
1. Start with a CLEAR TITLE that describes the feature/improvement
2. Brief overview (1-2 sentences)
3. Key Features or Changes (bullet points with descriptions)
4. Step-by-Step Instructions (if applicable - number them)
5. Tips or Best Practices (bullet points)
6. Prerequisites (if applicable - bullet points)

Write for both beginners and advanced users. Use clear, concise language. Include technical details where relevant.
Keep paragraphs short and scannable.
Use bullet points liberally for readability.`,
          },
          {
            role: 'user',
            content: `Please convert these Solibri release notes into a professional help center article. Format it clearly with sections and bullet points:\n\n${releaseNotes}`,
          },
        ],

        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      return NextResponse.json(
        { error: 'Failed to generate article' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const article = data.choices[0].message.content;

    // Extract title from article (first line)
    const lines = article.split('\n');
    let title = 'Help Article';
    let content = article;

    // Try to extract title
    if (lines[0].startsWith('#')) {
      title = lines[0].replace(/^#+\s*/, '').trim();
      content = lines.slice(1).join('\n').trim();
    }

    return NextResponse.json({ 
      article: content,
      title: title
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
