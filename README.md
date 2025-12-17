# Solibri Documentation Assistant

AI-assisted tool for mapping Solibri release notes to existing help articles, identifying documentation gaps, and drafting new articles. Supports per-article and full-analysis exports, plus optional DeepL translations (FI, DE, NL, FR).

## Features

- 📊 Analyze release notes against existing Zendesk articles
- 🧩 Suggest concrete updates and draft content per article
- ✍️ Generate new help articles for documentation gaps
- 📥 Export:
  - Whole analysis (Markdown / XML / JSON)
  - Individual article drafts (Markdown / XML / JSON)
  - New articles (Markdown / XML / JSON / HTML)
- 🌐 Optional translation of drafts and generated articles via DeepL (FI, DE, NL, FR)

## Tech Stack

- Next.js (App Router)
- TypeScript / React
- Zendesk integration for article fetching
- Anthropic Claude (Haiku 4.5) for analysis & drafting
- OpenAI embeddings for article matching
- DeepL API for translations
- Deployed to Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- npm (or yarn/pnpm)
- API keys:
  - `ANTHROPIC_API_KEY`
  - `OPENAI_API_KEY`
  - `DEEPL_API_KEY` (optional, only for translation)

### Installation


