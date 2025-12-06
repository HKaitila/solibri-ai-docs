import { LLMProvider, ProviderError } from "../types";
import { ClaudeProvider } from "./claude";
import { PerplexityProvider } from "./perplexity";

let cachedProvider: LLMProvider | null = null;

export function getLLMProvider(): LLMProvider {
  if (cachedProvider) {
    return cachedProvider;
  }

  const provider = (process.env.LLM_PROVIDER || "claude").toLowerCase();

  try {
    switch (provider) {
      case "claude":
        cachedProvider = new ClaudeProvider();
        break;
      case "perplexity":
        cachedProvider = new PerplexityProvider();
        break;
      case "gpt4":
        throw new Error("GPT-4 provider not yet implemented");
      case "solibri-ai":
        throw new Error("Solibri AI not yet available");
      default:
        throw new Error(`Unknown LLM provider: ${provider}`);
    }

    console.log(`[LLM] Using provider: ${provider}`);
    return cachedProvider;
  } catch (error) {
    throw new ProviderError(
      "factory",
      "INIT_ERROR",
      error instanceof Error ? error.message : "Failed to initialize LLM provider"
    );
  }
}

export function resetLLMProvider(): void {
  cachedProvider = null;
}
