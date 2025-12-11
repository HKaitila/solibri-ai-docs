// app/api/providers/llm/perplexity.ts
import {
  LLMProvider,
  ImpactAnalysis,
  ProviderError,
  RateLimitError,
  ReleaseNotesExtraction,
} from "../types";
import { SOLIBRI_SYSTEM_PROMPT } from "../utils/domain-prompts";

export class PerplexityProvider implements LLMProvider {
  private apiKey: string;
  private model = "llama-3.1-sonar-small-128k-online";

  constructor() {
    this.apiKey = process.env.PERPLEXITY_API_KEY || "";
    if (!this.apiKey) {
      throw new Error("PERPLEXITY_API_KEY not set");
    }
  }

  async analyzeImpact(
    notes: string,
    article: string
  ): Promise<ImpactAnalysis> {
    try {
      const response = await fetch(
        "https://api.perplexity.ai/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: this.model,
            messages: [
              {
                role: "system",
                content: SOLIBRI_SYSTEM_PROMPT,
              },
              {
                role: "user",
                content: `Analyze the impact of these release notes against the current help article.

RELEASE NOTES:
${notes}

CURRENT ARTICLE:
${article}

Respond ONLY with valid JSON, no other text.`,
              },
            ],
            temperature: 0.7,
            max_tokens: 1024,
          }),
        }
      );

      if (response.status === 429) {
        throw new RateLimitError("perplexity", 60);
      }

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.statusText}`);
      }

      const data = await response.json();
      const text = data.choices[0].message.content;

      try {
        const parsed = JSON.parse(text);
        return parsed as ImpactAnalysis;
      } catch (parseError) {
        throw new ProviderError(
          "perplexity",
          "PARSE_ERROR",
          `Failed to parse Perplexity response: ${text}`
        );
      }
    } catch (error) {
      if (error instanceof ProviderError || error instanceof RateLimitError) {
        throw error;
      }

      throw new ProviderError(
        "perplexity",
        "UNKNOWN",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  async generateUpdate(notes: string, article: string): Promise<string> {
    try {
      const response = await fetch(
        "https://api.perplexity.ai/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: this.model,
            messages: [
              {
                role: "system",
                content: SOLIBRI_SYSTEM_PROMPT,
              },
              {
                role: "user",
                content: `Generate an updated version of this help article based on the release notes.

RELEASE NOTES:
${notes}

CURRENT ARTICLE:
${article}

Return only the updated article content.`,
              },
            ],
            temperature: 0.7,
            max_tokens: 2048,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      throw new ProviderError(
        "perplexity",
        "GENERATION_ERROR",
        error instanceof Error ? error.message : "Failed to generate update"
      );
    }
  }

  async translateText(
    text: string,
    targetLanguage: string
  ): Promise<string> {
    try {
      const response = await fetch(
        "https://api.perplexity.ai/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: this.model,
            messages: [
              {
                role: "user",
                content: `Translate this technical documentation to ${targetLanguage}. Preserve all markdown, technical terms, and formatting. Return only the translated text.\n\n${text}`,
              },
            ],
            temperature: 0.7,
            max_tokens: 4096,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      throw new ProviderError(
        "perplexity",
        "TRANSLATION_ERROR",
        error instanceof Error ? error.message : "Failed to translate"
      );
    }
  }

  async extractReleaseNotes(
    notes: string
  ): Promise<ReleaseNotesExtraction> {
    try {
      const response = await fetch(
        "https://api.perplexity.ai/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: this.model,
            messages: [
              {
                role: "system",
                content: SOLIBRI_SYSTEM_PROMPT,
              },
              {
                role: "user",
                content: `Extract and categorize the following release notes into features, bug fixes, deprecations, and breaking changes.

RELEASE NOTES:
${notes}

Respond ONLY with valid JSON, no markdown code blocks. Use this structure exactly:
{
  "features": ["feature 1", "feature 2"],
  "bugFixes": ["bug 1", "bug 2"],
  "deprecations": ["deprecated 1"],
  "breakingChanges": ["breaking change 1"]
}`,
              },
            ],
            temperature: 0.7,
            max_tokens: 1024,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.statusText}`);
      }

      const data = await response.json();
      const text = data.choices[0].message.content;

      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          console.error(
            "[Perplexity] No JSON found in extraction response:",
            text
          );
          return {
            features: [],
            bugFixes: [],
            deprecations: [],
            breakingChanges: [],
          };
        }

        const parsed = JSON.parse(jsonMatch[0]);
        return {
          features: Array.isArray(parsed.features) ? parsed.features : [],
          bugFixes: Array.isArray(parsed.bugFixes) ? parsed.bugFixes : [],
          deprecations: Array.isArray(parsed.deprecations)
            ? parsed.deprecations
            : [],
          breakingChanges: Array.isArray(parsed.breakingChanges)
            ? parsed.breakingChanges
            : [],
        };
      } catch (parseError) {
        console.error("[Perplexity] JSON parse failed in extraction:", parseError);
        return {
          features: [],
          bugFixes: [],
          deprecations: [],
          breakingChanges: [],
        };
      }
    } catch (error) {
      console.error("[Perplexity extractReleaseNotes Error]", error);
      return {
        features: [],
        bugFixes: [],
        deprecations: [],
        breakingChanges: [],
      };
    }
  }
}