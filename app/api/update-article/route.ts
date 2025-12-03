import { NextRequest, NextResponse } from 'next/server';

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

    const text = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!text || text.length < 50) {
      throw new Error('Could not extract meaningful content from URL');
    }

    return text;
  } catch (error) {
    throw new Error(`Error fetching URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { releaseNotes, existingArticle, articleUrl } = await request.json();

    if (!releaseNotes || !releaseNotes.trim()) {
      return NextResponse.json(
        { error: 'Release notes are required' },
        { status: 400 }
      );
    }

    // Get existing article content
    let articleContent = existingArticle;
    if (articleUrl && articleUrl.trim()) {
      try {
        articleContent = await fetchUrlContent(articleUrl);
      } catch (error) {
        return NextResponse.json(
          { error: error instanceof Error ? error.message : 'Failed to fetch article URL' },
          { status: 400 }
        );
      }
    }

    if (!articleContent || !articleContent.trim()) {
      return NextResponse.json(
        { error: 'Existing article content is required (paste text or provide URL)' },
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

    // Call OpenAI API for comparison and update
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
            content: `You are a technical documentation expert for Solibri, a BIM (Building Information Modeling) software.

Your task is to compare an EXISTING HELP ARTICLE with NEW RELEASE NOTES and provide a comprehensive update analysis.

Analyze the content and provide your response in this exact format:

## 📊 CHANGE SUMMARY
Brief overview of what needs to change (2-3 sentences)

## ✅ SECTIONS TO KEEP
List sections/content that remain accurate and don't need changes.
- [Section name]: [Why it's still valid]

## ⚠️ SECTIONS TO UPDATE
Identify outdated content and provide new text.
- [Section/topic]: 
  - OLD: [Current text summary]
  - NEW: [Suggested replacement text]
  - REASON: [Why this change is needed]

## ✨ NEW SECTIONS TO ADD
Content from release notes not covered in current article.
- [New section title]: [Content to add]

## 📝 FULL UPDATED ARTICLE
Provide the complete revised article incorporating all changes. Use proper markdown formatting with headers, bullet points, and clear structure. Maintain the same tone and style as the original article.`,
          },
          {
            role: 'user',
            content: `EXISTING HELP ARTICLE:
${articleContent}

---

NEW RELEASE NOTES:
${releaseNotes}

---

Please analyze and provide the update recommendations and full updated article.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      return NextResponse.json(
        { error: 'Failed to analyze article' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const analysis = data.choices[0].message.content;

    // Try to extract the full updated article section
    let updatedArticle = '';
    const fullArticleMatch = analysis.match(/## 📝 FULL UPDATED ARTICLE\n([\s\S]*?)(?=##|$)/);
    if (fullArticleMatch) {
      updatedArticle = fullArticleMatch[1].trim();
    }

    return NextResponse.json({ 
      analysis,
      updatedArticle
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
