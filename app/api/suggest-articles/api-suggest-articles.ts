// app/api/suggest-articles/route.ts (UPDATED WITH EMBEDDINGS)
import { NextRequest, NextResponse } from 'next/server';
import { findSimilarArticles } from '@/lib/embeddings';

interface Article {
  id: string;
  title: string;
  content: string;
  category: string;
  updatedAt: string;
  relevanceScore: number;
}

// Mock Zendesk article fetching - replace with actual Zendesk API call
async function getArticlesFromZendesk(): Promise<Article[]> {
  try {
    // Option 1: Call your actual Zendesk API
    // const response = await fetch(`https://${ZENDESK_DOMAIN}.zendesk.com/api/v2/articles`, {
    //   headers: {
    //     'Authorization': `Bearer ${process.env.ZENDESK_API_KEY}`,
    //   }
    // });
    // return await response.json();

    // Option 2: Mock data for testing (replace with real data)
    return [
      {
        id: '1',
        title: 'Getting Started with Solibri',
        content: 'Learn the basics of Solibri BIM software. This guide covers installation, project setup, and basic model navigation.',
        category: 'Getting Started',
        updatedAt: '2025-12-01',
        relevanceScore: 0,
      },
      {
        id: '2',
        title: 'Importing IFC Files',
        content: 'How to import IFC files into Solibri. Covers IFC 2x3, IFC 4.0, IFC 4.1, and IFC 4.4 formats. Troubleshooting import issues.',
        category: 'Importing',
        updatedAt: '2025-11-15',
        relevanceScore: 0,
      },
      {
        id: '3',
        title: 'Model Checking and Validation',
        content: 'Use Solibri Model Checker to validate BIM models. Check for clashes, collisions, and quality issues.',
        category: 'Quality Assurance',
        updatedAt: '2025-10-30',
        relevanceScore: 0,
      },
      {
        id: '4',
        title: 'Clash Detection Guide',
        content: 'Detect and resolve clashes between building systems. Configure clash detection rules and review results.',
        category: 'Quality Assurance',
        updatedAt: '2025-11-01',
        relevanceScore: 0,
      },
      {
        id: '5',
        title: 'Exporting and Reporting',
        content: 'Export your analysis results in various formats. Generate professional reports for stakeholders.',
        category: 'Exporting',
        updatedAt: '2025-09-20',
        relevanceScore: 0,
      },
    ];
  } catch (error) {
    console.error('Error fetching articles from Zendesk:', error);
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    const { releaseNotes } = await request.json();

    if (!releaseNotes || typeof releaseNotes !== 'string') {
      return NextResponse.json(
        { error: 'Release notes required' },
        { status: 400 }
      );
    }

    console.log('Fetching articles...');
    const articles = await getArticlesFromZendesk();

    if (articles.length === 0) {
      return NextResponse.json(
        {
          data: {
            articles: [],
            message: 'No articles found',
          },
        },
        { status: 200 }
      );
    }

    console.log(`Found ${articles.length} articles`);

    // IMPROVED: Use embeddings to find similar articles
    console.log('Finding similar articles using embeddings...');
    let similarArticles: Article[] = [];

    try {
      similarArticles = await findSimilarArticles(
        releaseNotes,
        articles,
        0.4 // Threshold: 0.4+ (40% similarity) to catch related articles
      );
      console.log(`Embeddings found ${similarArticles.length} similar articles`);
    } catch (embedError) {
      console.warn('Embeddings search failed, falling back to basic matching:', embedError);

      // Fallback: Simple keyword matching if embeddings fail
      const releaseNotesLower = releaseNotes.toLowerCase();
      const words = releaseNotesLower.split(/\W+/).filter(w => w.length > 3);
      const wordSet = new Set(words);

      similarArticles = articles
        .map(article => {
          const titleWords = article.title.toLowerCase().split(/\W+/);
          const contentWords = article.content.toLowerCase().split(/\W+/);
          const allWords = [...titleWords, ...contentWords];

          // Count matching words
          const matches = allWords.filter(w => wordSet.has(w)).length;
          const relevanceScore = Math.min(10, Math.round((matches / words.length) * 10));

          return {
            ...article,
            relevanceScore: Math.max(1, relevanceScore),
          };
        })
        .filter(a => a.relevanceScore > 2)
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 10);
    }

    // Return results
    return NextResponse.json({
      data: {
        articles: similarArticles.slice(0, 10),
        method: similarArticles.length > 0 ? 'embeddings' : 'fallback',
        count: similarArticles.length,
      },
    });
  } catch (error) {
    console.error('Suggest articles error:', error);
    return NextResponse.json(
      {
        error: 'Failed to suggest articles',
        debug: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}