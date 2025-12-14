// app/api/generate-article/route.ts - CORRECT ENDPOINT WITH IMPROVED PROMPT

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { topic, context = '' } = await request.json();

    if (!topic || typeof topic !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Topic is required' },
        { status: 400 }
      );
    }

    // Check for API key
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY not set');
      return NextResponse.json(
        { 
          success: false,
          error: 'API not configured. Set ANTHROPIC_API_KEY in .env.local' 
        },
        { status: 500 }
      );
    }

    console.log('Generating article for:', topic);

    // IMPROVED PROMPT - Simple and direct
    const prompt = `You are an expert technical writer for Solibri, a professional BIM (Building Information Modeling) software platform.

TASK: Write a comprehensive help article about: "${topic}"

IMPORTANT: Write the ARTICLE CONTENT ONLY. No preamble, no explanations, no asking for more information. Just write the article.

ARTICLE STRUCTURE (in markdown):

# ${topic}

## Overview
Write 2-3 sentences explaining what this is and why it matters.

## Key Concepts
Define 2-3 important terms (use subheadings for each).

## How To Use
Step-by-step instructions:
1. First step...
2. Second step...
3. Third step...

Include specific menu paths, buttons, and UI elements.

## Use Cases & Examples
Give 2-3 practical examples of how users would use this:
- Example 1: Describe the scenario, steps, and benefit
- Example 2: Describe the scenario, steps, and benefit

## Best Practices
- Tip 1...
- Tip 2...
- Tip 3...

## Common Issues & Solutions
- Issue 1: Solution
- Issue 2: Solution

## Related Topics
Brief mention of related features.

TONE: Professional, clear, practical. Write for BIM professionals with moderate technical knowledge.

CONTENT: Be specific - include actual feature names, menu paths, and real examples. Make it actionable.

${context ? `\nRELEASE NOTES CONTEXT:\n${context}\n\nIf relevant, reference this context in your article.` : ''}

NOW WRITE THE ARTICLE:`;

    // Call Anthropic API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 2500,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    console.log('Anthropic API status:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Anthropic error:', response.status, errorData);

      if (response.status === 401) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Invalid API key. Check ANTHROPIC_API_KEY in .env.local' 
          },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { 
          success: false,
          error: `Generation failed: ${response.status}` 
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Response received successfully');

    if (!data.content || !data.content[0]) {
      throw new Error('No content in response');
    }

    const content = data.content[0].text;

    return NextResponse.json({
      success: true,
      data: {
        content,
      },
    });

  } catch (error: any) {
    console.error('Error:', error.message);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to generate article'
      },
      { status: 500 }
    );
  }
}