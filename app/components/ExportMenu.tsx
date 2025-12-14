'use client';

// ============================================================================
// EXPORT MENU COMPONENT - STUB (Phase 2)
// ============================================================================
// This is a placeholder for Phase 2 (Exports)
// Currently just renders a disabled export button
// Will be fully implemented in Phase 2 with 5 export formats:
// - Markdown (.md)
// - HTML (.html)
// - Paligo XML (.xml)
// - JSON (.json)
// - Plaintext (.txt)

interface ExportMenuProps {
  articleTitle: string;
  improvements: any[];
  summary: string;
}

export function ExportMenu({
  articleTitle,
  improvements,
  summary,
}: ExportMenuProps) {
  return (
    <button
      className="btn btn-secondary btn-sm"
      title="Coming in Phase 2"
      disabled
    >
      📥 Export (Phase 2)
    </button>
  );
}