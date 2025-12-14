// EXPORT UTILITIES - Supporting Multiple Formats

// Type definitions for exports
export type ExportFormat = 'markdown' | 'html' | 'paligo-xml' | 'json' | 'plaintext';

interface ImprovementSuggestion {
  type: 'add' | 'update' | 'enhance' | 'remove' | 'replace';
  title: string;
  suggestion: string;
  reason: string;
  currentContent?: string;
  proposedContent?: string;
  priority: 'high' | 'medium' | 'low';
}

// ============================================================================
// MARKDOWN EXPORT
// ============================================================================
export function exportToMarkdown(
  articleTitle: string,
  improvements: ImprovementSuggestion[],
  summary: string
): string {
  const lines: string[] = [];

  lines.push(`# Documentation Update: ${articleTitle}`);
  lines.push('');
  lines.push('## Summary');
  lines.push(summary);
  lines.push('');
  lines.push('---');
  lines.push('');

  // Group by type
  const byType = {
    add: improvements.filter(i => i.type === 'add'),
    update: improvements.filter(i => i.type === 'update'),
    enhance: improvements.filter(i => i.type === 'enhance'),
    remove: improvements.filter(i => i.type === 'remove'),
    replace: improvements.filter(i => i.type === 'replace'),
  };

  if (byType.add.length > 0) {
    lines.push('## ➕ Additions');
    lines.push('');
    byType.add.forEach(imp => {
      lines.push(`### ${imp.title}`);
      lines.push(`**Priority:** ${imp.priority.toUpperCase()}`);
      lines.push(`**Reason:** ${imp.reason}`);
      lines.push(`**Action:** ${imp.suggestion}`);
      lines.push('');
    });
  }

  if (byType.update.length > 0) {
    lines.push('## ✏️ Updates');
    lines.push('');
    byType.update.forEach(imp => {
      lines.push(`### ${imp.title}`);
      lines.push(`**Priority:** ${imp.priority.toUpperCase()}`);
      lines.push(`**Reason:** ${imp.reason}`);
      if (imp.currentContent) {
        lines.push(`**Current:** \`${imp.currentContent}\``);
      }
      if (imp.proposedContent) {
        lines.push(`**Updated:** \`${imp.proposedContent}\``);
      }
      lines.push(`**Action:** ${imp.suggestion}`);
      lines.push('');
    });
  }

  if (byType.enhance.length > 0) {
    lines.push('## ⭐ Enhancements');
    lines.push('');
    byType.enhance.forEach(imp => {
      lines.push(`### ${imp.title}`);
      lines.push(`**Priority:** ${imp.priority.toUpperCase()}`);
      lines.push(`**Suggestion:** ${imp.suggestion}`);
      lines.push('');
    });
  }

  if (byType.remove.length > 0) {
    lines.push('## 🗑️ Removals');
    lines.push('');
    byType.remove.forEach(imp => {
      lines.push(`### ${imp.title}`);
      lines.push(`${imp.suggestion}`);
      lines.push('');
    });
  }

  return lines.join('\n');
}

// ============================================================================
// PALIGO-COMPATIBLE XML EXPORT
// ============================================================================
export function exportToPaligoXML(
  articleTitle: string,
  improvements: ImprovementSuggestion[],
  summary: string
): string {
  const lines: string[] = [];

  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push('<section>');
  lines.push(`  <title>Documentation Update: ${escapeXml(articleTitle)}</title>`);
  lines.push('');
  lines.push('  <section>');
  lines.push('    <title>Summary</title>');
  lines.push(`    <para>${escapeXml(summary)}</para>`);
  lines.push('  </section>');
  lines.push('');

  improvements.forEach(imp => {
    const icon = getIcon(imp.type);
    lines.push('  <section>');
    lines.push(`    <title>${icon} ${escapeXml(imp.title)}</title>`);
    lines.push('    <para>');
    lines.push(`      <emphasis role="bold">Type:</emphasis> ${imp.type}`);
    lines.push(`      <emphasis role="bold">Priority:</emphasis> ${imp.priority}`);
    lines.push('    </para>');
    lines.push('    <para>');
    lines.push(`      <emphasis role="bold">Reason:</emphasis> ${escapeXml(imp.reason)}`);
    lines.push('    </para>');
    if (imp.currentContent || imp.proposedContent) {
      lines.push('    <para>');
      if (imp.currentContent) {
        lines.push(
          `      <emphasis role="bold">Current:</emphasis> ${escapeXml(imp.currentContent)}`
        );
      }
      if (imp.proposedContent) {
        lines.push(
          `      <emphasis role="bold">Proposed:</emphasis> ${escapeXml(imp.proposedContent)}`
        );
      }
      lines.push('    </para>');
    }
    lines.push('    <para>');
    lines.push(`      <emphasis role="bold">Action:</emphasis> ${escapeXml(imp.suggestion)}`);
    lines.push('    </para>');
    lines.push('  </section>');
    lines.push('');
  });

  lines.push('</section>');
  return lines.join('\n');
}

// ============================================================================
// HTML EXPORT
// ============================================================================
export function exportToHTML(
  articleTitle: string,
  improvements: ImprovementSuggestion[],
  summary: string
): string {
  const lines: string[] = [];

  lines.push('<!DOCTYPE html>');
  lines.push('<html lang="en">');
  lines.push('<head>');
  lines.push('  <meta charset="UTF-8">');
  lines.push('  <meta name="viewport" content="width=device-width, initial-scale=1.0">');
  lines.push(`  <title>Documentation Update: ${articleTitle}</title>`);
  lines.push('  <style>');
  lines.push('    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }');
  lines.push('    .container { max-width: 900px; margin: 0 auto; padding: 20px; }');
  lines.push('    h1 { color: #1f2937; }');
  lines.push('    h2 { color: #374151; margin-top: 30px; }');
  lines.push('    .improvement { border-left: 4px solid #3b82f6; padding-left: 16px; margin: 20px 0; }');
  lines.push('    .type { display: inline-block; padding: 4px 8px; border-radius: 4px; font-weight: 600; }');
  lines.push('    .type-add { background: #d1fae5; color: #065f46; }');
  lines.push('    .type-update { background: #fef3c7; color: #92400e; }');
  lines.push('    .type-enhance { background: #dbeafe; color: #0c2d6b; }');
  lines.push('    .priority { font-weight: 600; }');
  lines.push('    .priority-high { color: #dc2626; }');
  lines.push('    .priority-medium { color: #f59e0b; }');
  lines.push('    .priority-low { color: #10b981; }');
  lines.push('  </style>');
  lines.push('</head>');
  lines.push('<body>');
  lines.push('  <div class="container">');
  lines.push(`    <h1>Documentation Update: ${articleTitle}</h1>`);
  lines.push('    <h2>Summary</h2>');
  lines.push(`    <p>${summary}</p>`);
  lines.push('');

  improvements.forEach(imp => {
    const icon = getIcon(imp.type);
    lines.push('    <div class="improvement">');
    lines.push(`      <h3>${icon} ${imp.title}</h3>`);
    lines.push(`      <p><span class="type type-${imp.type}">${imp.type.toUpperCase()}</span></p>`);
    lines.push(
      `      <p><strong>Priority:</strong> <span class="priority priority-${imp.priority}">${imp.priority.toUpperCase()}</span></p>`
    );
    lines.push(`      <p><strong>Reason:</strong> ${imp.reason}</p>`);
    if (imp.currentContent || imp.proposedContent) {
      lines.push('      <p>');
      if (imp.currentContent) {
        lines.push(`        <strong>Current:</strong> <code>${imp.currentContent}</code><br>`);
      }
      if (imp.proposedContent) {
        lines.push(`        <strong>Proposed:</strong> <code>${imp.proposedContent}</code>`);
      }
      lines.push('      </p>');
    }
    lines.push(`      <p><strong>Action:</strong> ${imp.suggestion}</p>`);
    lines.push('    </div>');
  });

  lines.push('  </div>');
  lines.push('</body>');
  lines.push('</html>');
  return lines.join('\n');
}

// ============================================================================
// JSON EXPORT (for importing to other systems)
// ============================================================================
export function exportToJSON(
  articleTitle: string,
  improvements: ImprovementSuggestion[],
  summary: string
): string {
  return JSON.stringify(
    {
      articleTitle,
      summary,
      exportDate: new Date().toISOString(),
      improvements: improvements.map(imp => ({
        type: imp.type,
        title: imp.title,
        suggestion: imp.suggestion,
        reason: imp.reason,
        currentContent: imp.currentContent || null,
        proposedContent: imp.proposedContent || null,
        priority: imp.priority,
      })),
    },
    null,
    2
  );
}

// ============================================================================
// PLAINTEXT EXPORT (for quick copy-paste)
// ============================================================================
export function exportToPlaintext(
  articleTitle: string,
  improvements: ImprovementSuggestion[],
  summary: string
): string {
  const lines: string[] = [];

  lines.push(`DOCUMENTATION UPDATE: ${articleTitle}`);
  lines.push('='.repeat(80));
  lines.push('');
  lines.push('SUMMARY');
  lines.push('-'.repeat(80));
  lines.push(summary);
  lines.push('');
  lines.push('');

  improvements.forEach((imp, idx) => {
    const icon = getIcon(imp.type);
    lines.push(`${idx + 1}. ${icon} ${imp.title}`);
    lines.push(`   Type: ${imp.type}`);
    lines.push(`   Priority: ${imp.priority}`);
    lines.push(`   Reason: ${imp.reason}`);
    if (imp.currentContent) {
      lines.push(`   Current: ${imp.currentContent}`);
    }
    if (imp.proposedContent) {
      lines.push(`   Proposed: ${imp.proposedContent}`);
    }
    lines.push(`   Action: ${imp.suggestion}`);
    lines.push('');
  });

  return lines.join('\n');
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function getIcon(type: string): string {
  switch (type) {
    case 'add':
      return '➕';
    case 'update':
      return '✏️';
    case 'enhance':
      return '⭐';
    case 'remove':
      return '🗑️';
    case 'replace':
      return '🔄';
    default:
      return '•';
  }
}

// ============================================================================
// DOWNLOAD HELPER
// ============================================================================

export function downloadFile(content: string, filename: string, mimeType: string = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================================================
// COPY TO CLIPBOARD HELPER
// ============================================================================

export async function copyToClipboard(content: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(content);
    return true;
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
}
