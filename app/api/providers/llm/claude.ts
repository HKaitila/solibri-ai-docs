import Anthropic from "@anthropic-ai/sdk";
import { LLMProvider, ImpactAnalysis, ProviderError } from "../types";
import { SOLIBRI_SYSTEM_PROMPT } from "../utils/domain-prompts";

export class ClaudeProvider implements LLMProvider {
  private client: Anthropic;
  private model = "claude-3-5-sonnet-20241022";

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY not set");
    }
    this.client = new Anthropic({ apiKey });
  }

  async analyzeImpact(
    notes: string,
    article: string
  ): Promise<ImpactAnalysis> {
    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 1024,
        system: SOLIBRI_SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `Analyze the impact of these release notes against the current help article.

RELEASE NOTES:
${notes}

CURRENT ARTICLE:
${article}

Respond ONLY with valid JSON, no other text. Use this structure exactly:
{
  "score": <number 1-10>,
  "severity": "<CRITICAL|HIGH|MEDIUM|LOW>",
  "category": "<category name>",
  "affectedRoles": ["<role1>", "<role2>"],
  "summary": "<one sentence summary>",
  "actionRequired": "<IMMEDIATE_UPDATE|PLANNED_UPDATE|OPTIONAL>",
  "riskAssessment": "<risk description>"
}`,
          },
        ],
      });

      const text =
        response.content.type === "text" ? response.content.text : "";

      try {
        const parsed = JSON.parse(text);
        if (
          !parsed.score ||
          !parsed.severity ||
          !parsed.summary ||
          !Array.isArray(parsed.affectedRoles)
        ) {
          throw new Error("Invalid response structure");
        }
        return parsed as ImpactAnalysis;
      } catch (parseError) {
        throw new ProviderError(
          "claude",
          "PARSE_ERROR",
          `Failed to parse Claude response: ${text}`
        );
      }
    } catch (error) {
      if (error instanceof ProviderError) throw error;
      if (error instanceof Anthropic.RateLimitError) {
        throw new ProviderError(
          "claude",
          "RATE_LIMIT",
          "Claude rate limited. Please retry in a moment."
        );
      }
      throw new ProviderError(
        "claude",
        "UNKNOWN",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  async generateUpdate(notes: string, article: string): Promise<string> {
    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 2048,
        system: SOLIBRI_SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `Generate an updated version of this help article based on the release notes.

RELEASE NOTES:
${notes}

CURRENT ARTICLE:
${article}

Instructions:
- Preserve the original structure and tone
- Add new information from release notes
- Update existing sections if relevant
- Mark major changes with [NEW] or [UPDATED]
- Return ONLY the updated article content, no explanations.`,
          },
        ],
      });

      return response.content.type === "text" ? response.content.text : "";
    } catch (error) {
      throw new ProviderError(
        "claude",
        "GENERATION_ERROR",
        error instanceof Error ? error.message : "Failed to generate update"
      );
    }
  }

  async translateText(text: string, targetLanguage: string): Promise<string> {
    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: `Translate this technical documentation to ${targetLanguage}.

IMPORTANT RULES:
- Preserve ALL markdown formatting and structure
- Keep technical terms and product names in English (Solibri, SMC, IFC, etc.)
- Maintain the exact same hierarchy and structure
- Keep code blocks, tables, and lists unchanged
- Preserve all hyperlinks and references
- Keep the professional and technical tone

CONTENT TO TRANSLATE:
${text}

Return ONLY the translated text, preserving all formatting exactly.`,
          },
        ],
      });

      return response.content.type === "text" ? response.content.text : "";
    } catch (error) {
      throw new ProviderError(
        "claude",
        "TRANSLATION_ERROR",
        error instanceof Error ? error.message : "Failed to translate"
      );
    }
  }
}
