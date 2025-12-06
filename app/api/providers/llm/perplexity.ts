import { LLMProvider, ImpactAnalysis, ProviderError, RateLimitError } from "../types";
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
      const response = await fetch("https://api.perplexity.ai/chat/completions", {
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
      });

      if (response.status === 429) {
        throw new RateLimitError("perplexity", 60);
      }

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.statusText}`);
      }

      const data = await response.json();
      const text = data.choices.message.content;

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
      const response = await fetch("https://api.perplexity.ai/chat/completions", {
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
      });

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices.message.content;
    } catch (error) {
      throw new ProviderError(
        "perplexity",
        "GENERATION_ERROR",
        error instanceof Error ? error.message : "Failed to generate update"
      );
    }
  }

  async translateText(text: string, targetLanguage: string): Promise<string> {
    try {
      const response = await fetch("https://api.perplexity.ai/chat/completions", {
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
      });

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices.message.content;
    } catch (error) {
      throw new ProviderError(
        "perplexity",
        "TRANSLATION_ERROR",
        error instanceof Error ? error.message : "Failed to translate"
      );
    }
  }
}
