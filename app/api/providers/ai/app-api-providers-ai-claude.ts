// app/api/providers/ai/claude.ts - Claude AI for Suggestions

import Anthropic from '@anthropic-ai/sdk';
import type { ScoredArticle } from '../../types';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Generate update suggestions for articles
 */
export async function generateUpdateSuggestion(
  releaseNotes: string,
  article: ScoredArticle
): Promise<string> {
  try {
    console.log(`[Claude] Generating suggestion for: ${article.title}`);

    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: `You are a technical documentation expert. 

Given these release notes:
---
${releaseNotes}
---

And this existing article:
Title: ${article.title}
Content: ${article.content.substring(0, 1000)}

Generate a concise suggestion (2-3 sentences) for how to update this article to cover the new release information. Focus on what new content or sections should be added.`,
        },
      ],
    });

    const suggestion = message.content[0].type === 'text' ? message.content[0].text : '';
    return suggestion;
  } catch (error) {
    console.error('[Claude] Error generating suggestion:', error);
    throw error;
  }
}

/**
 * Generate a draft article for a documentation gap
 */
export async function generateArticleDraft(
  releaseNotes: string,
  gapTopic: string,
  context: string
): Promise<string> {
  try {
    console.log(`[Claude] Generating draft for gap: ${gapTopic}`);

    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 800,
      messages: [
        {
          role: 'user',
          content: `You are a technical documentation writer. 

Based on these release notes:
---
${releaseNotes}
---

Create a concise draft article (300-400 words) about: "${gapTopic}"

Context: ${context}

Format the draft with:
1. Brief introduction (2-3 sentences)
2. Key features or points (bullet list, 4-5 items)
3. How to use or get started (2-3 steps)
4. When to use this feature

Keep it technical but accessible. Use clear, active language.`,
        },
      ],
    });

    const draft = message.content[0].type === 'text' ? message.content[0].text : '';
    return draft;
  } catch (error) {
    console.error('[Claude] Error generating draft:', error);
    throw error;
  }
}

/**
 * Identify documentation gaps from release notes
 */
export async function identifyGaps(
  releaseNotes: string,
  existingArticles: ScoredArticle[]
): Promise<Array<{ topic: string; reason: string }>> {
  try {
    console.log('[Claude] Identifying documentation gaps');

    const articleTitles = existingArticles.map(a => a.title).join(', ');

    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 600,
      messages: [
        {
          role: 'user',
          content: `You are a documentation analyst. 

Release notes:
---
${releaseNotes}
---

Existing documentation articles:
${articleTitles}

Identify 2-4 topics from the release notes that are NOT adequately covered by existing articles. For each gap, provide:
1. The specific topic/feature name
2. A brief reason why it's not covered

Format as JSON:
[
  { "topic": "Feature Name", "reason": "Why it's not covered" },
  ...
]

Only return valid JSON, no other text.`,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '[]';

    try {
      const gaps = JSON.parse(responseText);
      return gaps;
    } catch {
      console.error('[Claude] Failed to parse gaps:', responseText);
      return [];
    }
  } catch (error) {
    console.error('[Claude] Error identifying gaps:', error);
    throw error;
  }
}

/**
 * Explain why an article is relevant to release notes
 */
export async function explainRelevance(
  releaseNotes: string,
  article: ScoredArticle
): Promise<string> {
  try {
    console.log(`[Claude] Explaining relevance for: ${article.title}`);

    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: `Explain briefly (1-2 sentences) why this article is relevant to the release notes:

Article: ${article.title}
Article content: ${article.content.substring(0, 500)}

Release notes: ${releaseNotes.substring(0, 500)}

Be specific about the connection.`,
        },
      ],
    });

    const explanation = message.content[0].type === 'text' ? message.content[0].text : '';
    return explanation;
  } catch (error) {
    console.error('[Claude] Error explaining relevance:', error);
    throw error;
  }
}