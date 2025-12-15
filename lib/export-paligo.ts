// lib/export-paligo.ts - Paligo XML Export Generator

import type { ScoredArticle } from '../api/types';

export interface AnalysisResult {
  version: string;
  releaseNotes: string;
  matchedArticles: ScoredArticle[];
  gaps: GapSuggestion[];
  timestamp: string;
}

export interface GapSuggestion {
  topic: string;
  reason: string;
  suggestedTitle: string;
  draftContent?: string;
}

/**
 * Generate Paligo XML from analysis results
 */
export function generatePaligoXML(analysis: AnalysisResult): string {
  const timestamp = new Date(analysis.timestamp).toISOString().split('T')[0];
  const docId = `analysis-${timestamp}-${Math.random().toString(36).substr(2, 9)}`;

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<doc xmlns="http://www.paligo.net/pal/3.0" id="${docId}" status="draft">
  <title>Documentation Gap Analysis Report</title>
  <meta>
    <version>${escapeXml(analysis.version)}</version>
    <analyzeDate>${timestamp}</analyzeDate>
    <status>Draft - Requires Review</status>
  </meta>

  <section id="overview">
    <title>Overview</title>
    <para>This report identifies documentation gaps and articles requiring updates based on release notes analysis.</para>
    
    <section id="summary-stats">
      <title>Summary Statistics</title>
      <itemizedlist>
        <listitem>
          <para><emphasis>Articles Analyzed:</emphasis> ${analysis.matchedArticles.length}</para>
        </listitem>
        <listitem>
          <para><emphasis>Documentation Gaps Found:</emphasis> ${analysis.gaps.length}</para>
        </listitem>
        <listitem>
          <para><emphasis>Analysis Date:</emphasis> ${timestamp}</para>
        </listitem>
      </itemizedlist>
    </section>

    <section id="release-notes-summary">
      <title>Release Notes Summary</title>
      <para>${escapeXml(analysis.releaseNotes.substring(0, 500))}</para>
    </section>
  </section>

  <section id="articles-to-update">
    <title>Articles Requiring Updates</title>
    <para>The following articles should be reviewed and updated to reflect the new release:</para>
    
    ${analysis.matchedArticles.map((article, index) => `
    <section id="article-update-${index + 1}">
      <title>${escapeXml(article.title)}</title>
      <itemizedlist>
        <listitem>
          <para><emphasis>Relevance Score:</emphasis> ${Math.round(article.relevanceScore)}%</para>
        </listitem>
        <listitem>
          <para><emphasis>Current Content:</emphasis> ${escapeXml(article.content.substring(0, 300))}</para>
        </listitem>
        <listitem>
          <para><emphasis>Update Recommendation:</emphasis> Review and update this article to include information about the new features and changes mentioned in the release notes.</para>
        </listitem>
      </itemizedlist>
      <para><ulink url="${article.url || '#'}">View Article in Zendesk</ulink></para>
    </section>
    `).join('')}
  </section>

  <section id="documentation-gaps">
    <title>Documentation Gaps - New Content Needed</title>
    <para>The following topics are mentioned in the release notes but lack dedicated documentation:</para>
    
    ${analysis.gaps.map((gap, index) => `
    <section id="gap-${index + 1}">
      <title>${escapeXml(gap.suggestedTitle)}</title>
      <para><emphasis>Topic:</emphasis> ${escapeXml(gap.topic)}</para>
      <para><emphasis>Why This Gap Exists:</emphasis> ${escapeXml(gap.reason)}</para>
      
      ${gap.draftContent ? `
      <section id="gap-${index + 1}-draft">
        <title>AI-Generated Draft Content</title>
        <para>${escapeXml(gap.draftContent)}</para>
      </section>
      ` : ''}

      <section id="gap-${index + 1}-action">
        <title>Recommended Action</title>
        <para>Create a new article addressing this topic and add it to the appropriate documentation section.</para>
      </section>
    </section>
    `).join('')}
  </section>

  <section id="next-steps">
    <title>Next Steps</title>
    <orderedlist>
      <listitem>
        <para>Review articles marked for update in the "Articles Requiring Updates" section above.</para>
      </listitem>
      <listitem>
        <para>Create new articles for the topics listed in "Documentation Gaps".</para>
      </listitem>
      <listitem>
        <para>Use AI-generated drafts as starting points and refine them to match your documentation standards.</para>
      </listitem>
      <listitem>
        <para>Update the release notes article to reference these new and updated articles.</para>
      </listitem>
      <listitem>
        <para>Re-run analysis after updates to verify coverage completeness.</para>
      </listitem>
    </orderedlist>
  </section>
</doc>`;

  return xml;
}

/**
 * Generate Markdown from analysis results (for quick sharing)
 */
export function generateMarkdown(analysis: AnalysisResult): string {
  const timestamp = new Date(analysis.timestamp).toISOString().split('T')[0];

  return `# Documentation Gap Analysis Report

**Version:** ${analysis.version}  
**Date:** ${timestamp}  
**Status:** Draft - Requires Review

## Overview

${analysis.releaseNotes.substring(0, 500)}

---

## Summary Statistics

- **Articles Analyzed:** ${analysis.matchedArticles.length}
- **Documentation Gaps Found:** ${analysis.gaps.length}
- **Analysis Date:** ${timestamp}

---

## Articles Requiring Updates

The following articles should be reviewed and updated:

${analysis.matchedArticles.map((article, index) => `
### ${index + 1}. ${article.title}

**Relevance Score:** ${Math.round(article.relevanceScore)}%

**Current Content (excerpt):**
> ${article.content.substring(0, 200)}...

**Action:** Review and update to reflect new release features.

---
`).join('')}

## Documentation Gaps - New Content Needed

${analysis.gaps.map((gap, index) => `
### Gap ${index + 1}: ${gap.suggestedTitle}

**Topic:** ${gap.topic}

**Why:** ${gap.reason}

${gap.draftContent ? `
**AI-Generated Draft:**
\`\`\`
${gap.draftContent}
\`\`\`
` : ''}

---
`).join('')}

## Next Steps

1. Review articles marked for update
2. Create new articles for documentation gaps
3. Refine AI-generated drafts to match your standards
4. Update references in release notes article
5. Re-run analysis after updates

---

*Generated by Solibri AI Docs - Phase 3*
`;
}

/**
 * Export as JSON for automation/integration
 */
export function generateJSON(analysis: AnalysisResult): string {
  return JSON.stringify(
    {
      metadata: {
        version: analysis.version,
        timestamp: analysis.timestamp,
        type: 'documentation-gap-analysis',
        format: 'json-1.0',
      },
      releaseNotes: analysis.releaseNotes,
      articlesToUpdate: analysis.matchedArticles.map(article => ({
        id: article.id,
        title: article.title,
        relevanceScore: Math.round(article.relevanceScore),
        url: article.url,
        currentContent: article.content.substring(0, 500),
      })),
      documentationGaps: analysis.gaps.map(gap => ({
        topic: gap.topic,
        suggestedTitle: gap.suggestedTitle,
        reason: gap.reason,
        draftContent: gap.draftContent,
      })),
    },
    null,
    2
  );
}

/**
 * Escape XML special characters
 */
function escapeXml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}