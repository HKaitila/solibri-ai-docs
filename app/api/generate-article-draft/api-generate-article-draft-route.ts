// app/api/generate-article-draft/route.ts (IMPROVED PROMPT VERSION)
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { topic, releaseNotes = '', keywords = [] } = await request.json();

    if (!topic || typeof topic !== 'string') {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }

    // Check for API key
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY not set in environment');
      return NextResponse.json(
        { 
          error: 'LLM not configured. ANTHROPIC_API_KEY is missing from environment variables.',
          debug: 'Set ANTHROPIC_API_KEY in .env.local'
        },
        { status: 500 }
      );
    }

    console.log('Generating article for topic:', topic);

    // IMPROVED PROMPT with Solibri context and better structure
    const prompt = `You are an expert technical writer for Solibri, a professional BIM (Building Information Modeling) software platform.

## Task
Write a comprehensive help article about: "${topic}"

## Solibri Context
Solibri is enterprise BIM software used by architects, engineers, and construction professionals. Articles should be technical yet accessible, with practical examples and clear instructions.

## Article Structure

Create a markdown article with these sections:

### 1. Title
Use the topic directly as the title (e.g., # Advanced Filtering in BIM Models)

### 2. Overview (2-3 sentences)
What is this feature/concept? Why is it important?

### 3. Key Concepts (if applicable)
Define 2-3 important terms related to this topic

### 4. Step-by-Step Guide or Explanation
Include:
- How to access/use this feature
- Key steps with clear numbering
- UI elements users will interact with
- Important parameters or settings

### 5. Use Cases & Examples
2-3 real-world examples of how to use this feature:
- Describe the scenario
- Show the steps
- Explain the benefit

### 6. Best Practices
3-5 practical tips for getting the best results

### 7. Common Issues & Solutions (if applicable)
2-3 common problems and how to solve them

### 8. Related Topics (optional)
Brief mention of related features users might find helpful

## Writing Guidelines
- Use clear, professional language
- Write for users with moderate BIM knowledge
- Include specific menu paths and buttons (e.g., "Go to Tools → Analysis → Model Checking")
- Use numbered lists for steps, bullets for lists
- Be concise but thorough
- Use "you" to address the reader directly

## Example Reference
Good Solibri articles:
- Start with "What is..." or "How to..." 
- Include actual feature names and menu paths
- Provide practical, actionable steps
- Explain the "why" not just the "how"
- Include tips based on real user experience

${releaseNotes ? `\n## Release Context\nThis feature was mentioned in recent release notes:\n${releaseNotes.substring(0, 500)}\n\nRelate this article to the release information.` : ''}

${keywords.length > 0 ? `\n## Key Concepts to Cover\n${keywords.join(', ')}` : ''}

## Output Format
Write ONLY the markdown article content. Start with the title. No introduction, no metadata.`;

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

    console.log('Anthropic API response status:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Anthropic API error:', response.status, errorData);
      
      if (response.status === 401) {
        return NextResponse.json(
          { 
            error: 'Invalid API key. Check ANTHROPIC_API_KEY in .env.local',
            debug: `Status: ${response.status}` 
          },
          { status: 401 }
        );
      }

      if (response.status === 404) {
        return NextResponse.json(
          { 
            error: 'Model not found. Make sure you have access to claude-3-5-haiku-20241022',
            debug: `Status: ${response.status}` 
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { 
          error: `Anthropic API error: ${response.status}`,
          debug: errorData.substring(0, 500)
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Anthropic response received');

    if (!data.content || !data.content[0]) {
      throw new Error('No content in API response');
    }

    const content = data.content[0].text;

    // Format response
    return NextResponse.json({
      success: true,
      data: {
        topic,
        content,
        charCount: content.length,
        tokensUsed: data.usage?.output_tokens || 0,
      },
    });
  } catch (error: any) {
    console.error('Generate draft error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to generate article draft',
        debug: error.stack?.substring(0, 300)
      },
      { status: 500 }
    );
  }
}