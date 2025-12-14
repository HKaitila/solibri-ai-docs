// app/api/detect-gaps/route.ts (UPDATED WITH EMBEDDINGS VALIDATION)
import { NextRequest, NextResponse } from 'next/server';
import { hasSimilarArticle } from '@/lib/embeddings';

interface Article {
  id: string;
  title: string;
  content: string;
  category: string;
  updatedAt: string;
  relevanceScore: number;
}

// Mock article fetching - replace with actual API
async function getArticlesFromZendesk(): Promise<Article[]> {
  return [
    {
      id: '1',
      title: 'Getting Started with Solibri',
      content: 'Learn the basics of Solibri BIM software.',
      category: 'Getting Started',
      updatedAt: '2025-12-01',
      relevanceScore: 0,
    },
    {
      id: '2',
      title: 'Importing IFC Files',
      content: 'How to import IFC files including IFC 4.4 formats.',
      category: 'Importing',
      updatedAt: '2025-11-15',
      relevanceScore: 0,
    },
    {
      id: '3',
      title: 'Clash Detection Guide',
      content: 'Detect and resolve clashes between building systems.',
      category: 'Quality Assurance',
      updatedAt: '2025-11-01',
      relevanceScore: 0,
    },
  ];
}

export async function POST(request: NextRequest) {
  try {
    const { releaseNotes, existingKeywords = [] } = await request.json();

    if (!releaseNotes || typeof releaseNotes !== 'string') {
      return NextResponse.json(
        { error: 'Release notes required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    console.log('Detecting documentation gaps...');

    // Step 1: Use Claude to identify potential gaps
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: `You are analyzing BIM software release notes to identify documentation gaps.

Given these release notes:
"""
${releaseNotes}
"""

And these are existing help article keywords:
${existingKeywords.length > 0 ? existingKeywords.join(', ') : 'None yet'}

Identify the key FEATURES, IMPROVEMENTS, and NEW CAPABILITIES mentioned that should have dedicated help documentation.

Return ONLY a JSON array with 3-6 items (no markdown, no explanation):
[
  "Feature Name 1",
  "Feature Name 2",
  "Feature Name 3"
]

Requirements:
- Each item should be a specific feature or improvement (not generic words)
- Format: "Feature Name" or "Feature Type: Feature Name"
- Examples: "IFC 4.4 Support", "Clash Detection Improvements", "Advanced Filtering"
- Avoid: generic words like "content", "notes", "solution", "improvement"
- Focus on actual BIM/Solibri capabilities
- Only include items that DON'T already have keyword coverage`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Claude API error:', response.status, errorData);
      return NextResponse.json(
        { error: 'Failed to detect gaps', debug: errorData.substring(0, 200) },
        { status: response.status }
      );
    }

    const data = await response.json();
    const content = data.content[0].text;

    // Parse the JSON response
    let suggestedGaps: string[] = [];
    try {
      suggestedGaps = JSON.parse(content);
    } catch (e) {
      console.warn('Failed to parse gaps as JSON');
      suggestedGaps = content
        .split('\n')
        .filter(line => line.trim().length > 0)
        .map(line => line.replace(/^[-*•]\s+/, '').trim())
        .filter(line => line.length > 0 && line.length < 100);
    }

    console.log(`Claude identified ${suggestedGaps.length} potential gaps`);

    // Step 2: IMPROVED - Validate gaps using embeddings
    // Filter out gaps that have similar articles already
    let validatedGaps: string[] = [];

    if (suggestedGaps.length > 0) {
      try {
        const articles = await getArticlesFromZendesk();
        console.log(`Validating ${suggestedGaps.length} gaps against ${articles.length} articles...`);

        // Check each gap for similar articles
        const gapValidations = await Promise.all(
          suggestedGaps.map(async gap => {
            try {
              const hasSimilar = await hasSimilarArticle(gap, articles, 0.6);
              return {
                gap,
                hasSimilar,
              };
            } catch (error) {
              console.warn(`Error validating gap "${gap}":`, error);
              return {
                gap,
                hasSimilar: false, // Assume it's a gap if validation fails
              };
            }
          })
        );

        // Keep only gaps without similar articles
        validatedGaps = gapValidations
          .filter(v => !v.hasSimilar)
          .map(v => v.gap);

        console.log(
          `Embeddings validation: ${suggestedGaps.length} gaps → ${validatedGaps.length} valid gaps`
        );
      } catch (embedError) {
        console.warn('Embeddings validation failed, using all gaps:', embedError);
        validatedGaps = suggestedGaps; // Fallback to all gaps
      }
    }

    return NextResponse.json({
      success: true,
      gaps: validatedGaps.slice(0, 8), // Limit to 8 gaps
      count: validatedGaps.length,
      validationMethod: 'embeddings',
    });
  } catch (error: any) {
    console.error('Gap detection error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Gap detection failed',
        gaps: [], // Return empty gaps on error
      },
      { status: 500 }
    );
  }
}