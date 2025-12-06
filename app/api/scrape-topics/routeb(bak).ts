import { NextRequest, NextResponse } from 'next/server';

interface ScrapedTopic {
  id: string;
  title: string;
  category: string;
  subcategory: string;
  zendesk_url: string;
  keywords: string[];
  versions: string[];
  roles: string[];
}

async function scrapeHelpCenter(): Promise<ScrapedTopic[]> {
  const topics: ScrapedTopic[] = [];
  
  // Main categories
  const categories = [
    {
      name: 'Getting Started',
      categoryId: '1500000260282',
      subcats: [
        { name: 'Welcome to Solibri', id: '1500000260272' },
        { name: 'Product Help & Advice', id: '1500000260292' },
        { name: 'Licensing Troubleshooting', id: '1500000260312' },
      ]
    },
    {
      name: 'Using Solibri',
      categoryId: '1500000260302',
      subcats: [
        { name: 'Managing Models', id: '1500000260322' },
        { name: 'Checking', id: '1500000260332' },
        { name: 'Visualisation', id: '1500000260342' },
        { name: 'Communication and Presentations', id: '1500000260352' },
        { name: 'Collaboration with BCF', id: '1500000260362' },
        { name: 'Settings', id: '1500000260372' },
      ]
    },
    {
      name: 'Solibri Rules',
      categoryId: '1500000260142',
      subcats: [
        { name: 'Rules Basics', id: '1500000260152' },
        { name: 'Working with Rulesets', id: '1500000260162' },
        { name: 'Pre-defined Rules', id: '1500000260172' },
      ]
    },
    {
      name: 'Administration',
      categoryId: '1500000260002',
      subcats: [
        { name: 'Getting Started', id: '1500000260012' },
        { name: 'Users & Permissions', id: '1500000260022' },
        { name: 'Licensing', id: '1500000260032' },
        { name: 'System Setup', id: '1500000260042' },
      ]
    },
    {
      name: 'Subscription & Billing',
      categoryId: '1500000260052',
      subcats: [
        { name: 'Getting Started', id: '1500000260062' },
        { name: 'Subscription Management', id: '1500000260072' },
        { name: 'Billing', id: '1500000260082' },
      ]
    },
    {
      name: 'Tutorials',
      categoryId: '1500000260092',
      subcats: [
        { name: 'Beginner Tutorials', id: '1500000260102' },
        { name: 'Intermediate Tutorials', id: '1500000260112' },
      ]
    }
  ];

  // For each category, fetch articles
  for (const category of categories) {
    try {
      const categoryUrl = `https://help.solibri.com/hc/en-us/categories/${category.categoryId}`;
      const response = await fetch(categoryUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (!response.ok) continue;

      const html = await response.text();
      
      // Extract article links using regex
      // Pattern: href="/hc/en-us/articles/XXXXX-article-slug"
      const articleRegex = /href="\/hc\/en-us\/articles\/(\d+)-([^"]+)"/g;
      const matches = [...html.matchAll(articleRegex)];

      // For basic demo, create topics from what we find
      // In real scenario, you'd parse more detailed info
      const foundArticles = new Set<string>();
      
      for (const match of matches) {
        const articleId = match[1];
        const slug = match[2];
        
        if (!foundArticles.has(articleId)) {
          foundArticles.add(articleId);
          
          // Create topic entry
          const topic: ScrapedTopic = {
            id: slug,
            title: slug.replace(/-/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
            category: category.name,
            subcategory: category.subcats[0]?.name || 'General',
            zendesk_url: `https://help.solibri.com/hc/en-us/articles/${articleId}-${slug}`,
            keywords: slug.split('-').filter(w => w.length > 2),
            versions: ['2024.3', '2024.4'],
            roles: ['all'],
          };
          
          topics.push(topic);
        }
      }
    } catch (err) {
      console.error(`Error scraping category ${category.name}:`, err);
      continue;
    }
  }

  return topics;
}

export async function GET(request: NextRequest) {
  try {
    // Check for force refresh parameter
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('force') === 'true';

    // For production, you'd cache this with Redis/database
    // For now, we'll just scrape on each request (cached at edge)
    const topics = await scrapeHelpCenter();

    if (topics.length === 0) {
      return NextResponse.json({
        error: 'Could not scrape Help Center',
        fallback: true,
        topics: []
      }, { status: 200 });
    }

    return NextResponse.json(
      {
        topics,
        metadata: {
          version: '1.0',
          last_updated: new Date().toISOString(),
          total_articles: topics.length,
          categories: [...new Set(topics.map(t => t.category))].length,
          data_source: 'Solibri Help Center (Dynamic Scrape)',
        }
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        }
      }
    );
  } catch (error) {
    console.error('Error in scrape-topics:', error);
    return NextResponse.json(
      { error: 'Failed to scrape Help Center' },
      { status: 500 }
    );
  }
}
