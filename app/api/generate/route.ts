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

    // Call OpenAI API
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

Format your response as a help article with:
1. A clear title
2. A brief overview (1-2 sentences)
3. Key features or changes (bullet points)
4. Step-by-step instructions (if applicable)
5. Tips or best practices
6. Prerequisites (if applicable)

Write for both beginners and advanced users. Use clear, concise language. Include technical details where relevant but keep explanations accessible.`,
            role: 'user',
            content: `Please convert these Solibri release notes into a professional help center article:\n\n${releaseNotes}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 1500,
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

    return NextResponse.json({ article });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
